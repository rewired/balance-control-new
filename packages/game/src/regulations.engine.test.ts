import { Client } from 'boardgame.io/client';
import { createResolver, type BoardPlacement, type CoreState, type MatchConfigInput } from '@bc/rules';
import { describe, expect, it } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions } from './legal-options.js';

const apparatus = { tileId: 'AuthorityApparatus', coord: { q: 1, r: 0 } };
const grassroots = { tileId: 'Grassroots-1', coord: { q: 1, r: -1 } };

function setupSecurity(board: BoardPlacement[], prepare: (G: CoreState) => void, rules: 'current' | 'recorded' = 'recorded',
  variants: MatchConfigInput['variants'] = {}) {
  const game = createBCGame({
    expansions: { exp02: true },
    variants: { resourceCap: true, influenceRecall: true, influenceDistance: true, disruption: true, ...variants },
  }, rules);
  const setup = game.setup!;
  game.setup = (context, data) => {
    const G = setup(context, data);
    const draw = ['Committee-7', 'Committee-8', 'Committee-9', 'Committee-10'];
    G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(id => !draw.includes(id) && !board.some(tile => tile.tileId === id));
    G.exp.core.tiles.drawPile = draw;
    G.exp.core.tiles.board.push(...board);
    prepare(G);
    return G;
  };
  return Client({ game, numPlayers: 2 });
}

function takeIntoFixtureHand(G: CoreState, card: string, owner = '0'): void {
  const deck = G.exp!.exp02!.measures!;
  const slot = deck.open.indexOf(card);
  if (slot >= 0) deck.open[slot] = null;
  else deck.drawPile.splice(deck.drawPile.indexOf(card), 1);
  deck.hands[owner].push(card);
}

function mark(G: CoreState, owner: string, tileId: string): void {
  (G.exp.core.influencesOnBoard ??= []).push({ ...G.exp.core.players[owner].personal.influence.shift()!, tileId });
}

