#!/usr/bin/env node
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = ts.readConfigFile(fileURLToPath(new URL('../tsconfig.base.json', import.meta.url)), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const project = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
if (project.errors.length) throw new Error(ts.flattenDiagnosticMessageText(project.errors[0].messageText, '\n'));
const repoPath = file => relative(root, file).replaceAll('\\', '/');
const files = project.fileNames.filter(file =>
  /^packages\/[^/]+\/src\/.*\.tsx?$/.test(repoPath(file)) && !/\.(?:test|spec|d)\.tsx?$/.test(file));
const program = ts.createProgram(files, { ...project.options, jsx: ts.JsxEmit.ReactJSX });
const checker = program.getTypeChecker();
const allowed = new Set(['packages/rules/src/effects.ts', 'packages/game/src/counter.ts']);
const collectionMutations = new Set(['add', 'clear', 'copyWithin', 'delete', 'fill', 'pop', 'push',
  'reverse', 'set', 'shift', 'sort', 'splice', 'unshift']);
const objectMutations = new Set(['Object.assign', 'Object.defineProperty', 'Object.defineProperties',
  'Object.setPrototypeOf', 'Reflect.defineProperty', 'Reflect.deleteProperty', 'Reflect.set']);
const memberReaders = new Set(['at', 'find', 'findLast', 'pop', 'shift']);
const memberCallbacks = new Set(['every', 'filter', 'find', 'findIndex', 'findLast', 'findLastIndex', 'flatMap',
  'forEach', 'map', 'reduce', 'reduceRight', 'some', 'sort']);

function stateReference(node, seen = new Set()) {
  if (!node || seen.has(node)) return false;
  seen.add(node);
  if (checker.getTypeAtLocation(node).getSymbol()?.getName() === 'CoreState') return true;
  const fromState = expression => stateReference(expression, seen);
  if (ts.isPropertyAccessExpression(node)) return fromState(node.expression);
  if (ts.isElementAccessExpression(node)) return arrayWithStateMembers(node.expression, seen);
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node) ||
      ts.isSatisfiesExpression(node) || ts.isTypeAssertionExpression(node)) return fromState(node.expression);
  if (ts.isBinaryExpression(node) &&
      [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(node.operatorToken.kind)) {
    return fromState(node.left) || fromState(node.right);
  }
  if (ts.isConditionalExpression(node)) return fromState(node.whenTrue) || fromState(node.whenFalse);
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    return memberReaders.has(node.expression.name.text) && arrayWithStateMembers(node.expression.expression, seen);
  }
  if (!ts.isIdentifier(node)) return false;
  let declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
  while (declaration && ts.isBindingElement(declaration)) {
    const binding = declaration;
    const parent = declaration.parent.parent;
    const field = binding.propertyName ?? binding.name;
    if (ts.isIdentifier(field)) {
      const property = checker.getTypeAtLocation(parent).getProperty(field.text);
      if (property && checker.getTypeOfSymbolAtLocation(property, parent).getSymbol()?.getName() === 'CoreState') return true;
    }
    declaration = parent;
  }
  if (!declaration) return false;
  if (ts.isVariableDeclaration(declaration)) {
    if (declaration.initializer) return fromState(declaration.initializer);
    const statement = declaration.parent.parent;
    return ts.isForOfStatement(statement) && arrayWithStateMembers(statement.expression, seen);
  }
  if (ts.isParameter(declaration)) {
    const call = declaration.parent.parent;
    return ts.isCallExpression(call) && ts.isPropertyAccessExpression(call.expression) &&
      memberCallbacks.has(call.expression.name.text) && arrayWithStateMembers(call.expression.expression, seen);
  }
  return false;
}

function arrayWithStateMembers(node, seen) {
  if (stateReference(node, new Set(seen))) return true;
  if (seen.has(node)) return false;
  seen.add(node);
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const { expression, name } = node.expression;
    if (expression.getText() === 'Object' && ['entries', 'values'].includes(name.text)) {
      return stateReference(node.arguments[0], seen);
    }
    return ['filter', 'slice', 'toSorted', 'toReversed'].includes(name.text) && arrayWithStateMembers(expression, seen);
  }
  if (ts.isIdentifier(node)) {
    const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
    return Boolean(declaration && ts.isVariableDeclaration(declaration) && declaration.initializer &&
      arrayWithStateMembers(declaration.initializer, seen));
  }
  return false;
}

function mutatesCoreState(node) {
  if (ts.isBinaryExpression(node) && node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
    return !ts.isIdentifier(node.left) && stateReference(node.left);
  }
  if (ts.isDeleteExpression(node)) return stateReference(node.expression);
  if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)) {
    return !ts.isIdentifier(node.operand) && stateReference(node.operand);
  }
  if (!ts.isCallExpression(node)) return false;
  const { expression } = node;
  if (ts.isPropertyAccessExpression(expression)) {
    return (collectionMutations.has(expression.name.text) && stateReference(expression.expression)) ||
      (objectMutations.has(expression.getText()) && stateReference(node.arguments[0]));
  }
  return ts.isElementAccessExpression(expression) && ts.isStringLiteral(expression.argumentExpression) &&
    collectionMutations.has(expression.argumentExpression.text) && stateReference(expression.expression);
}

const offenders = [];
for (const path of files) {
  const file = repoPath(path);
  if (allowed.has(file)) continue;
  const source = program.getSourceFile(path);
  function visit(node) {
    if (mutatesCoreState(node)) {
      const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
      offenders.push(`${file}:${line + 1}:${character + 1} ${node.getText(source).split('\n')[0]}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

if (offenders.length) {
  console.error(`Direct CoreState writes outside the resolver:\n${offenders.join('\n')}`);
  process.exitCode = 2;
} else {
  console.log('Mutation check passed.');
}
