import { describe, it, expect } from 'vitest';
import { InitializeGame } from 'boardgame.io/internal';
import { CoreGame } from './index.js';
import type { Tile } from '@bc/rules';

const setup = (numPlayers: number) => InitializeGame({ game: CoreGame, numPlayers });

describe('CoreGame setup — CORE-01-03/02', () => {
  it.each([[2, 4], [3, 3], [4, 2]])('sets up %i engine players with %i Starting Influence each', (numPlayers, startingInfluence) => {
    const { G, ctx } = setup(numPlayers);
    expect(Object.keys(G.players)).toEqual(ctx.playOrder);
    expect(Object.keys(G.players)).toHaveLength(numPlayers);
    for (const player of Object.values(G.players)) {
      expect(player.personal.influence).toHaveLength(startingInfluence);
    }
  });

  it('places Start Committee on Board and excludes it from DrawPile (CORE-01-02-01..03, CORE-01-03-01..02)', () => {
    const { G } = setup(2);
    const onBoard = G.tiles.board.find(p => p.tileId === 'StartCommittee');
    expect(onBoard).toBeTruthy();
    expect(G.tiles.drawPile.includes('StartCommittee')).toBe(false);
  });

  it('produces correct DrawPile tile counts (CORE-01-02-10..16)', () => {
    const { G } = setup(2);
    const offered = G.tiles.drawResolution!.tileId;
    expect(G.tiles.drawPile).not.toContain(offered);
    const tiles = [...G.tiles.drawPile, offered].map(id => G.allTiles[id]);

    const count = (pred: (t: Tile) => boolean) => tiles.filter(pred).length;
    const r = (resort: 'DOM'|'FOR'|'INF', w: 1|2|3|4|5) => count(t => t.kind === 'ResortTile' && t.resort === resort && t.w === w);

    expect(r('DOM',1)).toBe(2); expect(r('DOM',2)).toBe(4); expect(r('DOM',3)).toBe(4); expect(r('DOM',4)).toBe(1); expect(r('DOM',5)).toBe(1);
    expect(r('FOR',1)).toBe(2); expect(r('FOR',2)).toBe(4); expect(r('FOR',3)).toBe(4); expect(r('FOR',4)).toBe(1); expect(r('FOR',5)).toBe(1);
    expect(r('INF',1)).toBe(2); expect(r('INF',2)).toBe(4); expect(r('INF',3)).toBe(4); expect(r('INF',4)).toBe(1); expect(r('INF',5)).toBe(1);

    const k = (kind: string) => count(t => t.kind === kind);
    expect(k('Committee')).toBe(10);
    expect(k('Grassroots')).toBe(8);
    expect(k('Lobbyist')).toBe(9);
    expect(k('Hotspot')).toBe(8);
  });
});
