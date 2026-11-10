import { describe, it, expect } from 'vitest';
import { createMatch, InitializeGame } from 'boardgame.io/internal';
import type { Tile } from '@bc/rules';
import { createBCGame } from './factory.js';

const deck = (setupData: unknown) => {
  const { G } = InitializeGame({ game: createBCGame(), numPlayers: 2, setupData });
  return [G.exp.core.tiles.drawResolution!.tileId, ...G.exp.core.tiles.drawPile];
};

describe('boardgame.io match setup', () => {
  it('uses factory defaults and lets explicit engine setup data replace them', () => {
    const game = createBCGame({ matchSeed: 'factory-seed', expansions: { exp01: true } });
    const defaults = InitializeGame({ game, numPlayers: 2 }).G;
    expect(defaults.matchSeed).toBe('factory-seed');
    expect(defaults.exp?.exp01?.measures).toBeDefined();
    expect(defaults.cfg.variants).toMatchObject({ influenceDistance: true, disruption: true });

    const setupData = { matchSeed: 'lobby-seed', expansions: { exp01: false } };
    const override = InitializeGame({ game, numPlayers: 2, setupData }).G;
    expect(override.matchSeed).toBe('lobby-seed');
    expect(override.cfg.expansions.exp01).toBe(false);
    expect(override.cfg.variants).toMatchObject({ influenceDistance: true, disruption: true });
    expect(Object.keys(override.exp)).toEqual(['core']);
  });

  it('uses the supplied seed for the deck drawn by the engine', () => {
    expect(deck({ matchSeed: 'same' })).toEqual(deck({ matchSeed: 'same' }));
    expect(deck({ matchSeed: 'same' })).not.toEqual(deck({ matchSeed: 'other' }));
  });

  it('rejects malformed setup data through the lobby match creation API', () => {
    const result = createMatch({ game: createBCGame(), numPlayers: 2, setupData: { matchSeed: '' } });
    expect(result).toHaveProperty('setupDataError');
  });

  it.each([5, 6])('sets up the add-on and starting-player handicap for %i players', (numPlayers) => {
    const game = createBCGame();
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      expect(G.exp.core.tiles.drawResolution).toBeNull();
      return G;
    };
    const { G, ctx } = InitializeGame({
      game, numPlayers,
      setupData: { addOn56: true, topology: 'hex', variants: { firstPlayerHandicap: true, tileRecycling: true } },
    });

    expect(ctx.playOrder).toEqual(Object.keys(G.exp.core.players));
    expect(ctx.playOrder).toHaveLength(numPlayers);
    expect(G.cfg).toMatchObject({ addOn56: true, topology: 'hex', variants: { firstPlayerHandicap: true, tileRecycling: true } });
    for (const playerID of ctx.playOrder) {
      expect(G.exp.core.players[playerID].personal.influence).toHaveLength(playerID === ctx.currentPlayer ? 1 : 2);
    }

    const drawn = G.exp.core.tiles.drawResolution!;
    const ids = [...G.exp.core.tiles.drawPile, drawn.tileId];
    expect(ids).toHaveLength(89);
    expect(new Set(ids).size).toBe(89);
    expect(G.exp.core.tiles.drawPile).not.toContain(drawn.tileId);
    expect(G.exp.core.tiles.board).toEqual([{ tileId: 'StartCommittee', coord: { q: 0, r: 0 } }]);
    const tiles = Object.values<Tile>(G.exp.core.allTiles);
    expect(tiles).toHaveLength(90);
    for (const resort of ['DOM', 'FOR', 'INF']) {
      const resortTiles = tiles.filter(tile => tile.kind === 'ResortTile' && tile.resort === resort);
      expect([1, 2, 3, 4, 5].map(w => resortTiles.filter(tile => tile.w === w).length)).toEqual([2, 5, 5, 2, 1]);
    }
    expect(tiles.filter(tile => tile.kind === 'Committee')).toHaveLength(12);
    expect(tiles.filter(tile => tile.kind === 'Lobbyist')).toHaveLength(12);
    expect(tiles.filter(tile => tile.kind === 'Grassroots')).toHaveLength(10);
    expect(tiles.filter(tile => tile.kind === 'Hotspot')).toHaveLength(10);
    expect(ids).toEqual(expect.arrayContaining(['Hotspot-DOM', 'Hotspot-FOR']));
  });

  it.each([
    [5, {}],
    [4, { addOn56: true }],
    [2, { topology: 'diagonal' }],
    [2, { topology: 'orthogonal' }],
    [2, { variants: { unknownVariant: true } }],
  ])('rejects incompatible match setup for %i players', (numPlayers, setupData) => {
    const result = createMatch({ game: createBCGame(), numPlayers, setupData });
    expect(result).toHaveProperty('setupDataError');
  });
});
