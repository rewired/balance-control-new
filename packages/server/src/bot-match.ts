import { Client } from '#boardgame-client';
import { existsSync, readFileSync } from 'node:fs';
import {
  chooseComputerMove, createBCGame, createComputerPosition, createMatchLog, engineMoveOptions, hashEngineState, legalMoveOptions,
  type EngineMoveOption, type EngineSnapshot, type MatchLog, type MatchLogSource,
} from '@bc/game';
import { chooseOllamaMove, createBotPositionDescriber, type LLMBackend, type LLMFallback } from '@bc/bot-llm';

const rulesDir = [new URL('../../../docs/rules/', import.meta.url), new URL('../../../../docs/rules/', import.meta.url)]
  .find(dir => existsSync(new URL('000-core.md', dir)));

export const describeBotPosition = createBotPositionDescriber(file => {
  if (!rulesDir) throw new Error('Cannot find the normative rules directory');
  return readFileSync(new URL(file, rulesDir), 'utf8');
});

type CoreGame = ReturnType<typeof createBCGame>;
type Policy = (game: CoreGame, state: EngineSnapshot, playerID: string) => EngineMoveOption | undefined | Promise<EngineMoveOption | undefined>;
type BotLogging = { model?: string; onLog: (log: MatchLog) => void | Promise<void> };

const firstLegal: Policy = (_game, { G, ctx }, playerID) => engineMoveOptions(G, ctx, playerID)[0];
const hotseat: Policy = (game, state, playerID) => chooseComputerMove(game, createComputerPosition(state), playerID);

function ollamaPolicy(backend: LLMBackend, onRequest?: () => void, onFallback?: (reason: LLMFallback, error?: unknown) => void): Policy {
  return (game, state, playerID) => chooseOllamaMove(game, createComputerPosition(state), playerID,
    describeBotPosition, backend, onRequest, onFallback);
}

async function playBotMatch(game: CoreGame, policy: Policy, endTurn: number, openingTurns: number,
  logSource?: () => MatchLogSource) {
  const client = Client({ game, numPlayers: 2, playerID: '0' });
  const initialState = logSource && structuredClone(client.getInitialState());
  let state: EngineSnapshot = client.store.getState();
  let openingHash: string | undefined;
  while (state.ctx.gameover === undefined && state.ctx.turn <= endTurn) {
    const { ctx, _stateID } = state;
    const playerID = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
    const isOpening = ctx.turn <= openingTurns;
    if (!isOpening) openingHash ??= hashEngineState(state);
    const choice = await (isOpening ? firstLegal : policy)(game, state, playerID);
    // CORE-01-04-09A..09C: the engine skips a political slot with no legal actions.
    if (!choice || choice.playerID !== playerID) throw new Error(`No legal move for active player ${playerID} on turn ${ctx.turn}`);
    // Validate the selected option against the live reducer. This private preview never reaches a policy or prompt.
    const [preview] = legalMoveOptions(game, state, playerID, [choice]);
    if (!preview) throw new Error(`Illegal ${choice.moveType} from player ${playerID} on turn ${ctx.turn}`);
    client.updatePlayerID(playerID);
    client.moves[choice.moveType](...choice.parameters);
    state = client.store.getState();
    if (state._stateID === _stateID || hashEngineState(state) !== preview.resultingStateHashPreview) {
      throw new Error(`Engine result differed from the preview of ${choice.moveType} on turn ${ctx.turn}`);
    }
  }
  // CORE-01-09-03/-04: report board Influence and take the winner list from the engine.
  const markers = state.G.exp.core.influencesOnBoard ?? [];
  const scores = Object.fromEntries(state.ctx.playOrder.map(id => [id, markers.filter(marker => marker.owner === id).length]));
  return { turn: state.ctx.turn, gameover: state.ctx.gameover as { winners: string[] } | undefined,
    hash: hashEngineState(state), scores, openingHash,
    log: initialState && logSource && createMatchLog(initialState, client.store.getState(), client.log ?? [], logSource()) };
}

