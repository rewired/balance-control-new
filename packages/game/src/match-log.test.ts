import { Client } from 'boardgame.io/client';
import { expect, it, vi } from 'vitest';
import { createBCGame } from './factory.js';
import { engineMoveOptions, hashEngineState } from './legal-options.js';
import { createMatchLog, createMatchLogRecorder, verifyMatchLog } from './match-log.js';

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
