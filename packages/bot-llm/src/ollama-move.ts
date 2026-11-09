import { legalMoveOptions, sampleComputerOptions, type ComputerPosition, type createBCGame } from '@bc/game';
import { chooseOptionWithLLM, type LLMBackend, type LLMFallback } from './adapter.js';

export async function chooseOllamaMove(game: ReturnType<typeof createBCGame>, position: ComputerPosition, playerID: string,
  describe: (position: ComputerPosition, playerID: string) => string, backend: LLMBackend,
  onRequest?: () => void, onFallback?: (reason: LLMFallback, error?: unknown) => void) {
  const candidates = sampleComputerOptions(position, playerID, 20);
  const previews = legalMoveOptions(game, {
    G: position.G, ctx: position.ctx, _stateID: position.revision,
    plugins: { random: { data: { seed: position.G.matchSeed } } },
  }, playerID, candidates);
  if (previews.length <= 1) return previews[0];
  onRequest?.();
  return chooseOptionWithLLM(previews, describe(position, playerID), backend, onFallback);
}
