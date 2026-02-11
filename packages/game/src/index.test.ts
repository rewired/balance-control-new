import { describe, it, expect } from 'vitest';
import { CounterGame } from './index.js';

// Test the game setup + move without spinning a Client (no timers)
describe('CounterGame', () => {
  it('increments deterministically', () => {
    const init = CounterGame.setup as unknown as (ctx: unknown) => { count: number };
    const G = init({});
    const inc = CounterGame.moves!.increment as unknown as (args: { G: { count: number } }) => void;
    inc({ G });
    expect(G.count).toBe(1);
  });
});
