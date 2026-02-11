import { z, ZodFirstPartyTypeKind, type ZodTypeAny } from 'zod';
import type { CoreState } from './types.js';
import type { ExpansionModule } from './expansion-registry.js';

// MoveDefinition is rules-only (no boardgame.io types here per AGENTS §1.2)
export interface MoveDefinition<P> {
  type: string; // canonical move id (stable)
  payloadSchema: ZodTypeAny; // strict schema per AGENTS §4.2
  execute: (G: CoreState, payload: P) => void; // pure state mutation
  enumerate?: (G: CoreState) => P[]; // optional deterministic enumerator (AGENTS §4.1)
}

export interface MoveCatalog {
  types: string[]; // stable lexicographic order for determinism
  schemas: Record<string, ZodTypeAny>;
  definitions: Record<string, MoveDefinition<unknown>>;
}

export interface MoveExtensionBuilder {
  add(def: MoveDefinition<unknown>): void;
}

export function buildMoveCatalog(coreMoves: MoveDefinition<unknown>[], modules: ExpansionModule[]): MoveCatalog {
  const defs: Record<string, MoveDefinition<unknown>> = Object.create(null);
  const schemas: Record<string, ZodTypeAny> = Object.create(null);

  const add = (def: MoveDefinition<unknown>) => {
    if (defs[def.type]) throw new Error(`Duplicate move type: ${def.type}`);
    // Ensure schema is strict (no passthrough)
    const s = def.payloadSchema;
    // zod objects should be strict; other schema types are fine
    if ('_def' in s && (s as unknown as { _def?: { typeName?: unknown; unknownKeys?: unknown } })._def?.typeName === ZodFirstPartyTypeKind.ZodObject) {
      const isStrict = (s as unknown as { _def?: { typeName?: unknown; unknownKeys?: unknown } })._def?.unknownKeys === 'strict';
      if (!isStrict) throw new Error(`Move schema for ${def.type} must be strict (AGENTS §4.2)`);
    }
    defs[def.type] = def;
    schemas[def.type] = s;
  };

  // Seed with core moves
  for (const m of coreMoves) add(m as MoveDefinition<unknown>);

  // Let enabled expansion modules extend moves (AGENTS §3.8)
  for (const mod of modules) {
    mod.extendMoves?.({ add });
  }

  const types = Object.keys(defs).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return { types, schemas, definitions: defs };
}

// Core political moves (ExactlyOnePoliticalAction phase)
// CORE-01-04-09: Exactly one political action (noop placeholder)
export function corePoliticalMoves(): MoveDefinition<unknown>[] {
  return [
    {
      type: 'chooseNoop',
      payloadSchema: z.object({}).strict(),
      execute: (G, payload) => {
        void G; void payload;
        // No state change; endTurn handled by game layer.
      },
      enumerate: () => [ {} ],
    },
  ];
}




