import { Client } from 'boardgame.io/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CoreStages, createBCGame, engineMoveOptions, type EngineMoveOption } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';
import CommitteeFormalization from './CommitteeFormalization.js';
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
    expect(placement).toContain(`1 on board · ${state().G.exp.core.tiles.drawPile.length} in bag`);
    expect(placement).toContain('title="On board · 7 markers to win"');
    expect(placement).toContain('>7</text>');
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
    expect(nextTurn).toMatch(/data-acting="true"[^>]*><th scope="row" aria-label="Player 2"[^>]*aria-current="true"/);
    expect(nextTurn).not.toContain('>To act<');
    expect(nextTurn).toContain('Controlled by Player 1. Player 1 has 1 marker');

    submit(options()[0]);
    submit(options()[0]);
    submit(options()[0]);
    const withMoves = render();
    expect(withMoves).toContain('Player 1 to act');
    expect(withMoves).toContain('Legal action: Place / Move');
    expect(withMoves).toMatch(/Move .* from .* to /);
  });

  it('reaches the recorded pre-distance result using only offered options and shows the shared win', () => {
    const game = createBCGame({
      matchSeed: 'task-0030-full-core', variants: { resourceCap: true, influenceRecall: true },
    }, 'recorded');
    const { state, options, submit, render } = hotseat(game);
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
    expect(state().G.lastTurnHash).toBe('8b60107598782f31d1c0c48e4537fe8cffbae80aaa7509e204756c50b54e4cab');
    const end = render();
    expect(end).toContain('Shared win · Player 1 and Player 2');
    expect(end).toContain('On board');
    expect(end.match(/<\/th><td data-empty="false"><strong class="supply-count">4<\/strong><\/td><td data-empty="true"><strong class="supply-count">0<\/strong><\/td>/g)).toHaveLength(2);
    expect(end).toContain('Start a new match');
    expect(end).not.toContain('<select');
  });
});

it('marks only players who still owe a first placement when inspecting either kind of committee', () => {
  const { state, options, submit } = hotseat();
  submit(options()[0]);
  const { G, ctx } = structuredClone(state());
  const core = G.exp.core;
  const [recalled, ...placed] = core.players['1'].personal.influence;
  core.players['1'].personal.influence = [{ ...recalled, recalled: true }];
  core.influencesOnBoard = placed.map(marker => ({ ...marker, tileId: core.tiles.board[1].tileId }));

  for (const kind of ['StartCommittee', 'Committee'] as const) {
    const markup = renderToStaticMarkup(<CommitteeFormalization G={G} ctx={ctx} kind={kind}
      tileId="StartCommittee" available={false} />);
    expect(markup).toContain('Still to place starting markers');
    expect(markup).toContain('>P1</span>');
    expect(markup).not.toContain('>P2</span>');
  }
});

it('shows the legal Start Committee action and the player who has already used it', () => {
  const { state, options, submit, render } = hotseat();
  const initial = render();
  expect(initial).toContain('Formalization: Locked. Used Start Committee: none');
  expect(initial).toContain('data-player="0"><span class="formalization-chip" data-status="locked"');
  submit(options()[0]);
  const { G, ctx, _stateID } = structuredClone(state());
  const core = G.exp.core;
  const tileId = core.tiles.board[1].tileId;
  core.influencesOnBoard = Object.values(core.players).flatMap(({ personal }) =>
    personal.influence.splice(0).map(marker => ({ ...marker, tileId })));
  Object.assign(core.players['0'].personal.resources, { DOM: 2, FOR: 1, INF: 1 });
  core.players['1'].usedStartCommittee = true;

  const board = renderToStaticMarkup(<CoreView G={G} ctx={ctx} revision={_stateID} playerID="0" isActive={false}
    computerPlayers={new Set(['0'])} submit={() => undefined} />);
  const startTile = board.match(/<button [^>]*aria-label="Start Committee \(0, 0\)[^"]*"[^>]*>.*?<\/button>/s)?.[0];
  expect(startTile).toContain('Formalization: Available for Player 1. Used Start Committee: Player 2');
  expect(startTile).toContain('data-player="0"><span class="formalization-chip" data-status="available"');
  expect(startTile).toContain('data-player="1"><span class="formalization-chip" data-status="used"');
  expect(startTile).not.toContain('class="tile-action');
  const details = renderToStaticMarkup(<CommitteeFormalization G={G} ctx={ctx} kind="StartCommittee"
    tileId="StartCommittee" playerID="0" available />);
  expect(details).toMatch(/Already used the Start Committee.*?>P2<\/span>/);
});

it('breaks multiword tile names at word boundaries', () => {
  const { state } = hotseat(createBCGame({ expansions: { exp03: true } }));
  const { StartCommittee, Transformationsdruck } = state().G.exp.core.allTiles;
  expect(renderToStaticMarkup(<TileFace tile={StartCommittee} />)).toContain('>Start\nCommittee</span>');
  expect(renderToStaticMarkup(<TileFace tile={Transformationsdruck} />)).toContain('>Transfor\u00admation\nPressure</span>');
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
  expect(tile?.match(/class="influence-chip"/g)).toHaveLength(6);
  expect(Array.from(tile?.matchAll(/class="tile-corner" data-player="(\d)"/g) ?? [], match => match[1]))
    .toEqual(['0', '1', '2', '3', '4', '5']);
  expect(tile?.match(/<b>1<\/b>/g)).toHaveLength(6);
  expect(tile).not.toMatch(/>P[1-6]</);
  expect(tile?.match(/class="influence-chip" data-majority="control"/g)).toHaveLength(1);
  expect(tile).toMatch(/data-majority="control"[^>]*--player-color:#22D3EE[^>]*><b>1<\/b><span class="virtual-influence">\+1<\/span>/);
  expect(tile).toContain('Player 6 has 1 marker and 1 virtual influence');
  expect(tile).toContain('Regulations: Administration');
  core.influencesOnBoard.pop();
  const tiedTile = resortButton(render());
  expect(tiedTile).toContain('Tied majority');
  expect(tiedTile?.match(/class="influence-chip" data-majority="tie"/g)).toHaveLength(6);
  const supplies = markup.match(/<table class="core-supplies">.*?<\/table>/)?.[0];
  expect(supplies?.match(/class="resource-icon"/g)).toHaveLength(6);
  expect(supplies?.match(/class="supply-zone-icon"/g)).toHaveLength(2);
  expect(supplies).toContain('Player 6');
  expect(supplies).toContain('>P6</span>');
  expect(supplies).toContain('title="On board · 8 markers to win"');
  expect(supplies).toContain('title="In supply"');
  expect(supplies).toContain('>8</text>');
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
