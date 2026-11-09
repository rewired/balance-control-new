import { chooseComputerMove, createBCGame, type ComputerPosition, type EngineMoveOption } from '@bc/game';
import { chooseOllamaMove, createBotPositionDescriber } from '@bc/bot-llm';

const ruleFiles = import.meta.glob('../../../docs/rules/00[1-3]-expansion*.md', { query: '?raw', import: 'default', eager: true });
const describePosition = createBotPositionDescriber(file => ruleFiles[`../../../docs/rules/${file}`] as string);

export interface ComputerMoveRequest {
  position: ComputerPosition;
  playerID: string;
  ollama?: { server: string; model: string };
}

export interface ComputerMoveResponse {
  revision: number;
  option?: EngineMoveOption;
  error?: string;
}

self.onmessage = async ({ data: { position, playerID, ollama } }: MessageEvent<ComputerMoveRequest>) => {
  const { cfg, matchSeed } = position.G;
  try {
    const game = createBCGame({ ...cfg, matchSeed });
    const option = ollama
      ? await chooseOllamaMove(game, position, playerID, describePosition, {
        async complete(prompt, optionCount) {
          const response = await fetch(`${ollama.server}/bots/ollama/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: ollama.model, prompt, optionCount, expanded: Object.values(cfg.expansions).some(Boolean) }),
          });
          const result = await response.json() as { response?: string; error?: string };
          if (!response.ok || result.response === undefined) throw new Error(result.error ?? 'Could not reach Ollama.');
          return result.response;
        },
      }, undefined, (reason, error) => {
        if (reason === 'backend-error') throw error;
      })
      : chooseComputerMove(game, position, playerID);
    self.postMessage({ revision: position.revision, option } satisfies ComputerMoveResponse);
  } catch (failure) {
    const error = failure instanceof Error ? failure.message : 'The computer could not complete its move.';
    self.postMessage({ revision: position.revision, error } satisfies ComputerMoveResponse);
  }
};
