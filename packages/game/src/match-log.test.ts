import { Client } from 'boardgame.io/client';
import { expect, it, vi } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions, hashEngineState } from './legal-options.js';
import { createMatchLog, createMatchLogRecorder, verifyMatchLog } from './match-log.js';

it('replays the original access rules for an empty-hand pickup and same-turn play', () => {
  const game = createBCGame({
    matchSeed: 'measure-access-1', expansions: { exp02: true, exp03: true },
    variants: { resourceCap: true, influenceRecall: true, influenceDistance: true, disruption: true, measureRegulationAccess: true },
  }, 'recorded');
  const client = Client({ game, numPlayers: 2 });
  const initial = structuredClone(client.getInitialState());
  expect(Object.keys(initial.G.exp.core.allTiles)).not.toContain('SEC-W1-1');
  const offer = initial.G.exp.core.tiles.drawResolution!;
  client.moves.placeTile(offer.legalCoords[0]);
  client.moves.doPoliticalAction({ type: 'exp02_takeMeasure', payload: { measureId: 'SEC_M15' } });
  const afterTake = client.store.getState();
  expect(afterTake.ctx.activePlayers).toEqual({ '0': 'ExactlyOnePoliticalAction' });
  expect(afterTake.G.exp.exp02!.measures!.hands['0']).toEqual(['SEC_M15']);
  expect(afterTake.G.exp.exp01).toBeUndefined();
  const options = engineMoveOptions(afterTake.G, afterTake.ctx, '0');
  expect(options.some(option => (option.parameters[0] as { type?: string }).type?.endsWith('_takeMeasure'))).toBe(false);
  const play = options.find(option => (option.parameters[0] as { type?: string }).type === 'exp02_playMeasure')!;
  expect(play.costBreakdown).toEqual([]);
  client.moves[play.moveType](...play.parameters);
  const additional = client.store.getState();
  expect(additional.ctx.activePlayers).toEqual({ '0': 'AdditionalPoliticalAction' });
  expect(engineMoveOptions(additional.G, additional.ctx, '0').some(option =>
    (option.parameters[0] as { type?: string }).type?.endsWith('_takeMeasure'))).toBe(false);
  client.moves.doPoliticalAction({
    type: 'placeOrMoveInfluence', payload: { markerId: 'INF-0-1', targetTileId: offer.tileId },
  });
  const final = client.store.getState();
  expect(final.ctx.turn).toBe(2);
  expect(final.G.exp.core).not.toHaveProperty('emptyHandPickupUsed');
  expect(final.G.lastTurnHash).toBe('c347ce143dd37aed8cf696d314da769038cc2792255e1f4d051c2083ec41b7bd');
  const log = createMatchLog(initial, final, client.log!, { mode: 'hotseat' });
  expect(verifyMatchLog(JSON.parse(JSON.stringify(log)))).toEqual(log);
});

it('settles production from a drawn SEC Resort and reproduces it in a replay', () => {
  const game = createBCGame({ matchSeed: 'security-resorts-92', expansions: { exp02: true } });
  const client = Client({ game, numPlayers: 2 });
  const initial = structuredClone(client.getInitialState());
  expect(initial.G.exp.core.tiles.drawResolution?.tileId).toBe('SEC-W2-1');

  for (const playerID of ['0', '1']) {
    const offer = client.store.getState().G.exp.core.tiles.drawResolution!;
    client.moves.placeTile(offer.legalCoords[0]);
    client.moves.doPoliticalAction({
      type: 'placeOrMoveInfluence', payload: { markerId: `INF-${playerID}-1`, targetTileId: offer.tileId },
    });
  }

  const final = client.store.getState();
  expect(final.ctx.turn).toBe(3);
  expect(final.G.exp.core.players['0'].personal.resources.SEC).toBe(2);
  expect(final.G.exp.core.players['1'].personal.resources.SEC).toBe(0);
  expect(final.G.lastTurnHash).toBe('cd72f4c6e496e005858b8688cb84adbc0aae4c4574c74f098a25f6ff2fc89d74');
  const log = createMatchLog(initial, final, client.log!, { mode: 'hotseat' });
  expect(log.setup.game.variants.securityResorts).toBe(true);
  expect(verifyMatchLog(JSON.parse(JSON.stringify(log)))).toEqual(log);
});

it('exports a complete seeded game with only accepted actions, including undo and redo', () => {
  const client = Client({ game: createBCGame({ matchSeed: 'playtest-log', expansions: { exp01: true } }), numPlayers: 2, playerID: '0' });
  const initial = structuredClone(client.getInitialState());
  const state = () => client.store.getState();
  const source = { mode: 'hotseat', seats: { '0': 'human', '1': 'search' } } as const;
  const recorder = createMatchLogRecorder(state(), source);
  const record = () => recorder.record(state(), state().deltalog ?? []);
  const first = initial.G.exp.core.tiles.drawResolution!;
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    client.moves.placeTile({ q: 100, r: 100 });
    expect(state()._stateID).toBe(0);
    expect(record().steps).toHaveLength(0);
  } finally {
    errors.mockRestore();
  }
  client.moves.placeTile(first.legalCoords[0]);
  record();
  client.undo();
  record();
  client.redo();
  record();

  const partial = createMatchLog(initial, state(), client.log!, source);
  expect(partial.result).toBeNull();
  expect(partial.steps.map(step => step.action.kind)).toEqual(['move', 'undo', 'redo']);
  expect(partial.steps[0]).toMatchObject({ placedTile: first.tileId, stage: 'DrawAndPlaceTile' });
  expect(partial.steps[1].after.tiles).toEqual(partial.initial.tiles);
  expect(partial.steps[2].after.stateHash).toBe(partial.steps[0].after.stateHash);

  for (let i = 0; state().ctx.gameover === undefined && i < 500; i++) {
    const { G, ctx, _stateID } = state();
    const playerID = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
    const choice = engineMoveOptions(G, ctx, playerID)[0];
    client.updatePlayerID(playerID);
    client.moves[choice.moveType](...choice.parameters);
    expect(state()._stateID).toBe(_stateID + 1);
    record();
  }
  const final = state();
  const artifact = createMatchLog(initial, final, client.log!, source);
  expect(recorder.log).toEqual(artifact);
  expect(artifact.result?.winners.length).toBeGreaterThan(0);
  expect(artifact.result).toEqual(final.ctx.gameover);
  expect(artifact.steps).toHaveLength(final._stateID);
  expect(artifact.steps.at(-1)?.after).toMatchObject({
    stateHash: hashEngineState(final), lastTurnHash: final.G.lastTurnHash, noise: final.G.exp.core.resources.noise,
  });
  expect(artifact.initial.players['0'].resources).toHaveProperty('ECO');
  expect(artifact.initial.players['0'].resources).not.toHaveProperty('SEC');
  expect(verifyMatchLog(JSON.parse(JSON.stringify(artifact)))).toEqual(artifact);

  const tampered = structuredClone(artifact);
  tampered.steps[0].after.stateHash = 'wrong';
  expect(() => verifyMatchLog(tampered)).toThrow('differs at revision 1');
  expect(() => createMatchLog(initial, final, client.log!.slice(1), source)).toThrow('Incomplete match history');
});
