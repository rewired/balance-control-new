import { describe, it, expect } from 'vitest';
import { createResolver } from './effects.js';
import type { ExpansionModule } from './expansion-registry.js';
import type { CoreState, Tile } from './types.js';

function baseState(): CoreState {
  const start: Tile = { id: 'StartCommittee', kind: 'StartCommittee' } as any;
  const dom1: Tile = { id: 'DOM-W1-1', kind: 'ResortTile', resort: 'DOM', w: 1 } as any;
  return {
    matchSeed: 's',
    tiles: { drawPile: [], discardFaceUp: [], board: [ { tileId: start.id, coord: { q:0,r:0 } }, { tileId: dom1.id, coord: { q:1,r:0 } } ] },
    allTiles: { [start.id]: start, [dom1.id]: dom1 },
    players: { '0': { id: '0', personal: { resources: { DOM: 0, FOR:0, INF:0 }, influence: [] } } },
    resources: { bank: { DOM:0,FOR:0,INF:0 }, noise: { DOM:0,FOR:0,INF:0 } },
  };
}

describe('Resolver pipeline — Task 0014', () => {
  it('runs prohibitions -> costIncreases -> outputModifiers -> floors -> execute', () => {
    const log: string[] = [];
    const mod: ExpansionModule = {
      id: 'exp01',
      registerResources: () => {},
      setupExpansionState: () => {},
      hooks: {
        prohibitions: () => { log.push('prohibitions'); return false; },
        costIncreases: ({ cost }: any) => { log.push('costIncreases'); if (cost) cost.DOM = (cost.DOM ?? 0) + 1; },
        outputModifiers: ({ amount }: any) => { log.push('outputModifiers'); return amount + 2 },
      },
    };
    const resolve = createResolver([mod]);
    const G = baseState();
    const res = resolve(G, { kind: 'addResources', playerID: '0', resource: 'DOM', amount: 1, contextCoord: { q:1,r:0 }, cost: { DOM: 0 } });
    expect(res.ok).toBe(true);
    expect(G.players['0'].personal.resources.DOM).toBe(3); // amount 1 + 2
    expect(log).toEqual(['prohibitions','costIncreases','outputModifiers']);
  });

  it('StartCommittee immunity ignores prohibitions and modifiers', () => {
    const mod: ExpansionModule = {
      id: 'exp01', registerResources: () => {}, setupExpansionState: () => {}, hooks: {
        prohibitions: () => true, costIncreases: () => ({ DOM: 99 }), outputModifiers: () => 999,
      } } as any;
    const resolve = createResolver([mod]);
    const G = baseState();
    const res = resolve(G, { kind: 'addResources', playerID: '0', resource: 'DOM', amount: 1, contextCoord: { q:0,r:0 } });
    expect(res.ok).toBe(true);
    expect(G.players['0'].personal.resources.DOM).toBe(1);
  });

  it('atomicity: if cost cannot be paid after increases, state unchanged', () => {
    const mod: ExpansionModule = {
      id: 'exp01', registerResources: () => {}, setupExpansionState: () => {}, hooks: {
        costIncreases: () => ({ DOM: 5 }),
      } } as any;
    const resolve = createResolver([mod]);
    const G = baseState();
    const res = resolve(G, { kind: 'addResources', playerID: '0', resource: 'DOM', amount: 1, contextCoord: { q:1,r:0 }, cost: { DOM: 1 } });
    expect(res.ok).toBe(false);
    expect(G.players['0'].personal.resources.DOM).toBe(0);
  });
});