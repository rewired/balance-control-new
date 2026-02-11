import { describe, it, expect } from 'vitest';
import { CoreGame } from './index.js';
import type { CoreState, Tile } from '@bc/rules';

const setup = (numPlayers: number) => {
  const fn = CoreGame.setup as unknown as (ctx: { matchID: string; numPlayers: number }) => CoreState;
  return fn({ matchID: 'test', numPlayers });
};

describe('CoreGame setup — CORE-01-03/02', () => {
  it('assigns correct starting Influence for 2/3/4 players (CORE-01-03-04..06)', () => {
    const g2 = setup(2);
    expect(g2.players['0'].personal.influence).toHaveLength(4);
    expect(g2.players['1'].personal.influence).toHaveLength(4);

    const g3 = setup(3);
    expect(g3.players['0'].personal.influence).toHaveLength(3);
    expect(g3.players['2'].personal.influence).toHaveLength(3);

    const g4 = setup(4);
    expect(g4.players['0'].personal.influence).toHaveLength(2);
    expect(g4.players['3'].personal.influence).toHaveLength(2);
  });

  it('places Start Committee on Board and excludes it from DrawPile (CORE-01-02-01..03, CORE-01-03-01..02)', () => {
    const G = setup(2);
    const onBoard = G.tiles.board.find(p => p.tileId === 'StartCommittee');
    expect(onBoard).toBeTruthy();
    expect(G.tiles.drawPile.includes('StartCommittee')).toBe(false);
  });

  it('produces correct DrawPile tile counts (CORE-01-02-10..16)', () => {
    const G = setup(2);
    const tiles = G.tiles.drawPile.map(id => G.allTiles[id]) as Tile[];

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
