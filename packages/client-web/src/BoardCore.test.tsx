import { Client } from 'boardgame.io/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createBCGame, engineMoveOptions } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';

describe('Core action picker', () => {
  it('uses current engine stages and submits the selected placement and political action', () => {
    const client = Client({ game: createBCGame(), numPlayers: 2, playerID: '0' });
    const submit = (option: ReturnType<typeof engineMoveOptions>[number]) => submitCoreOption(client.moves, option);
    const render = (playerID: string) => {
      const { G, ctx, _stateID } = client.getState()!;
      return renderToStaticMarkup(<CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID} submit={submit} />);
    };
    const options = () => {
      const { G, ctx } = client.getState()!;
      return engineMoveOptions(G, ctx, '0');
    };

    expect(render('0')).toContain('DrawAndPlaceTile');
    expect(render('0')).toContain('placeTile');
    expect(render('0')).not.toContain('doPoliticalAction');
    expect(render('1')).not.toContain('<select');
    const chosenPlacement = options()[1];
    const tileId = client.getState()!.G.exp.core.tiles.drawResolution!.tileId;
    submit(chosenPlacement);
    expect(client.getState()!.G.exp.core.tiles.board).toContainEqual({ tileId, coord: chosenPlacement.parameters[0] });

    expect(render('0')).toContain('ExactlyOnePoliticalAction');
    expect(render('0')).toContain('placeOrMoveInfluence');
    expect(render('0')).not.toContain('placeTile');
    const chosenAction = options()[1];
    const { markerId } = (chosenAction.parameters[0] as { payload: { markerId: string } }).payload;
    submit(chosenAction);
    expect(client.getState()!.G.exp.core.influencesOnBoard).toContainEqual(expect.objectContaining({ id: markerId, tileId, owner: '0' }));
    expect(client.getState()!.ctx.currentPlayer).toBe('1');
    expect(render('0')).not.toContain('<select');
    expect(render('1')).toContain('placeTile');
  });
});
