import { describe, it, expect } from 'vitest';
import { enumerateLegalIntents, validateChoice, chooseOptionWithLLM, type LLMBackend } from './adapter.js';
import { setupCoreMatch } from '@bc/game';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry, createResolver } from '@bc/rules';
import { stableHash } from '@bc/shared';

const setup = () => setupCoreMatch(2, { matchSeed: 't', expansions: { exp01: true } });

describe('bot adapter - 0028', () => {
  it('enumeration yields only schema-valid options', () => {
    const G = setup();
    const opts = enumerateLegalIntents(G, '0');
    const mods = createExpansionRegistry(G.cfg.expansions);
    const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
    for (const o of opts) {
      const def = catalog.definitions[o.type];
      expect(() => def.payloadSchema.parse(o.payload)).not.toThrow();
    }
  });

  it('invalid LLM output triggers deterministic fallback', async () => {
    const G = setup();
    const opts = enumerateLegalIntents(G, '0');
    const backend: LLMBackend = { complete: async () => 'not json' };
    const id = await chooseOptionWithLLM(opts, 'state', backend);
    expect(id).toBe(opts[0].id);
    const intent = validateChoice(id, opts)!;
    expect(intent.type).toBe(opts[0].type);
  });

  it('integration: short deterministic match with stubbed backend', async () => {
    const G = setup();
    const backend: LLMBackend = { complete: async () => JSON.stringify({ optionId: 'invalid' }) };
    let pos = 0;
    const N = 6; // 3 rounds across 2 players
    const resolve = createResolver();
    for (let step = 0; step < N; step++) {
      // draw and place deterministically
      const playerID = String(pos);
      expect(resolve(G, { kind: 'drawTile', playerID, turn: step + 1 }).ok).toBe(true);
      const drawn = G.tiles.drawResolution!;
      const [coord] = drawn.legalCoords.slice().sort((a, b) => a.q - b.q || a.r - b.r);
      expect(resolve(G, { kind: 'placeTile', tileId: drawn.tileId, coord, playerID }).ok).toBe(true);
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
