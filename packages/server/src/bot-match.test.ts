import { describe, expect, it } from 'vitest';
import { createBCGame, type LegalMoveOption } from '@bc/game';
import { runBotMatch } from './bot-match.js';

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
    const seen: (LegalMoveOption & { index: number })[][] = [];
    const backend = {
      complete: async (prompt: string) => {
        const options = JSON.parse(prompt.split('\n').at(-1)!) as (LegalMoveOption & { index: number })[];
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
});
