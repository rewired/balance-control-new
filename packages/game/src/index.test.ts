import { describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { CounterGame } from './index';

describe('CounterGame', () => {
  it('increments deterministically', () => {
    const client = Client({ game: CounterGame });
    client.start();
    client.moves.increment();
    const state = client.getState();
    expect(state?.G.count).toBe(1);
  });
});