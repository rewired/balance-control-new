import { z, ZodFirstPartyTypeKind, type ZodTypeAny } from 'zod';
import type { CoreState } from './types.js';
import { createExpansionRegistry, type ExpansionModule } from './expansion-registry.js';
import { createResolver, type PoliticalActionEffect, type ResolveResult } from './effects.js';
import { createMatchResourceRegistry } from './resources.js';

// MoveDefinition is rules-only (no boardgame.io types here per AGENTS §1.2)
export interface MoveDefinition<P> {
  type: string; // canonical move id (stable)
  payloadSchema: ZodTypeAny; // strict schema per AGENTS §4.2
  execute: (G: CoreState, playerID: string, payload: P) => ResolveResult;
  isPlayMeasure?: true;
  enumerate?: (G: CoreState, playerID: string) => P[]; // optional deterministic enumerator (AGENTS §4.1)
}

export interface MoveCatalog {
  types: string[]; // stable lexicographic order for determinism
  schemas: Record<string, ZodTypeAny>;
  definitions: Record<string, MoveDefinition<unknown>>;
}

export interface MoveExtensionBuilder {
  add<P>(def: MoveDefinition<P>): void;
}

export function buildMoveCatalog(coreMoves: MoveDefinition<unknown>[], modules: ExpansionModule[]): MoveCatalog {
  const defs: Record<string, MoveDefinition<unknown>> = Object.create(null);
  const schemas: Record<string, ZodTypeAny> = Object.create(null);

  const add = <P>(def: MoveDefinition<P>) => {
    if (defs[def.type]) throw new Error(`Duplicate move type: ${def.type}`);
    // Ensure schema is strict (no passthrough)
    const s = def.payloadSchema;
    // zod objects should be strict; other schema types are fine
    if ('_def' in s && (s as unknown as { _def?: { typeName?: unknown; unknownKeys?: unknown } })._def?.typeName === ZodFirstPartyTypeKind.ZodObject) {
      const isStrict = (s as unknown as { _def?: { typeName?: unknown; unknownKeys?: unknown } })._def?.unknownKeys === 'strict';
      if (!isStrict) throw new Error(`Move schema for ${def.type} must be strict (AGENTS §4.2)`);
    }
    defs[def.type] = {
      ...def,
      // The router supplies the output of the registered payload schema.
      execute: (G, playerID, payload) => def.execute(G, playerID, payload as P),
    };
    schemas[def.type] = s;
  };

  // Seed with core moves
  for (const m of coreMoves) add(m);

  // Let enabled expansion modules extend moves (AGENTS §3.8)
  for (const mod of modules) {
    mod.extendMoves?.({ add });
  }

  const types = Object.keys(defs).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return { types, schemas, definitions: defs };
}

function corePoliticalMove<P>(
  type: PoliticalActionEffect['kind'],
  payloadSchema: z.ZodType<P>,
  describe: (playerID: string, payload: P) => PoliticalActionEffect,
  candidates: (G: CoreState, playerID: string) => Iterable<P>,
): MoveDefinition<unknown> {
  const resolve = createResolver();
  return {
    type,
    payloadSchema,
    execute: (G, playerID, input) => {
      const parsed = payloadSchema.safeParse(input);
      return parsed.success ? resolve(G, describe(playerID, parsed.data)) : { ok: false, reason: 'invalid-payload' };
    },
    enumerate: (G, playerID) => Array.from(candidates(G, playerID))
      .filter(payload => resolve.previewPoliticalAction(G, describe(playerID, payload))),
  };
}

function* paymentCombinations(resources: string[], size: number, offset = 0): Generator<string[]> {
  if (size === 0) {
    yield [];
    return;
  }
  for (let i = offset; i < resources.length; i++) {
    for (const rest of paymentCombinations(resources, size - 1, i)) yield [resources[i], ...rest];
  }
}

function matchResources(G: CoreState): string[] {
  return createMatchResourceRegistry(createExpansionRegistry(G.cfg.expansions)).list();
}

const id = z.string().min(1);

// CORE-01-04-09/-09A: enumerate targets and payments using the same plan as execution.
export function corePoliticalMoves(): MoveDefinition<unknown>[] {
  return [
    corePoliticalMove(
      'placeOrMoveInfluence',
      z.object({ markerId: id, targetTileId: id, sourceTileId: id.optional() }).strict(),
      (playerID, payload) => ({ kind: 'placeOrMoveInfluence', playerID, ...payload }),
      function* (G, playerID) {
        for (const { tileId: targetTileId } of G.tiles.board) {
          if (G.allTiles[targetTileId].kind === 'StartCommittee') continue;
          for (const marker of G.players[playerID]?.personal.influence ?? []) {
            yield { markerId: marker.id, targetTileId };
          }
          for (const marker of G.influencesOnBoard ?? []) {
            if (marker.owner === playerID && marker.tileId !== targetTileId) {
              yield { markerId: marker.id, sourceTileId: marker.tileId, targetTileId };
            }
          }
        }
      },
    ),
    corePoliticalMove(
      'formalizeInfluence',
      z.object({ tileId: id, resources: z.array(id).min(2).max(4) }).strict(),
      (playerID, payload) => ({ kind: 'formalizeInfluence', playerID, ...payload }),
      function* (G) {
        const resources = matchResources(G);
        for (const { tileId } of G.tiles.board) {
          const kind = G.allTiles[tileId].kind;
          if (kind !== 'Committee' && kind !== 'StartCommittee') continue;
          for (const payment of paymentCombinations(resources, kind === 'Committee' ? 2 : 4)) {
            yield { tileId, resources: payment };
          }
        }
      },
    ),
    corePoliticalMove(
      'convertResources',
      z.object({ tileId: id, input: id, output: id }).strict(),
      (playerID, payload) => ({ kind: 'convertResources', playerID, ...payload }),
      function* (G) {
        const resources = matchResources(G);
        for (const { tileId } of G.tiles.board) {
          if (G.allTiles[tileId].kind !== 'Grassroots') continue;
          for (const input of resources) {
            for (const output of resources) {
              if (input !== output) yield { tileId, input, output };
            }
          }
        }
      },
    ),
  ];
}

export function* politicalMoveOptions(G: CoreState, playerID: string, additional = false) {
  const catalog = buildMoveCatalog(corePoliticalMoves(), createExpansionRegistry(G.cfg.expansions));
  for (const type of catalog.types) {
    const definition = catalog.definitions[type];
    if (additional && definition.isPlayMeasure) continue;
    for (const payload of definition.enumerate?.(G, playerID) ?? []) yield { type, payload };
  }
}



