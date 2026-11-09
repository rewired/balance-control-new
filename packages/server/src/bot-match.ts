import { Client } from '#boardgame-client';
import {
  chooseComputerMove, createBCGame, createComputerPosition, engineMoveOptions, hashEngineState, legalMoveOptions,
  sampleComputerOptions, type EngineMoveOption, type EngineSnapshot,
} from '@bc/game';
import { chooseOptionWithLLM, type LLMBackend, type LLMFallback } from '@bc/bot-llm';
import { describeBotPosition } from './bot-context.js';

type CoreGame = ReturnType<typeof createBCGame>;
type Policy = (game: CoreGame, state: EngineSnapshot, playerID: string) => EngineMoveOption | undefined | Promise<EngineMoveOption | undefined>;

const firstLegal: Policy = (_game, { G, ctx }, playerID) => engineMoveOptions(G, ctx, playerID)[0];
const hotseat: Policy = (game, state, playerID) => chooseComputerMove(game, createComputerPosition(state), playerID);

function ollamaPolicy(backend: LLMBackend, onRequest?: () => void, onFallback?: (reason: LLMFallback, error?: unknown) => void): Policy {
  return async (game, state, playerID) => {
    const position = createComputerPosition(state);
    const candidates = sampleComputerOptions(position, playerID, 20);
    const previews = legalMoveOptions(game, {
      G: position.G, ctx: position.ctx, _stateID: position.revision,
      plugins: { random: { data: { seed: position.G.matchSeed } } },
    }, playerID, candidates);
    if (previews.length === 1) return previews[0];
    if (!previews.length) return undefined;
    onRequest?.();
    return chooseOptionWithLLM(previews, describeBotPosition(position, playerID), backend, onFallback);
  };
}

async function playBotMatch(game: CoreGame, policy: Policy, endTurn: number, openingTurns: number) {
  const client = Client({ game, numPlayers: 2, playerID: '0' });
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
    hash: hashEngineState(state), scores, openingHash };
}

export async function runBotMatch(turns: number, backend?: LLMBackend, game = createBCGame({
  matchSeed: 'runner', expansions: { exp01: true },
})) {
  if (!Number.isSafeInteger(turns) || turns < 0) throw new RangeError('Turn count must be a nonnegative integer');
  const { turn, gameover, hash } = await playBotMatch(game, backend ? ollamaPolicy(backend) : firstLegal, turns, 0);
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
}: {
  openingTurns?: number;
  makeGame?: (seed: string) => CoreGame;
  onProgress?: (progress: Pick<DuelGame, 'seed' | 'ollamaSeat' | 'turn' | 'requests' | 'fallbacks'>) => void;
  onGame?: (result: DuelGame) => void;
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
      const result = await playBotMatch(makeGame(seed), policy, Infinity, openingTurns);
      if (!result.openingHash) throw new Error('The neutral opening ended the game before either bot could play');
      if (openingHash !== undefined && result.openingHash !== openingHash) throw new Error('Paired games did not start from the same state');
      openingHash = result.openingHash;
      const winners = result.gameover!.winners;
      const hotseatSeat = ollamaSeat === '0' ? '1' : '0';
      const leg: DuelGame = {
        seed, ollamaSeat, turn: result.turn,
        scores: { ollama: result.scores[ollamaSeat], hotseat: result.scores[hotseatSeat] },
        outcome: winners.length > 1 ? 'draw' : winners[0] === ollamaSeat ? 'ollama' : 'hotseat',
        requests, fallbacks,
      };
      pair.push(leg);
      onGame?.(leg);
    }
    if (pair.some(leg => leg.fallbacks || !leg.requests)) totals.excludedPairs++;
    else for (const leg of pair) totals[leg.outcome]++;
  }
  return totals;
}
