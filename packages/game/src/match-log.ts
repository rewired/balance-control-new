import type { ActionShape, LogEntry, State } from 'boardgame.io';
import { CreateGameReducer, InitializeGame } from '#boardgame-internal';
import { GameConfigSchema, z, type CoreState } from '@bc/rules';
import { stableHash } from '@bc/shared';
import { createBCGame } from './factory.js';
import { hashEngineState } from './legal-options.js';

const seedSchema = z.union([z.string(), z.number().finite()]);
const sourceSchema = z.object({
  mode: z.enum(['hotseat', 'network', 'bot']),
  matchID: z.string().optional(),
  seats: z.record(z.string()).optional(),
  openingTurns: z.number().int().nonnegative().optional(),
  ollamaRequests: z.number().int().nonnegative().optional(),
  ollamaFallbacks: z.number().int().nonnegative().optional(),
}).strict();
export type MatchLogSource = z.infer<typeof sourceSchema>;

const playerIDSchema = z.string().regex(/^[0-5]$/);
const actionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('move'), playerID: playerIDSchema, move: z.string(), args: z.array(z.unknown()) }).strict(),
  z.object({ kind: z.literal('undo'), playerID: playerIDSchema }).strict(),
  z.object({ kind: z.literal('redo'), playerID: playerIDSchema }).strict(),
]);
type RecordedAction = z.infer<typeof actionSchema>;

const setupSchema = z.object({ game: GameConfigSchema, engineSeed: seedSchema }).strict();
type ReplaySetup = z.infer<typeof setupSchema>;
const replaySchema = z.object({
  version: z.literal(1),
  source: sourceSchema,
  setup: setupSchema,
  initial: z.object({ stateHash: z.string() }),
  steps: z.array(z.object({ action: actionSchema, after: z.object({ stateHash: z.string() }) })),
});

function snapshot(state: State<CoreState>) {
  const { G, ctx, _stateID } = state;
  const { players, influencesOnBoard, resources, tiles } = G.exp.core;
  return {
    revision: _stateID,
    turn: ctx.turn,
    turnPlayer: ctx.currentPlayer,
    stateHash: hashEngineState(state),
    lastTurnHash: G.lastTurnHash ?? null,
    players: Object.fromEntries(ctx.playOrder.map(id => [id, {
      boardInfluence: (influencesOnBoard ?? []).filter(marker => marker.owner === id).length,
      resources: { ...players[id].personal.resources },
    }])),
    noise: { ...resources.noise },
    tiles: { onBoard: tiles.board.length, drawPile: tiles.drawPile.length, discarded: tiles.discardFaceUp.length },
  };
}

function replayAction(action: RecordedAction): ActionShape.MakeMove | ActionShape.Undo | ActionShape.Redo {
  if (action.kind === 'move') {
    return { type: 'MAKE_MOVE', payload: { type: action.move, args: action.args, playerID: action.playerID } };
  }
  const payload = { type: null, args: null, playerID: action.playerID };
  return action.kind === 'undo' ? { type: 'UNDO', payload } : { type: 'REDO', payload };
}

function replay(setup: ReplaySetup, source: MatchLogSource, actions: readonly RecordedAction[],
  check?: (position: ReturnType<typeof snapshot>) => void) {
  const { numPlayers, ...setupData } = setup.game;
  const game = { ...createBCGame(setupData), seed: setup.engineSeed };
  const reduce = CreateGameReducer({ game });
  let state: State<CoreState> = InitializeGame({ game, numPlayers, setupData });
  const initial = snapshot(state);
  check?.(initial);
  const steps = actions.map(action => {
    const { ctx, G, _stateID } = state;
    const stage = ctx.activePlayers?.[action.playerID] ?? null;
    const placedTile = action.kind === 'move' && action.move === 'placeTile' ? G.exp.core.tiles.drawResolution?.tileId : undefined;
    // FlatFile reloads the current state and undo history as separate JSON objects before each action.
    const before = source.mode === 'network' ? JSON.parse(JSON.stringify(state)) as State<CoreState> : state;
    state = reduce(before, replayAction(action));
    if (state._stateID !== _stateID + 1) throw new Error(`Replay rejected the action at revision ${_stateID + 1}`);
    const after = snapshot(state);
    check?.(after);
    return { action, stage, ...(placedTile && { placedTile }), after };
  });
  // CORE-01-09-02..04: use the engine's completed result, including shared victory.
  const gameover = state.ctx.gameover as { winners: string[] } | undefined;
  return { version: 1 as const, source, setup, initial, steps, result: gameover ?? null };
}

export type MatchLog = ReturnType<typeof replay>;

/** Use the accepted log of a local client or the server, never an optimistic network client. */
export function createMatchLog(
  initialState: State<CoreState>, currentState: State<CoreState>, log: readonly LogEntry[], source: MatchLogSource,
): MatchLog {
  const { G, ctx, plugins } = initialState;
  const setup = setupSchema.parse({
    game: { ...G.cfg, numPlayers: ctx.numPlayers, matchSeed: G.matchSeed },
    engineSeed: plugins.random?.data?.seed,
  });
  const actions: RecordedAction[] = [];
  for (const entry of log) {
    const { action } = entry;
    // CORE disables external GAME_EVENTs. Internal events are regenerated even if boardgame.io omits its automatic flag.
    if (action.type === 'GAME_EVENT') continue;
    if (entry._stateID !== actions.length) throw new Error(`Incomplete match history at revision ${actions.length}`);
    const { playerID } = action.payload;
    if (action.type === 'MAKE_MOVE') {
      // Whitelist the action fields; do not export credentials, patches, or plugin metadata.
      const args = JSON.parse(JSON.stringify(action.payload.args ?? [])) as unknown[];
      actions.push(actionSchema.parse({ kind: 'move', playerID, move: action.payload.type, args }));
    } else if (action.type === 'UNDO' || action.type === 'REDO') {
      actions.push(actionSchema.parse({ kind: action.type === 'UNDO' ? 'undo' : 'redo', playerID }));
    } else {
      throw new Error(`Unsupported match action at revision ${entry._stateID}`);
    }
  }
  if (actions.length !== currentState._stateID) throw new Error('Match history does not reach the current revision');
  const initialHash = hashEngineState(initialState);
  const result = replay(setup, sourceSchema.parse(source), actions, position => {
    if (position.revision === 0 && position.stateHash !== initialHash) throw new Error('Initial state differs from replay setup');
  });
  if ((result.steps.at(-1)?.after ?? result.initial).stateHash !== hashEngineState(currentState)) {
    throw new Error('Replay does not reproduce the current match state');
  }
  return result;
}

/** Recompute all checkpoints and statistics from a JSON export. */
export function verifyMatchLog(value: unknown): MatchLog {
  const { setup, source, initial, steps } = replaySchema.parse(value);
  const result = replay(setup, source, steps.map(step => step.action), ({ revision, stateHash }) => {
    const expected = revision === 0 ? initial : steps[revision - 1].after;
    if (stateHash !== expected.stateHash) throw new Error(`Replay state hash differs at revision ${revision}`);
  });
  if (stableHash(result) !== stableHash(value)) throw new Error('Match log data differs from replay');
  return result;
}
