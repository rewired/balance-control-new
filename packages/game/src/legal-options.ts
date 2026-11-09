import type { Game, State } from 'boardgame.io';
import { CreateGameReducer } from '#boardgame-internal';
import type { CoreState } from '@bc/rules';
import { stableHash } from '@bc/shared';
import { coreStateForHash, engineMoveOptions, type EngineMoveOption } from '@bc/exp-00-core';

export { engineMoveOptions, type EngineMoveOption } from '@bc/exp-00-core';

export interface LegalMoveOption extends EngineMoveOption {
  resultingStateHashPreview: string;
}

export type EngineSnapshot = Pick<State<CoreState>, 'G' | 'ctx' | 'plugins' | '_stateID'>;

export function hashEngineState({ G, ctx }: Pick<State<CoreState>, 'G' | 'ctx'>): string {
  return stableHash({ G: coreStateForHash(G), ctx });
}

// CORE-01-04-09A..09C: include engine events such as automatic slot completion in the preview.
export function* previewEngineOptions(game: Game<CoreState>, state: EngineSnapshot, options: Iterable<EngineMoveOption>) {
  const reduce = CreateGameReducer({ game });
  for (const option of options) {
    // boardgame.io can change nested stage counters while advancing a move.
    const snapshot = structuredClone({
      G: state.G, ctx: state.ctx, plugins: state.plugins, _stateID: state._stateID, _undo: [], _redo: [],
    });
    const next = reduce(snapshot, {
      type: 'MAKE_MOVE',
      payload: { type: option.moveType, args: option.parameters, playerID: option.playerID },
    });
    if (next._stateID !== state._stateID) yield { option, next };
  }
}

// AGENTS §4.3: attach engine previews for validation inside the runner.
export function legalMoveOptions(game: Game<CoreState>, state: EngineSnapshot, playerID: string,
  options = engineMoveOptions(state.G, state.ctx, playerID)): LegalMoveOption[] {
  return Array.from(previewEngineOptions(game, state, options), ({ option, next }) => ({
    ...option, resultingStateHashPreview: hashEngineState(next),
  }));
}
