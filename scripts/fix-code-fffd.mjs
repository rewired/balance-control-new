import { readFileSync, writeFileSync } from 'node:fs';
const files=['packages/rules/src/effects.ts','packages/rules/src/moves.catalog.test.ts','packages/rules/src/moves.ts','packages/rules/src/production.hooks.test.ts'];
for (const f of files){
  let s=readFileSync(f,'utf8');
  const before=s;
  s=s.replace(/AGENTS \uFFFD/g,'AGENTS -');
  s=s.replace(/\) \uFFFD call/g,') - call');
  s=s.replace(/ \uFFFD Task /g,' - Task ');
  if (s!==before){ writeFileSync(f,s,'utf8'); console.log('fixed',f); }
}