import { Client } from 'boardgame.io/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CoreStages, createBCGame, engineMoveOptions, type EngineMoveOption } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';
import { TileFace } from './CoreHexBoard.js';
import { MeasurePanel, RegulationPanel } from './ExpansionPanels.js';
import { describeOption, measureAction, optionCost } from './core-board-labels.js';

function hotseat(game = createBCGame({ matchSeed: 'task-0030-full-core' }), numPlayers = 2) {
  const client = Client({ game, numPlayers, playerID: '0' });
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

    const placement = render();
    expect(placement).toContain('Player 1 to act');
    expect(placement).toContain('Start Committee');
    expect(placement).toContain('Place the drawn tile');
    expect(placement).not.toContain('Expansion tools');
    expect(placement.match(/aria-label="Place tile at /g)).toHaveLength(options().length);
    const waiting = render('1');
    expect(waiting).toContain('Waiting for Player 1');
    expect(waiting).not.toContain('aria-label="Place tile at ');
    submit(chosenPlacement);
    expect(state().G.exp.core.tiles.board).toContainEqual({ tileId, coord: chosenPlacement.parameters[0] });

    const politics = render();
    expect(politics).toContain('Choose a political action');
    expect(politics).toContain('Legal action: Place');
    expect(politics).toContain('from your supply on');
    expect(politics).toContain('Cost: Free');
    expect(politics).not.toContain('placeOrMoveInfluence');
    expect(politics).not.toContain('aria-label="Place tile at ');
    expect(render('1')).not.toContain('Legal action: Place');
    const chosenAction = options()[1];
    const { markerId } = (chosenAction.parameters[0] as { payload: { markerId: string } }).payload;
    submit(chosenAction);
    expect(state().G.exp.core.influencesOnBoard).toContainEqual(expect.objectContaining({ id: markerId, tileId, owner: '0' }));
    expect(state().ctx.currentPlayer).toBe('1');
    const nextTurn = render();
    expect(nextTurn).toContain('Player 2 to act');
    expect(nextTurn).toContain('Controlled by Player 1. Player 1 has 1 marker');

    submit(options()[0]);
    submit(options()[0]);
    submit(options()[0]);
    const withMoves = render();
    expect(withMoves).toContain('Player 1 to act');
    expect(withMoves).toContain('Legal action: Place / Move');
    expect(withMoves).toMatch(/Move .* from .* to /);
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
    const end = render();
    expect(end).toContain('Shared win · Player 1 and Player 2');
    expect(end).toContain('On board');
    expect(end.match(/4 starting · 0 additional/g)).toHaveLength(2);
    expect(end).toContain('Start a new match');
    expect(end).not.toContain('<select');
  });
});

it('shows the English name of the Climate Hotspot on the tile', () => {
  const { state } = hotseat(createBCGame({ expansions: { exp03: true } }));
  const tile = state().G.exp.core.allTiles.Transformationsdruck;
  expect(renderToStaticMarkup(<TileFace tile={tile} />)).toContain('>Transformation Pressure</span>');
});

