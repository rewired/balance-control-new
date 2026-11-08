import type { State } from 'boardgame.io';
import type { CoreState } from '@bc/rules';
import { migrateCoreState, type LegacyCoreState } from './state-migration.js';

function migrateSnapshot<T extends { G: unknown }>(snapshot: T): T {
  const G = migrateCoreState(snapshot.G);
  return G === snapshot.G ? snapshot : { ...snapshot, G };
}

export function migrateCoreMatchState(state: State<CoreState | LegacyCoreState>): State<CoreState>;
export function migrateCoreMatchState(state: State<unknown>): State<unknown>;
export function migrateCoreMatchState(state: State<unknown>): State<unknown> {
  const current = migrateSnapshot(state);
  const undo = state._undo.map(migrateSnapshot);
  const redo = state._redo.map(migrateSnapshot);
  if (current === state && undo.every((entry, index) => entry === state._undo[index])
      && redo.every((entry, index) => entry === state._redo[index])) return state;
  return { ...current, _undo: undo, _redo: redo };
}
