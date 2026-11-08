import { describe, it, expect } from 'vitest';
import { InitializeGame } from 'boardgame.io/internal';
import { CoreGame } from './factory.js';
import { createExpansionRegistry, createResolver } from '@bc/rules';

const setup = (setupData?: unknown) => InitializeGame({ game: CoreGame, numPlayers: 2, setupData }).G;

describe('CoreGame setup — expansion flags (Task 0010)', () => {
  it('no setupData -> only the mandatory CORE slice', () => {
    const G = setup();
    expect(G.cfg.expansions).toEqual({ exp01:false, exp02:false, exp03:false });
    expect(Object.keys(G.exp)).toEqual(['core']);
  });
  it('setupData.expansions.exp01=true -> exp01 slice present only', () => {
    const G = setup({ expansions: { exp01: true } });
    expect(G.cfg.expansions.exp01).toBe(true);
    expect(G.exp?.exp01).toBeDefined();
    expect(G.exp?.exp02).toBeUndefined();
    expect(G.exp?.exp03).toBeUndefined();
  });

  it('T06: credits and spends ECO when EXP-01 is active in the engine setup', () => {
    const G = structuredClone(setup({ expansions: { exp01: true } }));
    const resolve = createResolver();
    expect(resolve(G, { kind: 'addResources', playerID: '0', resource: 'ECO', amount: 1 }).ok).toBe(true);
    expect(G.exp.core.players['0'].personal.resources.ECO).toBe(1);

    expect(resolve(G, { kind: 'addResources', playerID: '0', resource: 'FOR', amount: 1, cost: { ECO: 1 } }).ok).toBe(true);
    expect(G.exp.core.players['0'].personal.resources.ECO).toBe(0);
    expect(G.exp.core.resources.bank.ECO).toBe(1);
  });

  it('rejects inactive ECO transfers even if an inactive module is supplied to the resolver', () => {
    const G = structuredClone(setup());
    G.exp.core.players['0'].personal.resources.DOM = 1;
    const before = structuredClone(G);
    const modules = createExpansionRegistry({ exp01: true, exp02: false, exp03: false });
    expect(modules.map(module => module.id)).toEqual(['core', 'exp01']);
    const resolve = createResolver(modules);

    expect(resolve(G, { kind: 'addResources', playerID: '0', resource: 'ECO', amount: 1, cost: { DOM: 1 } }).ok).toBe(false);
    expect(resolve(G, { kind: 'addNoise', resource: 'ECO', amount: 1 }).ok).toBe(false);
    expect(G).toEqual(before);
    expect(G.exp.core.resources.bank).not.toHaveProperty('ECO');
    expect(G.exp.core.resources.noise).not.toHaveProperty('ECO');
    expect(G.exp.core.players['0'].personal.resources).not.toHaveProperty('ECO');
    expect(createResolver([])(G, { kind: 'addNoise', resource: 'DOM', amount: 1 }).ok).toBe(true);
    expect(G.exp.core.resources.noise.DOM).toBe(1);
  });
});
