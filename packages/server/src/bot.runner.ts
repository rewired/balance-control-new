import { createBCGame } from '@bc/game';
import type { CoreState, AxialCoord, Tile } from '@bc/rules';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry, drawUntilPlaceable, adjacent as hexAdjacent, isFullySurrounded, createResolver } from '@bc/rules';
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
      const json = await res.json();
      const text: string = String((json as any).response ?? (json as any).output_text ?? (json as any).message?.content ?? '');
      return text.trim();
    }
  };
}

function neighborsOf(c: AxialCoord): AxialCoord[] {
  return [
    { q: c.q + 1, r: c.r + 0 },
    { q: c.q + 1, r: c.r - 1 },
    { q: c.q + 0, r: c.r - 1 },
    { q: c.q - 1, r: c.r + 0 },
    { q: c.q - 1, r: c.r + 1 },
    { q: c.q + 0, r: c.r + 1 },
  ];
}

async function main() {
  const Game = createBCGame({ expansions: { exp01: true } });
  const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => CoreState;
  const G = setup({ matchID: 'runner', numPlayers: 2, setupData: { expansions: { exp01: true } } });

  const mods = createExpansionRegistry(G.cfg.expansions);
  const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
  const resolve = createResolver(mods);

  const backend: LLMBackend | undefined = (BOT === 'llm') ? makeOllamaBackend(OLLAMA_HOST, OLLAMA_MODEL) : undefined;
  if (BOT === 'llm') {
    console.log(`[runner] BOT=llm using ${OLLAMA_HOST} model=${OLLAMA_MODEL}`);
  } else {
    console.log(`[runner] BOT=random (deterministic fallback policy)`);
  }

  function place(res: ReturnType<typeof drawUntilPlaceable>) {
    const legal = res.legalCoords.slice().sort((a,b)=> a.q===b.q ? a.r-b.r : a.q-b.q);
    const coord = legal[0];
    const tileId = res.drawn!;
    // neighbor hotspot capture
    const candidates = neighborsOf(coord)
      .map((c) => ({ c, placement: G.tiles.board.find((bp) => bp.coord.q === c.q && bp.coord.r === c.r) }))
      .filter((x) => !!x.placement)
      .map((x) => ({
        coord: x.c,
        tile: G.allTiles[x.placement!.tileId] as Tile,
        was: isFullySurrounded(G, x.c),
      }))
      .filter((x) => x.tile && x.tile.kind === 'Hotspot');

    resolve(G, { kind: 'placeTile', tileId, coord, contextCoord: coord });
    const placed = G.allTiles[tileId] as Tile;
    if (placed && placed.kind === 'Hotspot' && isFullySurrounded(G, coord)) resolve(G, { kind: 'resolveHotspotAt', coord, contextCoord: coord });
    for (const h of candidates) if (!h.was && isFullySurrounded(G, h.coord)) resolve(G, { kind: 'resolveHotspotAt', coord: h.coord, contextCoord: h.coord });
  }

  const N = Number(process.env.N ?? 6);
  let pos = 0;
  for (let step = 0; step < N; step++) {
    // draw/offer
    const res = drawUntilPlaceable(G.tiles.drawPile, G.tiles.discardFaceUp, G.tiles.board, hexAdjacent);
    G.tiles.drawPile = res.drawPile; G.tiles.discardFaceUp = res.discardFaceUp;
    if (!res.drawn) break;
    place(res);

    const pid = String(pos);
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
      for (const p of G.tiles.board) resolve(G, { kind: 'applyProductionAt', coord: p.coord, contextCoord: p.coord });
      // reset measure flags for exp01
      resolve(G, { kind: 'resetMeasuresRound', expansion: 'exp01' });
    }

    pos = (pos + 1) % 2;
  }

  console.log('[runner] done');
}

main().catch((e) => { console.error(e); process.exit(1); });