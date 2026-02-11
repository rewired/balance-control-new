import { describe, it, expect } from 'vitest';
import { enumerateLegalIntents, validateChoice, chooseOptionWithLLM, type LLMBackend } from './adapter.js';
import { createBCGame } from '@bc/game';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry, drawUntilPlaceable, adjacent as hexAdjacent, createResolver } from '@bc/rules';
import { stableHash } from '@bc/shared';

function setup(exp01 = true) {
  const Game = createBCGame({ expansions: { exp01 } });
  const setup = Game.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
  const G = setup({ matchID: 't', numPlayers: 2, setupData: { expansions: { exp01 } } });
  return G as import('@bc/rules').CoreState;
}

describe('bot adapter — 0028', () => {
  it('enumeration yields only schema-valid options', () => {
    const G = setup(true);
    const opts = enumerateLegalIntents(G, '0');
    const mods = createExpansionRegistry(G.cfg.expansions);
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    for (const o of opts) {
      const def = catalog.definitions[o.type];
      expect(() => def.payloadSchema.parse(o.payload)).not.toThrow();
    }
  });

  it('invalid LLM output triggers deterministic fallback', async () => {
    const G = setup(true);
    const opts = enumerateLegalIntents(G, '0');
    const backend: LLMBackend = { complete: async () => 'not json' };
    const id = await chooseOptionWithLLM(opts, 'state', backend);
    expect(id).toBe(opts[0].id);
    const intent = validateChoice(id, opts)!;
    expect(intent.type).toBe(opts[0].type);
  });

  it('integration: short deterministic match with stubbed backend', async () => {
    const G = setup(true);
    const backend: LLMBackend = { complete: async () => JSON.stringify({ optionId: 'invalid' }) };
    let pos = 0;
    const N = 6; // 3 rounds across 2 players
    for (let step = 0; step < N; step++) {
      // draw and place deterministically
      const res = drawUntilPlaceable(G.tiles.drawPile, G.tiles.discardFaceUp, G.tiles.board, hexAdjacent);
      G.tiles.drawPile = res.drawPile; G.tiles.discardFaceUp = res.discardFaceUp;
      if (!res.drawn) break;
      const legal = res.legalCoords.slice().sort((a,b)=> a.q===b.q ? a.r-b.r : a.q-b.q);
      const coord = legal[0];
      G.tiles.board.push({ tileId: res.drawn, coord });
      // political action via bot (fallback since backend picks invalid id)
      const opts = enumerateLegalIntents(G, String(pos));
      const id = await chooseOptionWithLLM(opts, 'summary', backend);
      const intent = validateChoice(id, opts)!;
      const mods = createExpansionRegistry(G.cfg.expansions);
      const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
      const def = catalog.definitions[intent.type];
      def.execute(G, String(pos), def.payloadSchema.parse(intent.payload));
      if (pos === 1) createResolver(mods)(G, { kind: 'resetMeasuresRound', expansion: 'exp01' });
      pos = (pos + 1) % 2;
    }
    const hash = stableHash(G);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});