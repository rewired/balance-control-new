import { MatchConfigSchema } from './schemas.js';
import { describe, it, expect } from 'vitest';
import { createResolver } from './effects.js';
import type { ExpansionModule } from './expansion-registry.js';
import type { CoreState, StartCommitteeTile, ResortTile } from './types.js';

function baseState(exp01 = false): CoreState {
  const start: StartCommitteeTile = { id: 'StartCommittee', kind: 'StartCommittee' };
  const dom1: ResortTile = { id: 'DOM-W1-1', kind: 'ResortTile', resort: 'DOM', w: 1 };
  return {
    cfg: MatchConfigSchema.parse({ expansions: { exp01, exp02: false, exp03: false } }),
    matchSeed: 's',
    tiles: { drawPile: [], drawResolution: null, discardFaceUp: [], board: [ { tileId: start.id, coord: { q:0,r:0 } }, { tileId: dom1.id, coord: { q:1,r:0 } } ] },
    allTiles: { [start.id]: start, [dom1.id]: dom1 },
    players: { '0': { id: '0', personal: { resources: { DOM: 0, FOR:0, INF:0 }, influence: [] } } },
    resources: { bank: { DOM:0,FOR:0,INF:0 }, noise: { DOM:0,FOR:0,INF:0 } },
  };
}

describe('Resolver pipeline - Task 0014', () => {
  it('runs prohibitions -> costIncreases -> outputModifiers -> floors -> execute', () => {
    const log: string[] = [];
    const mod: ExpansionModule = {
      id: 'exp01',
      registerResources: () => {},
      setupExpansionState: () => {},
      hooks: {
        prohibitions: () => { log.push('prohibitions'); return false; },
        costIncreases: ({ cost }) => { log.push('costIncreases'); if (cost) cost.DOM = (cost.DOM ?? 0) + 1; },
        outputModifiers: ({ amount }) => { log.push('outputModifiers'); return amount + 2 },
      },
    };
    const resolve = createResolver([mod]);
    const G = baseState(true);
    G.players['0'].personal.resources.DOM = 1;
    resolve(G, { kind: 'addResources', playerID: '0', resource: 'DOM', amount: 1, contextCoord: { q:1,r:0 } });
    expect(G.players['0'].personal.resources.DOM).toBe(3); // amount 1 + 2
    expect(log).toEqual(['prohibitions','costIncreases','outputModifiers']);
  });

  it('StartCommittee immunity ignores prohibitions and modifiers', () => {
    const mod: ExpansionModule = {
      id: 'exp01',
      registerResources: () => {},
      setupExpansionState: () => {},
      hooks: {
        prohibitions: () => true,
        costIncreases: () => ({ DOM: 99 }),
        outputModifiers: () => 999,
      },
    };
    const resolve = createResolver([mod]);
    const G = baseState(true);
    resolve(G, { kind: 'addResources', playerID: '0', resource: 'DOM', amount: 1, contextCoord: { q:0,r:0 } });
    expect(G.players['0'].personal.resources.DOM).toBe(1);
  });

  it('atomicity: if cost cannot be paid after increases, state unchanged', () => {
    const mod: ExpansionModule = {
      id: 'exp01',
      registerResources: () => {},
      setupExpansionState: () => {},
      hooks: {
        costIncreases: () => ({ DOM: 5 }),
      },
    };
    const resolve = createResolver([mod]);
    const G = baseState(true);
    const res = resolve(G, { kind: 'addResources', playerID: '0', resource: 'DOM', amount: 1, contextCoord: { q:1,r:0 }, cost: { DOM: 1 } });
    expect(res.ok).toBe(false);
    expect(G.players['0'].personal.resources.DOM).toBe(0);
  });
});

describe('Atomic bank transfers (CORE-01-00-04A through -04D)', () => {
  it.each([[0, 0], [2, 1]])('T05: returns costs to Bank and draws the gain from stock %i', (stock, remaining) => {
    const G = baseState();
    G.players['0'].personal.resources.DOM = 1;
    G.resources.bank.FOR = stock;

    const result = createResolver()(G, { kind: 'addResources', playerID: '0', resource: 'FOR', amount: 1, cost: { DOM: 1 } });

    expect(result.ok).toBe(true);
    expect(G.players['0'].personal.resources).toEqual({ DOM: 0, FOR: 1, INF: 0 });
    expect(G.resources.bank).toEqual({ DOM: 1, FOR: remaining, INF: 0 });
  });

  it('leaves all accounts intact if a later cost cannot be paid from PersonalSupply', () => {
    const G = baseState();
    G.players['0'].personal.resources.DOM = 1;
    G.resources.bank.FOR = 5;
    const before = structuredClone(G);

    const result = createResolver()(G, { kind: 'addResources', playerID: '0', resource: 'INF', amount: 1, cost: { DOM: 1, FOR: 1 } });

    expect(result).toEqual({ ok: false, reason: 'insufficient' });
    expect(G).toEqual(before);
  });

  it('discards a staged payment when the payout is invalid', () => {
    const G = baseState();
    G.players['0'].personal.resources.DOM = 1;
    const before = structuredClone(G);

    const result = createResolver()(G, { kind: 'addResources', playerID: '0', resource: 'FOR', amount: NaN, cost: { DOM: 1 } });

    expect(result.ok).toBe(false);
    expect(G).toEqual(before);
  });
});
