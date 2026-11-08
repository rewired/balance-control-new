import { setupCoreMatch } from '@bc/game';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry, createResolver, resolveRoundSettlement } from '@bc/rules';
import { enumerateLegalIntents, chooseOptionWithLLM, validateChoice, type MoveOption } from '@bc/bot-llm';

const BOT = (process.env.BOT ?? 'random').toLowerCase();
const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.2:3b-instruct-q4_K_M';

interface LLMBackend { complete(prompt: string): Promise<string> }

function makeOllamaBackend(host: string, model: string): LLMBackend {
  return {
    async complete(prompt: string): Promise<string> {
      const res = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      });
      if (!res.ok) throw new Error(`ollama http ${res.status}`);
      const json = await res.json() as { response?: unknown; output_text?: unknown; message?: { content?: unknown } };
      const text = String(json.response ?? json.output_text ?? json.message?.content ?? '');
      return text.trim();
    }
  };
}

async function main() {
  const G = setupCoreMatch(2, { matchSeed: 'runner', expansions: { exp01: true } });

  const mods = createExpansionRegistry(G.cfg.expansions);
  const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
  const resolve = createResolver(mods);

  const backend: LLMBackend | undefined = (BOT === 'llm') ? makeOllamaBackend(OLLAMA_HOST, OLLAMA_MODEL) : undefined;
  if (BOT === 'llm') {
    console.log(`[runner] BOT=llm using ${OLLAMA_HOST} model=${OLLAMA_MODEL}`);
  } else {
    console.log(`[runner] BOT=random (deterministic fallback policy)`);
  }

  const N = Number(process.env.N ?? 6);
  let pos = 0;
  for (let step = 0; step < N; step++) {
    const pid = String(pos);
    const draw = resolve(G, { kind: 'drawTile', playerID: pid, turn: step + 1 });
    if (!draw.ok) throw new Error(`Draw failed: ${draw.reason}`);
    const drawn = G.tiles.drawResolution;
    if (!drawn) break;
    const [coord] = drawn.legalCoords.slice().sort((a, b) => a.q - b.q || a.r - b.r);
    const place = resolve(G, { kind: 'placeTile', tileId: drawn.tileId, coord, playerID: pid });
    if (!place.ok) throw new Error(`Placement failed: ${place.reason}`);

    const options: MoveOption[] = enumerateLegalIntents(G, pid);
    const summary = `Round=${step} Player=${pid} options=${options.length}`;
    let choiceId: string;
    try {
      choiceId = await chooseOptionWithLLM(options, summary, backend);
    } catch (e) {
      console.warn(`[runner] LLM error: ${(e as Error).message}; falling back to first legal option`);
      choiceId = options[0]?.id ?? '';
    }
    const intent = validateChoice(choiceId, options);
    if (!intent) {
      console.warn(`[runner] Invalid choiceId ${choiceId}; falling back to first legal option`);
      const fallback = options[0];
      if (fallback) catalog.definitions[fallback.type].execute(G, pid, catalog.definitions[fallback.type].payloadSchema.parse(fallback.payload));
    } else {
      catalog.definitions[intent.type].execute(G, pid, catalog.definitions[intent.type].payloadSchema.parse(intent.payload));
    }

    // simple end-of-round production after player 1
    if (pos === 1) {
      resolveRoundSettlement(G, mods);
      // reset measure flags for exp01
      resolve(G, { kind: 'resetMeasuresRound' });
    }

    pos = (pos + 1) % 2;
  }

  console.log('[runner] done');
}

main().catch((e) => { console.error(e); process.exit(1); });