export async function runBotMatch(turns: number, backend?: LLMBackend, game = createBCGame({
  matchSeed: 'runner', expansions: { exp01: true },
}), logging?: BotLogging) {
  if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError('Turn count must be a nonnegative integer');
  let ollamaRequests = 0;
  let ollamaFallbacks = 0;
  const policy = backend ? ollamaPolicy(backend, () => ollamaRequests++, () => ollamaFallbacks++) : firstLegal;
  const seat = backend ? `ollama:${logging?.model ?? 'unknown'}` : 'first-legal';
  const { turn, gameover, hash, log } = await playBotMatch(game, policy, turns, 0, logging && (() => ({
    mode: 'bot', seats: { '0': seat, '1': seat },
    ...(backend && { ollamaRequests, ollamaFallbacks }),
  })));
  if (log) await logging?.onLog(log);
  return { turn, gameover, hash };
}

interface DuelGame {
  seed: string;
  ollamaSeat: '0' | '1';
  turn: number;
  scores: { ollama: number; hotseat: number };
  outcome: 'ollama' | 'hotseat' | 'draw';
  requests: number;
  fallbacks: number;
}

export async function runBotDuel(seeds: readonly string[], backend: LLMBackend, {
  openingTurns = 0,
  makeGame = (matchSeed: string) => createBCGame({ matchSeed }),
  onProgress,
  onGame,
  logging,
}: {
  openingTurns?: number;
  makeGame?: (seed: string) => CoreGame;
  onProgress?: (progress: Pick<DuelGame, 'seed' | 'ollamaSeat' | 'turn' | 'requests' | 'fallbacks'>) => void;
  onGame?: (result: DuelGame) => void;
  logging?: BotLogging;
} = {}) {
  if (!seeds.length || new Set(seeds).size !== seeds.length || seeds.some(seed => !seed.trim())) {
    throw new RangeError('Provide one or more distinct, nonempty match seeds');
  }
  if (!Number.isSafeInteger(openingTurns) || openingTurns < 0) throw new RangeError('Opening turns must be a nonnegative integer');
  const totals = { ollama: 0, hotseat: 0, draw: 0, excludedPairs: 0 };
  for (const seed of seeds) {
    let openingHash: string | undefined;
    const pair: DuelGame[] = [];
    for (const ollamaSeat of ['0', '1'] as const) {
      let requests = 0;
      let fallbacks = 0;
      let reportedTurn: number | undefined;
      const llm = ollamaPolicy(backend, () => requests++, (reason, error) => {
        if (reason === 'backend-error') throw new Error('Ollama request failed. The duel cannot be scored.', { cause: error });
        fallbacks++;
      });
      const policy: Policy = (game, state, playerID) => {
        const { turn } = state.ctx;
        if (reportedTurn === undefined || (turn % 10 === 0 && turn !== reportedTurn)) {
          onProgress?.({ seed, ollamaSeat, turn, requests, fallbacks });
          reportedTurn = turn;
        }
        return (playerID === ollamaSeat ? llm : hotseat)(game, state, playerID);
      };
      const hotseatSeat = ollamaSeat === '0' ? '1' : '0';
      const result = await playBotMatch(makeGame(seed), policy, Infinity, openingTurns, logging && (() => ({
        mode: 'bot', openingTurns, seats: { [ollamaSeat]: `ollama:${logging.model ?? 'unknown'}`, [hotseatSeat]: 'search' },
        ollamaRequests: requests, ollamaFallbacks: fallbacks,
      })));
      if (!result.openingHash) throw new Error('The neutral opening ended the game before either bot could play');
      if (openingHash !== undefined && result.openingHash !== openingHash) throw new Error('Paired games did not start from the same state');
      openingHash = result.openingHash;
      const winners = result.gameover!.winners;
      const leg: DuelGame = {
        seed, ollamaSeat, turn: result.turn,
        scores: { ollama: result.scores[ollamaSeat], hotseat: result.scores[hotseatSeat] },
        outcome: winners.length > 1 ? 'draw' : winners[0] === ollamaSeat ? 'ollama' : 'hotseat',
        requests, fallbacks,
      };
      pair.push(leg);
      if (result.log) await logging?.onLog(result.log);
      onGame?.(leg);
    }
    if (pair.some(leg => leg.fallbacks || !leg.requests)) totals.excludedPairs++;
    else for (const leg of pair) totals[leg.outcome]++;
  }
  return totals;
}
