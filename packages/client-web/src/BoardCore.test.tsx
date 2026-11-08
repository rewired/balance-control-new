import { Client } from 'boardgame.io/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createBCGame, engineMoveOptions, type EngineMoveOption } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';

function hotseat() {
  const client = Client({ game: createBCGame({ matchSeed: 'task-0030-full-core' }), numPlayers: 2, playerID: '0' });
  const state = () => client.getState()!;
  const activePlayer = () => Object.keys(state().ctx.activePlayers ?? {})[0] ?? state().ctx.currentPlayer;
  const submit = (option: EngineMoveOption) => {
    client.updatePlayerID(option.playerID);
    submitCoreOption(client.moves, option);
  };
  const options = () => engineMoveOptions(state().G, state().ctx, activePlayer());
  const render = (playerID = activePlayer()) => {
    const { G, ctx, _stateID } = state();
    return renderToStaticMarkup(<CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID}
      submit={submit} onNewMatch={() => undefined} />);
  };
  return { state, options, submit, render };
}

describe('CORE hotseat', () => {
  it('shows legal placement targets, readable political actions and the next player', () => {
    const { state, options, submit, render } = hotseat();
    const chosenPlacement = options()[1];
    const tileId = state().G.exp.core.tiles.drawResolution!.tileId;

    expect(render()).toContain('Start Committee');
    expect(render()).toContain('Place the drawn tile');
    expect(render().match(/aria-label="Place tile at /g)).toHaveLength(options().length);
    expect(render('1')).not.toContain('aria-label="Place tile at ');
    submit(chosenPlacement);
    expect(state().G.exp.core.tiles.board).toContainEqual({ tileId, coord: chosenPlacement.parameters[0] });

    expect(render()).toContain('Choose a political action');
    expect(render()).toContain('from your supply on');
    expect(render()).toContain('Cost: Free');
    expect(render()).not.toContain('placeOrMoveInfluence');
    expect(render()).not.toContain('aria-label="Place tile at ');
    const chosenAction = options()[1];
    const { markerId } = (chosenAction.parameters[0] as { payload: { markerId: string } }).payload;
    submit(chosenAction);
    expect(state().G.exp.core.influencesOnBoard).toContainEqual(expect.objectContaining({ id: markerId, tileId, owner: '0' }));
    expect(state().ctx.currentPlayer).toBe('1');
    expect(render()).toContain('Player 2');
    expect(render()).toContain('Controlled by Player 1');
  });

  it('reaches the engine result using only offered options and shows the shared win', () => {
    const { state, options, submit, render } = hotseat();
    for (let turn = 1; turn <= 71; turn++) {
      const playerID = state().ctx.currentPlayer;
      const tileId = state().G.exp.core.tiles.drawResolution!.tileId;
      const placement = options().find(({ parameters: [coord] }) =>
        (coord as { q: number; r: number }).q === turn && (coord as { q: number; r: number }).r === 0);
      expect(placement).toBeDefined();
      submit(placement!);

      const markerId = `INF-${playerID}-${turn <= 8 ? Math.ceil(turn / 2) : 1}`;
      const action = options().find(({ parameters: [action] }) => {
        const { type, payload } = action as { type: string; payload: { markerId?: string; targetTileId?: string } };
        return type === 'placeOrMoveInfluence' && payload.markerId === markerId && payload.targetTileId === tileId;
      });
      expect(action).toBeDefined();
      submit(action!);
    }
    expect(state().ctx.gameover).toEqual({ winners: ['0', '1'] });
    expect(state().G.lastTurnHash).toBe('06033bb8ff0535ed345c7adb61bbfd1b4f62458376d42dfc43914a1c76442ad5');
    expect(render()).toContain('Shared win · Player 1 and Player 2');
    expect(render()).toContain('4 on board');
    expect(render()).toContain('Start a new match');
    expect(render()).not.toContain('<select');
  });
});