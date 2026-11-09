import { describe, expect, it } from 'vitest';
import { Client } from 'boardgame.io/client';
import { createBCGame, createComputerPosition, type EngineMoveOption } from '@bc/game';
import { describeBotPosition } from './bot-context.js';
import { runBotDuel, runBotMatch } from './bot-match.js';

describe('Bot match through boardgame.io', () => {
  it('plays a paid Measure, completes its additional action, and replays the final settlement', async () => {
    const game = createBCGame({ expansions: { exp01: true } });
    const setup = game.setup!;
    game.setup = (context, data) => {
      const G = setup(context, data);
      const draw = ['Committee-1'];
      G.exp.core.tiles.discardFaceUp = G.exp.core.tiles.drawPile.filter(tile => !draw.includes(tile));
      G.exp.core.tiles.drawPile = draw;
      const deck = G.exp!.exp01!.measures!;
      const card = 'ECO_M03';
      deck.drawPile = deck.drawPile.filter(id => id !== card);
      const slot = deck.open.indexOf(card);
      if (slot >= 0) deck.open[slot] = null;
      deck.hands['0'].push(card);
      G.exp.core.players['0'].personal.resources.ECO = 2;
      return G;
    };
    const seen: (Omit<EngineMoveOption, 'playerID'> & { index: number })[][] = [];
    const backend = {
      complete: async (prompt: string) => {
        const options = JSON.parse(prompt.split('\n').at(-1)!) as (Omit<EngineMoveOption, 'playerID'> & { index: number })[];
        expect(prompt).toContain('ECO_M03 Collective Bargaining');
        expect(prompt).toContain('The most real Influence markers on the board wins');
        expect(prompt).not.toMatch(/resultingStateHashPreview|lastTurnHash|drawPile/);
        seen.push(options);
        const play = options.find(option => JSON.stringify(option.parameters).includes('exp01_playMeasure'));
        return JSON.stringify({ index: play?.index ?? 0 });
      },
    };

    const result = await runBotMatch(2, backend, game);
    expect(result.gameover).toBeDefined();
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(seen).toHaveLength(3);
    expect(seen[0][0]).toMatchObject({ moveType: 'placeTile', contextTile: 'Committee-1' });
    expect(seen[1]).toContainEqual(expect.objectContaining({
      moveType: 'doPoliticalAction', contextTile: null, costBreakdown: [{ playerID: '0', resource: 'ECO', amount: 2 }],
      parameters: [{ type: 'exp01_playMeasure', payload: { measureId: 'ECO_M03' } }],
    }));
    expect(seen[2].every(option => !JSON.stringify(option.parameters).includes('exp01_playMeasure'))).toBe(true);
    expect(await runBotMatch(2, backend, game)).toEqual(result);
  });

  it('builds the same Ollama prompt even with different live deck orders, seed, and hash', () => {
    const game = createBCGame({ matchSeed: 'private-match-seed', expansions: { exp01: true, exp02: true, exp03: true } });
    const original = Client({ game, numPlayers: 2 }).store.getState();
    const other = structuredClone(original);
    other.G.matchSeed = 'another-private-match-seed';
    other.G.lastTurnHash = 'private-engine-fingerprint';
    other.G.exp.core.tiles.drawPile.reverse();
    for (const id of ['exp01', 'exp02', 'exp03'] as const) other.G.exp[id]!.measures!.drawPile.reverse();
    const prompt = describeBotPosition(createComputerPosition(original), '0');
    expect(describeBotPosition(createComputerPosition(other), '0')).toBe(prompt);
    expect(prompt).toContain('"board":[[0,0');
    expect(prompt).toContain('"you":"0"');
    expect(prompt).not.toMatch(/private-match-seed|private-engine-fingerprint|computer-search|drawPile|resultingStateHashPreview/);
    const hiddenTile = original.G.exp.core.tiles.drawPile.find(id => id !== original.G.exp.core.tiles.drawResolution!.tileId)!;
    const hiddenCard = original.G.exp.exp01!.measures!.drawPile[0];
    expect(prompt).not.toContain(hiddenTile);
    expect(prompt).not.toContain(hiddenCard);
  });

  it('reuses each seed with both seat assignments and excludes pairs contaminated by fallback', async () => {
    function makeGame(matchSeed: string) {
      const game = createBCGame({ matchSeed });
      const setup = game.setup!;
      game.setup = (context, data) => {
        const G = setup(context, data);
        const tiles = G.exp.core.tiles;
        const draw = tiles.drawPile.slice(0, 2);
        tiles.discardFaceUp = tiles.drawPile.slice(2);
        tiles.drawPile = draw;
        return G;
      };
      return game;
    }
    const legs: Array<{ seed: string; ollamaSeat: string; requests: number; fallbacks: number }> = [];
    const stats = await runBotDuel(['pair-a', 'pair-b'], {
      complete: async prompt => {
        const expectedSeat = String(legs.length % 2);
        expect(prompt).toContain(`"you":"${expectedSeat}"`);
        return legs.length === 3 ? '{"index":-1}' : '{"index":0}';
      },
    }, { makeGame, onGame: leg => legs.push(leg) });
    expect(legs.map(({ seed, ollamaSeat }) => [seed, ollamaSeat])).toEqual([
      ['pair-a', '0'], ['pair-a', '1'], ['pair-b', '0'], ['pair-b', '1'],
    ]);
    expect(legs.every(leg => leg.requests > 0)).toBe(true);
    expect(legs[3].fallbacks).toBeGreaterThan(0);
    expect(stats.excludedPairs).toBe(1);
    expect(stats.ollama + stats.hotseat + stats.draw).toBe(2);
  });
});