describe('Regulation operations through boardgame.io', () => {
  it('combines the placement price with the Measure and pays a SecurityLevel-reduced exchange with zero output', () => {
    const client = setupSecurity([apparatus, grassroots], G => {
      takeIntoFixtureHand(G, 'SEC_M01');
      mark(G, '0', grassroots.tileId);
      Object.assign(G.exp.core.players['0'].personal.resources, { SEC: 1, INF: 1, DOM: 3 });
    }, 'current');
    client.moves.placeTile({ q: -1, r: 0 });
    const before = client.getState()!;
    const play = (regulationKind: string) => client.moves.doPoliticalAction({
      type: 'exp02_playMeasure',
      payload: { measureId: 'SEC_M01', regulation: { operation: 'place', regulationKind, tileId: grassroots.tileId } },
    });
    play('Control');
    expect(client.getState()!._stateID).toBe(before._stateID);
    play('SecurityLevel');
    const placed = client.getState()!;
    expect(placed.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    expect(placed.G.exp!.exp02!.regulations!.attached).toEqual([{ id: 'reg-1', kind: 'SecurityLevel', tileId: grassroots.tileId }]);
    expect(placed.G.exp.core.resources.bank).toMatchObject({ SEC: 1, INF: 1 });
    client.moves.doPoliticalAction({
      type: 'convertResources', payload: { tileId: grassroots.tileId, input: 'DOM', output: 'FOR' },
    });
    const after = client.getState()!;
    expect(after.ctx.currentPlayer).toBe('1');
    expect(after.G.exp.core.resources.bank.DOM).toBe(3);
    expect(after.G.exp.core.players['0'].personal.resources).toMatchObject({ DOM: 0, FOR: 0, SEC: 0, INF: 0 });
  });

  it.each([
    { rules: 'current', levels: 0, expected: 1 },
    { rules: 'current', levels: 1, expected: 0 },
    { rules: 'recorded', levels: 0, expected: 2 },
    { rules: 'recorded', levels: 1, expected: 1 },
  ] as const)('converts into $expected SEC under $rules rules with $levels Security Levels', ({ rules, levels, expected }) => {
    const client = setupSecurity([grassroots], G => {
      mark(G, '0', grassroots.tileId);
      G.exp.core.players['0'].personal.resources.DOM = 3;
      if (levels) G.exp.exp02!.regulations!.attached.push({ id: 'reg-1', kind: 'SecurityLevel', tileId: grassroots.tileId });
    }, rules, { measureRegulationAccess: true });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({
      type: 'convertResources', payload: { tileId: grassroots.tileId, input: 'DOM', output: 'SEC' },
    });
    expect(client.getState()!.G.exp.core.players['0'].personal.resources).toMatchObject({ DOM: 0, SEC: expected });
  });

  it.each([false, true])('quotes a new Apparatus placement with the recorded discount active: %s', discounted => {
    const client = setupSecurity([apparatus, grassroots], G => {
      mark(G, '0', apparatus.tileId);
      G.exp.core.players['0'].personal.resources.SEC = discounted ? 0 : 1;
      if (discounted) expect(createResolver()(G, { kind: 'registerMeasureEffect',
        instance: { sourceCardId: 'SEC_M15', owner: '1', playNumber: 1, duration: 'thisRound' } }).ok).toBe(true);
    }, 'current');
    client.moves.placeTile({ q: -1, r: 0 });
    const before = client.getState()!;
    const action = (regulationKind: string) => ({
      type: 'activateAuthorityApparatus',
      payload: { regulation: { operation: 'place', regulationKind, tileId: grassroots.tileId } },
    });
    const options = engineMoveOptions(before.G, before.ctx, '0');
    expect(options.find(option => JSON.stringify(option.parameters[0]) === JSON.stringify(action('SecurityLevel')))).toMatchObject({
      contextTile: apparatus.tileId,
      costBreakdown: discounted ? [] : [{ playerID: '0', resource: 'SEC', amount: 1 }],
    });
    client.moves.doPoliticalAction(action('Blockade'));
    expect(client.getState()!._stateID).toBe(before._stateID);
    client.moves.doPoliticalAction(action('SecurityLevel'));
    const after = client.getState()!;
    expect(after.G.exp.exp02!.regulations!.attached).toEqual([{ id: 'reg-1', kind: 'SecurityLevel', tileId: grassroots.tileId }]);
    expect(after.G.exp.core.resources.bank.SEC).toBe(discounted ? 0 : 1);
    if (discounted) expect(after.G.exp.core.activeMeasureEffects?.find(effect => effect.sourceCardId === 'SEC_M15')?.used).toBe(true);
  });

  it('uses Authority Apparatus as its only local context when moving an existing Regulation', () => {
    const client = setupSecurity([apparatus, grassroots], G => {
      mark(G, '0', apparatus.tileId);
      const zones = G.exp!.exp02!.regulations!;
      zones.attached.push(
        { id: 'reg-1', kind: 'Blockade', tileId: grassroots.tileId },
        { id: 'reg-2', kind: 'SecurityLevel', tileId: grassroots.tileId },
      );
      zones.serial = 2;
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({
      type: 'activateAuthorityApparatus',
      payload: { regulation: { operation: 'move', regulationId: 'reg-2', tileId: 'Committee-7' } },
    });
    const after = client.getState()!;
    expect(after.ctx.currentPlayer).toBe('1');
    expect(after.G.exp!.exp02!.regulations!.attached).toEqual([
      { id: 'reg-1', kind: 'Blockade', tileId: grassroots.tileId },
      { id: 'reg-2', kind: 'SecurityLevel', tileId: 'Committee-7' },
    ]);
  });

  it('Surveillance locks the object at its source without adding that tile as an Apparatus context', () => {
    const client = setupSecurity([apparatus, grassroots], G => {
      takeIntoFixtureHand(G, 'SEC_M13');
      mark(G, '0', apparatus.tileId);
      Object.assign(G.exp.core.players['0'].personal.resources, { SEC: 1, INF: 1 });
      const zones = G.exp!.exp02!.regulations!;
      zones.attached.push(
        { id: 'reg-1', kind: 'SecurityLevel', tileId: grassroots.tileId },
        { id: 'reg-2', kind: 'SecurityLevel', tileId: apparatus.tileId },
      );
      zones.serial = 2;
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: { measureId: 'SEC_M13', targetTileId: grassroots.tileId } });
    const locked = client.getState()!;
    expect(locked.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    expect(locked.G.exp.core.activeMeasureEffects?.[0]?.targetTileId).toBe(grassroots.tileId);
    const options = engineMoveOptions(locked.G, locked.ctx, '0');
    expect(options.some(option => JSON.stringify(option.parameters).includes('reg-1'))).toBe(false);
    expect(options.some(option => JSON.stringify(option.parameters).includes('reg-2') && option.contextTile === apparatus.tileId)).toBe(true);
    const activate = (regulation: unknown) => client.moves.doPoliticalAction({ type: 'activateAuthorityApparatus', payload: { regulation } });
    activate({ operation: 'move', regulationId: 'reg-1', tileId: 'Committee-7' });
    activate({ operation: 'remove', regulationId: 'reg-1' });
    expect(client.getState()!._stateID).toBe(locked._stateID);
    activate({ operation: 'move', regulationId: 'reg-2', tileId: 'Committee-7' });
    expect(client.getState()!.G.exp!.exp02!.regulations!.attached).toEqual([
      { id: 'reg-1', kind: 'SecurityLevel', tileId: grassroots.tileId },
      { id: 'reg-2', kind: 'SecurityLevel', tileId: 'Committee-7' },
    ]);
  });

  it('Situation Assessment discounts the next Regulation placement by another player', () => {
    const client = setupSecurity([], G => {
      takeIntoFixtureHand(G, 'SEC_M15');
      takeIntoFixtureHand(G, 'SEC_M01', '1');
      G.exp.core.players['0'].personal.resources.SEC = 1;
      Object.assign(G.exp.core.players['1'].personal.resources, { SEC: 2, INF: 1 });
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: { measureId: 'SEC_M15' } });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: 'Committee-7' } });
    client.moves.placeTile({ q: -2, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: {
      measureId: 'SEC_M01', regulation: { operation: 'place', regulationKind: 'Control', tileId: 'Committee-7' },
    } });

    const { G, ctx } = client.getState()!;
    expect(ctx.activePlayers).toEqual({ '1': 'AdditionalPoliticalAction' });
    expect(G.exp!.exp02!.regulations!.attached).toEqual([{ id: 'reg-1', kind: 'Control', tileId: 'Committee-7' }]);
    expect(G.exp.core.activeMeasureEffects?.find(instance => instance.sourceCardId === 'SEC_M15')?.used).toBe(true);
    expect(G.exp.core.resources.bank).toMatchObject({ SEC: 3, INF: 1 });
  });

  it('resolves simultaneous registered Decrees in registration order and consumes both attempts', () => {
    const hotspot = { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } };
    const client = setupSecurity([
      hotspot,
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 1, r: -1 } },
      { tileId: 'Committee-3', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-4', coord: { q: 1, r: 1 } },
    ], G => {
      mark(G, '0', hotspot.tileId);
      for (const playNumber of [2, 1] as const) {
        const owner = String(playNumber - 1);
        G.exp.core.players[owner].personal.resources.SEC = 2;
        createResolver()(G, { kind: 'registerMeasureEffect', instance: {
          sourceCardId: 'SEC_M02', playNumber, owner, targetTileId: hotspot.tileId, duration: 'untilConsumed',
        } });
      }
    });
    client.moves.placeTile({ q: 2, r: 0 });
    const { G } = client.getState()!;
    expect(G.exp.core.activeMeasureEffects).toBeUndefined();
    expect(G.exp.core.players['1'].personal.resources.SEC).toBe(0);
    expect(G.exp.core.players['0'].personal.resources.SEC).toBe(2);
    expect(G.exp!.exp02!.regulations!.attached).toEqual([{ id: 'reg-1', kind: 'Blockade', tileId: hotspot.tileId }]);
    expect(G.exp.core.tiles.board.find(tile => tile.tileId === hotspot.tileId)?.enclosureProcessed).toBe(true);
    expect(G.exp.core.influencesOnBoard!.filter(marker => marker.tileId === hotspot.tileId)).toHaveLength(1);
  });

  it.each([false, true])('consumes Emergency Decree at enclosure after a payable=%s placement attempt', payable => {
    const hotspot = { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } };
    const board = [
      hotspot,
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 1, r: -1 } },
      { tileId: 'Committee-3', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-4', coord: { q: 1, r: 1 } },
    ];
    const client = setupSecurity(board, G => {
      takeIntoFixtureHand(G, 'SEC_M02');
      mark(G, '1', hotspot.tileId);
      G.exp.core.players['0'].personal.resources.SEC = payable ? 4 : 2;
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: { measureId: 'SEC_M02', targetTileId: hotspot.tileId } });
    expect(client.getState()!.G.exp.core.activeMeasureEffects?.[0].sourceCardId).toBe('SEC_M02');
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: 'Committee-7' } });
    client.moves.placeTile({ q: 2, r: 0 });

    const { G, ctx } = client.getState()!;
    expect(ctx.activePlayers).toEqual({ '1': 'ExactlyOnePoliticalAction' });
    expect(G.exp.core.activeMeasureEffects).toBeUndefined();
    expect(G.exp.core.tiles.board.find(tile => tile.tileId === hotspot.tileId)?.enclosureProcessed).toBe(true);
    expect(G.exp.core.resources.bank.SEC).toBe(payable ? 4 : 2);
    expect(G.exp!.exp02!.regulations!.attached).toHaveLength(payable ? 1 : 0);
    expect(G.exp.core.influencesOnBoard!.filter(marker => marker.tileId === hotspot.tileId)).toHaveLength(payable ? 1 : 2);
  });

  it('lets the majority player resolve Inner Order before the current player acts', () => {
    const hotspot = { tileId: 'InnerOrder', coord: { q: 1, r: 0 } };
    const client = setupSecurity([
      hotspot,
      { tileId: 'Committee-1', coord: { q: 2, r: -1 } },
      { tileId: 'Committee-2', coord: { q: 1, r: -1 } },
      { tileId: 'Committee-3', coord: { q: 0, r: 1 } },
      { tileId: 'Committee-4', coord: { q: 1, r: 1 } },
    ], G => {
      mark(G, '1', hotspot.tileId);
      G.exp.core.players['1'].personal.resources.SEC = 2;
    });
    client.moves.placeTile({ q: 2, r: 0 });
    const pending = client.getState()!;
    expect(pending.ctx.currentPlayer).toBe('0');
    expect(pending.ctx.activePlayers).toEqual({ '1': 'ResolveHotspot' });
    expect(pending.G.exp.core.pendingHotspot).toEqual({ tileId: hotspot.tileId, playerID: '1', outcome: 'regulation' });
    const choice = { kind: 'regulation', regulation: { operation: 'place', regulationKind: 'Control', tileId: 'Committee-7' } };
    client.moves.chooseHotspotOutcome(choice);
    expect(client.getState()!._stateID).toBe(pending._stateID);
    client.updatePlayerID('1');
    client.moves.chooseHotspotOutcome(choice);

    const { G, ctx } = client.getState()!;
    expect(ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
    expect(G.exp.core.pendingHotspot).toBeUndefined();
    expect(G.exp.core.resources.bank.SEC).toBe(2);
    expect(G.exp!.exp02!.regulations!.attached).toContainEqual({ id: 'reg-1', kind: 'Control', tileId: 'Committee-7' });
    expect(G.exp.core.tiles.board.find(tile => tile.tileId === hotspot.tileId)?.enclosureProcessed).toBe(true);
    expect(G.exp.core.influencesOnBoard).toHaveLength(1);
  });

  it('resumes the additional slot only after a registered Deployment Order moves the new Regulation', () => {
    const client = setupSecurity([apparatus, grassroots], G => {
      takeIntoFixtureHand(G, 'SEC_M03');
      takeIntoFixtureHand(G, 'SEC_M01');
      Object.assign(G.exp.core.players['0'].personal.resources, { SEC: 4, INF: 1 });
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: { measureId: 'SEC_M03' } });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: 'Committee-7' } });
    client.moves.placeTile({ q: -2, r: 0 });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-1-1', targetTileId: 'Committee-8' } });
    client.moves.placeTile({ q: -3, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: {
      measureId: 'SEC_M01', regulation: { operation: 'place', regulationKind: 'SecurityLevel', tileId: grassroots.tileId },
    } });
    const pending = client.getState()!;
    expect(pending.ctx.activePlayers).toEqual({ '0': 'ResolveRegulationFollowUp' });
    expect(pending.G.exp!.exp02!.regulations!.attached[0].tileId).toBe(grassroots.tileId);
    client.moves.chooseRegulationFollowUp({
      kind: 'regulation', regulation: { operation: 'move', regulationId: 'reg-1', tileId: 'Committee-9' },
    });

    const { G, ctx } = client.getState()!;
    expect(ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
    expect(G.exp!.exp02!.regulations!.attached).toEqual([{ id: 'reg-1', kind: 'SecurityLevel', tileId: 'Committee-9' }]);
    expect(G.exp.core.resources.bank).toMatchObject({ SEC: 4, INF: 1 });
    expect(G.exp.core.activeMeasureEffects).toBeUndefined();
  });

  it('offers and charges Competence Conflict separately after Authority activation', () => {
    const client = setupSecurity([apparatus, grassroots], G => {
      takeIntoFixtureHand(G, 'SEC_M05');
      mark(G, '0', apparatus.tileId);
      const zones = G.exp!.exp02!.regulations!;
      zones.attached.push({ id: 'reg-1', kind: 'SecurityLevel', tileId: grassroots.tileId });
      zones.serial = 1;
      Object.assign(G.exp.core.players['0'].personal.resources, { SEC: 3, DOM: 1 });
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: { measureId: 'SEC_M05' } });
    client.moves.doPoliticalAction({ type: 'activateAuthorityApparatus', payload: {
      regulation: { operation: 'remove', regulationId: 'reg-1' },
    } });
    const pending = client.getState()!;
    expect(pending.ctx.activePlayers).toEqual({ '0': 'ResolveRegulationFollowUp' });
    expect(pending.G.exp.core.resources.bank).toMatchObject({ SEC: 1, DOM: 1 });
    expect(pending.G.exp!.exp02!.regulations!.supply).toContainEqual({ id: 'reg-1', kind: 'SecurityLevel' });
    client.moves.chooseRegulationFollowUp({ kind: 'regulation', regulation: {
      operation: 'place', regulationKind: 'Control', tileId: apparatus.tileId,
    } });
    const { G, ctx } = client.getState()!;
    expect(ctx.currentPlayer).toBe('1');
    expect(G.exp.core.resources.bank).toMatchObject({ SEC: 3, DOM: 1 });
    expect(G.exp!.exp02!.regulations!.attached).toEqual([{ id: 'reg-2', kind: 'Control', tileId: apparatus.tileId }]);
  });

  it('resumes a paused Settlement without repeating the registered placement or producing early', () => {
    const hotspot = { tileId: 'Hotspot-1', coord: { q: 1, r: 0 } };
    const resort = { tileId: 'DOM-W1-1', coord: { q: 0, r: 1 } };
    const client = setupSecurity([hotspot, resort], G => {
      takeIntoFixtureHand(G, 'SEC_M12');
      mark(G, '0', resort.tileId);
      G.exp.core.players['0'].personal.resources.SEC = 4;
      createResolver()(G, {
        kind: 'registerMeasureEffect',
        instance: { sourceCardId: 'SEC_M03', playNumber: 1, owner: '0', duration: 'untilConsumed' },
      });
    });
    client.moves.placeTile({ q: -1, r: 0 });
    client.moves.doPoliticalAction({ type: 'exp02_playMeasure', payload: {
      measureId: 'SEC_M12', regulation: { operation: 'place', regulationKind: 'SecurityLevel', tileId: hotspot.tileId },
    } });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-2', targetTileId: 'Committee-7' } });
    client.moves.placeTile({ q: -2, r: 0 });
    client.moves.doPoliticalAction({ type: 'placeOrMoveInfluence', payload: { markerId: 'INF-1-1', targetTileId: 'Committee-8' } });
    const pending = client.getState()!;
    expect(pending.ctx.currentPlayer).toBe('1');
    expect(pending.ctx.activePlayers).toEqual({ '0': 'ResolveRegulationFollowUp' });
    expect(pending.G.exp.core.players['0'].personal.resources.DOM).toBe(0);
    expect(pending.G.exp.core.resources.bank.SEC).toBe(4);

    client.updatePlayerID('0');
    client.moves.chooseRegulationFollowUp({
      kind: 'regulation', regulation: { operation: 'move', regulationId: 'reg-1', tileId: 'Committee-7' },
    });
    const { G, ctx } = client.getState()!;
    expect(ctx.turn).toBe(3);
    expect(G.exp.core.resources.bank.SEC).toBe(4);
    expect(G.exp.core.players['0'].personal.resources.DOM).toBe(1);
    expect(G.exp!.exp02!.regulations!.attached).toEqual([{ id: 'reg-1', kind: 'SecurityLevel', tileId: 'Committee-7' }]);
    expect(G.exp.core.decisionContinuation).toBeUndefined();
    expect(G.exp.core.activeMeasureEffects).toBeUndefined();
  });
});
