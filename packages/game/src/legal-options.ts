import type { Game, State } from 'boardgame.io';
import { CreateGameReducer } from '#boardgame-internal';
import type { CoreState } from '@bc/rules';
import { stableHash } from '@bc/shared';
import { coreStateForHash, engineMoveOptions, type EngineMoveOption } from '@bc/exp-00-core';

export { engineMoveOptions, type EngineMoveOption } from '@bc/exp-00-core';

export interface LegalMoveOption extends EngineMoveOption {
  resultingStateHashPreview: string;
}

export function hashEngineState({ G, ctx }: Pick<State<CoreState>, 'G' | 'ctx'>): string {
  return stableHash({ G: coreStateForHash(G), ctx });
}

// AGENTS §4.3: previews include the same engine events as actual play, including automatic slot skips.
export function legalMoveOptions(game: Game<CoreState>, state: State<CoreState>, playerID: string): LegalMoveOption[] {
  const reduce = CreateGameReducer({ game });
  return engineMoveOptions(state.G, state.ctx, playerID).flatMap(option => {
    // boardgame.io can change nested stage counters while advancing a move.
    const snapshot = structuredClone({
      G: state.G, ctx: state.ctx, plugins: state.plugins, _stateID: state._stateID, _undo: [], _redo: [],
    });
    const next = reduce(snapshot, {
      type: 'MAKE_MOVE',
      payload: { type: option.moveType, args: option.parameters, playerID },
    });
    return next._stateID === state._stateID ? [] : [{ ...option, resultingStateHashPreview: hashEngineState(next) }];
  });
}
