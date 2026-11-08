import { describe, expect, it, vi } from 'vitest';
import type { LegalMoveOption } from '@bc/game';
import { chooseOptionWithLLM } from './adapter.js';

const placement: LegalMoveOption = {
  playerID: '0',
  moveType: 'placeTile',
  parameters: [{ q: 0, r: 1 }],
  costBreakdown: [{ playerID: '0', resource: 'CLM', amount: 1 }],
  contextTile: 'Committee-1',
  resultingStateHashPreview: 'a'.repeat(64),
};
const options = [placement, { ...placement, parameters: [{ q: 1, r: 0 }] }];

describe('S15: LLM selects an engine option by index', () => {
  it('sends the complete engine options and selects the second one', async () => {
    const complete = vi.fn(async () => '{"index":1}');
    expect(await chooseOptionWithLLM(options, 'Turn=1', { complete })).toBe(options[1]);
    expect(complete).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify([{ index: 0, ...options[0] }, { index: 1, ...options[1] }])));
  });

  it.each(['invalid JSON', '{"index":-1}', '{"index":0.5}', '{"index":"1"}', '{"index":2}', '{"index":1,"payload":{}}'])(
    'falls back deterministically for %s',
    async raw => expect(await chooseOptionWithLLM(options, '', { complete: async () => raw })).toBe(options[0]),
  );

  it('handles backend failure and a slot with no options', async () => {
    const complete = vi.fn(async () => { throw new Error('offline'); });
    expect(await chooseOptionWithLLM(options, '', { complete })).toBe(options[0]);
    expect(await chooseOptionWithLLM(options, '')).toBe(options[0]);
    expect(await chooseOptionWithLLM([], '', { complete })).toBeUndefined();
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
