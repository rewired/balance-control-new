import type { ActionShape, LogEntry, State } from 'boardgame.io';
import { CreateGameReducer, InitializeGame } from '#boardgame-internal';
import { GameConfigSchema, z, type CoreState } from '@bc/rules';
import { stableHash } from '@bc/shared';
import { createBCGame } from './factory.js';
import { hashEngineState, type EngineSnapshot } from './legal-options.js';

const seedSchema = z.union([z.string(), z.number().finite()]);
const sourceSchema = z.object({
  mode: z.enum(['hotseat', 'network', 'bot']),
  matchID: z.string().optional(),
  networkStorage: z.literal('memory').optional(),
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

const count = z.number().int().nonnegative();
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const positionSchema = z.object({
  revision: count,
  turn: count,
  turnPlayer: playerIDSchema,
  stateHash: hash,
  lastTurnHash: hash.nullable(),
  players: z.record(z.object({ boardInfluence: count, resources: z.record(count) }).strict()),
  noise: z.record(count),
  tiles: z.object({ onBoard: count, drawPile: count, discarded: count }).strict(),
}).strict();
const hotseatLogSchema = replaySchema.extend({
  initial: positionSchema,
  steps: z.array(z.object({
    action: actionSchema, stage: z.string().nullable(), placedTile: z.string().optional(), after: positionSchema,
  }).strict()),
  result: z.object({ winners: z.array(playerIDSchema) }).strict().nullable(),
}).strict();

function snapshot(state: EngineSnapshot) {
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

function setupFromState({ G, ctx, plugins }: EngineSnapshot): ReplaySetup {
  return setupSchema.parse({
    game: { ...G.cfg, numPlayers: ctx.numPlayers, matchSeed: G.matchSeed },
    engineSeed: plugins.random?.data?.seed,
  });
}

function decisionContext({ G, ctx }: EngineSnapshot) {
  const stages: Partial<Record<string, string>> = { ...ctx.activePlayers };
  return {
    stages,
    offeredTile: G.exp.core.tiles.drawResolution?.tileId,
  };
}

function stepAfter(action: RecordedAction, before: ReturnType<typeof decisionContext>, state: EngineSnapshot) {
  const stage = before.stages[action.playerID] ?? null;
  const placedTile = action.kind === 'move' && action.move === 'placeTile' ? before.offeredTile : undefined;
  return { action, stage, ...(placedTile && { placedTile }), after: snapshot(state) };
}

function matchResult(state: EngineSnapshot) {
  // CORE-01-09-02..04: use the engine's completed result, including shared victory.
  return (state.ctx.gameover as { winners: string[] } | undefined) ?? null;
}

function recordedAction({ action }: LogEntry): RecordedAction | undefined {
  // CORE disables external GAME_EVENTs. The reducer regenerates internal events.
  if (action.type === 'GAME_EVENT') return undefined;
  const { playerID } = action.payload;
  if (action.type === 'MAKE_MOVE') {
    // Copy only move arguments. Credentials and plugin metadata are outside the replay format.
    const args = JSON.parse(JSON.stringify(action.payload.args ?? [])) as unknown[];
    return actionSchema.parse({ kind: 'move', playerID, move: action.payload.type, args });
  }
  return actionSchema.parse({ kind: action.type === 'UNDO' ? 'undo' : 'redo', playerID });
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
    const previousRevision = state._stateID;
    const context = decisionContext(state);
    // FlatFile reloads the current state and undo history as separate JSON objects before each action.
    const before = source.mode === 'network' && source.networkStorage !== 'memory'
      ? JSON.parse(JSON.stringify(state)) as State<CoreState> : state;
    state = reduce(before, replayAction(action));
    if (state._stateID !== previousRevision + 1) throw new Error(`Replay rejected the action at revision ${previousRevision + 1}`);
    const step = stepAfter(action, context, state);
    check?.(step.after);
    return step;
  });
  return { version: 1 as const, source, setup, initial, steps, result: matchResult(state) };
}

export type MatchLog = ReturnType<typeof replay>;

export function createMatchLogRecorder(state: EngineSnapshot, source: MatchLogSource, existing?: MatchLog) {
  const position = snapshot(state);
  let log: MatchLog = existing ?? {
    version: 1, source: sourceSchema.parse(source), setup: setupFromState(state),
    initial: position, steps: [], result: matchResult(state),
  };
  const checkpoint = log.steps.at(-1)?.after ?? log.initial;
  if (checkpoint.revision !== state._stateID || checkpoint.stateHash !== position.stateHash) {
    throw new Error('Match log does not match the current revision');
  }
  let context = decisionContext(state);
  return {
    get log() { return log; },
    record(next: EngineSnapshot, delta: readonly LogEntry[]) {
      const revision = log.steps.length;
      if (next._stateID === revision) return log;
      const entry = delta.find(item => item.action.type !== 'GAME_EVENT');
      const action = entry && recordedAction(entry);
      if (!action || next._stateID !== revision + 1 || entry?._stateID !== revision) {
        throw new Error(`Incomplete match history at revision ${revision}`);
      }
      const step = stepAfter(action, context, next);
      context = decisionContext(next);
      log = { ...log, steps: [...log.steps, step], result: matchResult(next) };
      return log;
    },
  };
}

export function parseHotseatMatchLog(value: unknown, matchID: string): MatchLog | undefined {
  const parsed = hotseatLogSchema.safeParse(value);
  if (!parsed.success || parsed.data.source.mode !== 'hotseat' || parsed.data.source.matchID !== matchID) return undefined;
  const { initial, steps } = parsed.data;
  if (initial.revision !== 0 || steps.some(({ after }, index) => after.revision !== index + 1)) return undefined;
  return parsed.data;
}

/** Use the accepted log of a local client or the server, never an optimistic network client. */
export function createMatchLog(
  initialState: State<CoreState>, currentState: State<CoreState>, log: readonly LogEntry[], source: MatchLogSource,
): MatchLog {
  const setup = setupFromState(initialState);
  const actions: RecordedAction[] = [];
  for (const entry of log) {
    const action = recordedAction(entry);
    if (!action) continue;
    if (entry._stateID !== actions.length) throw new Error(`Incomplete match history at revision ${actions.length}`);
    actions.push(action);
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
