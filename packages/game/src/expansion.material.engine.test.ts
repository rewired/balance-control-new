import { InitializeGame } from 'boardgame.io/internal';
import type { CoreState } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';

const configurations = Array.from({ length: 8 }, (_, index) => ({
  exp01: Boolean(index & 1), exp02: Boolean(index & 2), exp03: Boolean(index & 4),
}));

describe('Expansion material through boardgame.io', () => {
  it.each(configurations)('sets up only active material for $exp01/$exp02/$exp03', expansions => {
    const { G }: { G: CoreState } = InitializeGame({ game: createBCGame({ expansions }), numPlayers: 2 });
    const { exp01, exp02, exp03 } = expansions;
    const activeResources = ['DOM', 'FOR', 'INF', ...(exp01 ? ['ECO'] : []), ...(exp02 ? ['SEC'] : []), ...(exp03 ? ['CLM'] : [])];
    expect(Object.keys(G.resources.bank)).toEqual(activeResources);
    expect(Object.keys(G.resources.noise)).toEqual(activeResources);
    for (const player of Object.values(G.players)) expect(Object.keys(player.personal.resources)).toEqual(activeResources);

    const tileIds = [G.tiles.drawResolution!.tileId, ...G.tiles.drawPile];
    expect(tileIds).toHaveLength(71 + (exp01 ? 6 : 0) + (exp02 ? 2 : 0) + (exp03 ? 5 : 0));
    expect(new Set(tileIds).size).toBe(tileIds.length);
    expect(tileIds.includes('InvestmentProgram')).toBe(exp01);
    expect(tileIds.includes('LaborMarket')).toBe(exp01);
    expect(tileIds.includes('AuthorityApparatus')).toBe(exp02);
    expect(tileIds.includes('InnerOrder')).toBe(exp02);
    expect(tileIds.includes('Transformationsdruck')).toBe(exp03);

    for (const [id, count] of [['exp01', exp01 ? 10 : 0], ['exp02', exp02 ? 15 : 0], ['exp03', exp03 ? (exp01 ? 13 : 10) : 0]] as const) {
      const slice = G.exp?.[id];
      if (count === 0) {
        expect(slice).toBeUndefined();
        continue;
      }
      const measures = slice!.measures!;
      expect(measures.open).toHaveLength(3);
      expect(measures.open.every(card => card !== null)).toBe(true);
      expect(new Set([...measures.open, ...measures.drawPile]).size).toBe(count);
      expect(Object.keys(measures.playCounts)).toHaveLength(count);
      expect(Object.values(measures.playCounts).every(value => value === 0)).toBe(true);
      expect(measures.playCounts).not.toHaveProperty('CLM_M14');
      expect(measures.playCounts).not.toHaveProperty('CLM_M15');
    }
    expect(G.exp?.exp03?.measures?.playCounts.CLM_M11 === 0).toBe(exp01 && exp03);
    expect(Boolean(G.playedMeasureThisRound)).toBe(exp01 || exp02 || exp03);
    expect(JSON.stringify(G)).not.toMatch(/countdown/i);
  });

  it.each([5, 6])('uses the larger ECO and CLM material once for %i players', numPlayers => {
    const { G }: { G: CoreState } = InitializeGame({
      game: createBCGame({ addOn56: true, expansions: { exp01: true, exp02: true, exp03: true } }), numPlayers,
    });
    const tiles = Object.values(G.allTiles);
    const weights = (resource: string) => tiles.flatMap(tile => tile.kind === 'ResortTile' && tile.resort === resource ? [tile.w] : []);
    expect(weights('ECO')).toEqual([1, 1, 1, 2, 2, 3, 3]);
    expect(weights('CLM')).toEqual([1, 1, 1, 2, 2, 2]);
    expect(tiles).toHaveLength(90 + 9 + 2 + 7);
  });
});