it('shows all six players on one tile and all six active resources alongside the market', () => {
  const { state } = hotseat(createBCGame({
    addOn56: true, expansions: { exp01: true, exp02: true, exp03: true },
  }), 6);
  const { G, ctx, _stateID } = structuredClone(state());
  const core = G.exp.core;
  const tileId = core.tiles.drawPile.find(id => core.allTiles[id].kind === 'ResortTile')!;
  const lobbyistId = core.tiles.drawPile.find(id => core.allTiles[id].kind === 'Lobbyist')!;
  core.tiles.drawPile = core.tiles.drawPile.filter(id => id !== tileId && id !== lobbyistId);
  core.tiles.board.push({ tileId, coord: { q: 1, r: 0 } }, { tileId: lobbyistId, coord: { q: 2, r: 0 } });
  core.influencesOnBoard = Object.values(core.players).map(({ personal }) => ({ ...personal.influence.shift()!, tileId }));
  core.influencesOnBoard.push({ ...core.players['5'].personal.influence.shift()!, tileId: lobbyistId });
  G.exp.exp02!.regulations!.attached.push({ id: 'test-regulation', kind: 'Administration', tileId });

  const render = () => renderToStaticMarkup(<CoreView G={G} ctx={ctx} revision={_stateID} submit={() => undefined} />);
  const resortButton = (markup: string) => markup.match(/<button [^>]*aria-label="[^"]*\(1, 0\)[^"]*"[^>]*>.*?<\/button>/)?.[0];
  const markup = render();
  const tile = resortButton(markup);
  expect(tile).toBeDefined();
  expect(tile).toMatch(/<strong class="tile-yield">\d+<\/strong>/);
  expect(tile?.match(/class="player-marker"/g)).toHaveLength(6);
  expect(tile?.match(/class="influence-chip" data-majority="control"/g)).toHaveLength(1);
  expect(tile).toMatch(/data-majority="control".*?P6<\/span>/);
  expect(tile).toContain('Player 6 has 1 marker and 1 virtual influence');
  expect(tile).toContain('Regulations: Administration');
  core.influencesOnBoard.pop();
  const tiedTile = resortButton(render());
  expect(tiedTile).toContain('Tied majority');
  expect(tiedTile?.match(/class="influence-chip" data-majority="tie"/g)).toHaveLength(6);
  const supplies = markup.match(/<table class="core-supplies">.*?<\/table>/)?.[0];
  expect(supplies?.match(/class="resource-icon"/g)).toHaveLength(6);
  expect(supplies).toContain('Player 6');
  expect(markup).toContain('Open Measures');
});

it('takes a Security measure and offers a named, priced Regulation action for the card in hand', () => {
  const game = createBCGame({ expansions: { exp02: true } });
  const setup = game.setup!;
  game.setup = (context, setupData) => {
    const G = setup(context, setupData);
    const deck = G.exp.exp02!.measures!;
    const index = deck.drawPile.indexOf('SEC_M01');
    if (index !== -1) [deck.open[0], deck.drawPile[index]] = ['SEC_M01', deck.open[0]!];
    Object.assign(G.exp.core.players['0'].personal.resources, { SEC: 3, INF: 1 });
    return G;
  };
  const { state, options, submit, render } = hotseat(game);
  submit(options()[0]);
  const market = renderToStaticMarkup(<MeasurePanel G={state().G} options={options()} onSelect={() => undefined} />);
  expect(market).toContain('Security &amp; Order');
  expect(market).toContain('Threat Situation');
  expect(market).toContain('Take available');
  expect(market).not.toContain('Economy &amp; Labor');
  expect(market).not.toContain('Climate &amp; Future');
  const take = options().find(option => measureAction(option)?.id === 'SEC_M01')!;
  expect(describeOption(state().G, take)).toBe('Take Threat Situation');
  submit(take);
  expect(state().G.exp.exp02!.measures!.hands['0']).toEqual(['SEC_M01']);

  submit(options()[0]);
  submit(options().find(option => describeOption(state().G, option).startsWith('Place marker'))!);
  submit(options()[0]);
  const hand = renderToStaticMarkup(<MeasurePanel G={state().G} options={options()} onSelect={() => undefined} />);
  expect(hand).toContain('Player 1 · 1 in hand');
  expect(hand).toContain('Play available');
  const play = options().find(option => describeOption(state().G, option)
    .startsWith('Play Threat Situation · Place Security Level on '))!;
  expect(optionCost(play)).toBe('3 SEC + 1 INF');
  submit(play);
  expect(state().ctx.activePlayers).toEqual({ '0': CoreStages.AdditionalPoliticalAction });
  const attached = state().G.exp.exp02!.regulations!.attached;
  expect(attached).toHaveLength(1);
  expect(render()).toContain('Regulations: Security Level (reg-1)');
  const regulations = renderToStaticMarkup(<RegulationPanel G={state().G} options={options()} onInspect={() => undefined} />);
  expect(regulations).toContain('Security Level (reg-1)');
});
