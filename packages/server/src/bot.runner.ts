import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createBCGame, type MatchLog } from '@bc/game';
import { runBotDuel, runBotMatch } from './bot-match.js';
import { localOllamaOrigin, makeOllamaBackend, ollamaHost } from './ollama.js';
import { logsDirectory } from './match-log-path.js';

const BOT = (process.env.BOT ?? 'random').toLowerCase();
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b-instruct-q4_K_M';

function botExpansions(fallback: string) {
  const enabled = (process.env.BOT_EXPANSIONS ?? fallback).split(',').map(id => id.trim()).filter(Boolean);
  const flags = ['exp01', 'exp02', 'exp03'] as const;
  if (enabled.some(id => !flags.some(flag => flag === id))) throw new Error('BOT_EXPANSIONS accepts exp01, exp02, exp03');
  return Object.fromEntries(flags.map(id => [id, enabled.includes(id)]));
}

function matchLogging() {
  let dir: string | undefined;
  let count = 0;
  return { model: OLLAMA_MODEL, onLog: async (log: MatchLog) => {
    if (!dir) {
      await mkdir(logsDirectory, { recursive: true });
      dir = await mkdtemp(join(logsDirectory, 'bot-'));
    }
    const output = join(dir, `${++count}.match-log.json`);
    await writeFile(output, JSON.stringify(log, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ matchLog: output }));
  } };
}

async function main() {
  const logging = matchLogging();
  if (BOT === 'duel') {
    const host = localOllamaOrigin(ollamaHost);
    if (!process.env.OLLAMA_MODEL) throw new Error('Set OLLAMA_MODEL to a model shown by ollama list');
    const seeds = (process.env.SEEDS ?? 'duel-1,duel-2').split(',').map(seed => seed.trim());
    const openingTurns = Number(process.env.OPENING_TURNS ?? 0);
    const expansions = botExpansions('');
    const context = Number(process.env.OLLAMA_CONTEXT ?? (Object.values(expansions).some(Boolean) ? 16384 : 8192));
    if (!Number.isSafeInteger(context) || context < 2048) throw new Error('OLLAMA_CONTEXT must be an integer of at least 2048');
    const think = process.env.OLLAMA_THINK === '1';
    console.log(JSON.stringify({ model: OLLAMA_MODEL, seeds, openingTurns, expansions, context, think }));
    const result = await runBotDuel(seeds, makeOllamaBackend(host, OLLAMA_MODEL, context, think), {
      openingTurns,
      makeGame: matchSeed => createBCGame({ matchSeed, expansions }),
      onProgress: progress => console.log(JSON.stringify({ progress })),
      onGame: leg => console.log(JSON.stringify(leg)),
      logging,
    });
    console.log(JSON.stringify({ totals: result }));
    return;
  }
  if (BOT !== 'llm' && BOT !== 'random') throw new Error('BOT must be random, llm, or duel');
  const backend = BOT === 'llm' ? makeOllamaBackend(ollamaHost, OLLAMA_MODEL, 16384, process.env.OLLAMA_THINK === '1') : undefined;
  console.log(backend ? `[runner] BOT=llm using ${ollamaHost} model=${OLLAMA_MODEL}` : '[runner] BOT=random (deterministic fallback policy)');
  const game = createBCGame({ matchSeed: process.env.SEED ?? 'runner', expansions: botExpansions('exp01') });
  const result = await runBotMatch(Number(process.env.N ?? 6), backend, game, logging);
  console.log(`[runner] done turn=${result.turn} hash=${result.hash}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
