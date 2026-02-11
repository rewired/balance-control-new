/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { CoreGame } from './core.js';

const setup = (numPlayers: number, setupData?: unknown) => {
  const fn = CoreGame.setup as unknown as (ctx: { matchID: string; numPlayers: number; setupData?: unknown }) => any;
  return fn({ matchID: 't', numPlayers, setupData });
};

describe('CoreGame setup — expansion flags (Task 0010)', () => {
  it('no setupData -> pure CORE (no exp slice)', () => {
    const G = setup(2);
    expect((G as any).exp).toBeUndefined();
  });
  it('setupData.expansions.exp01=true -> exp01 slice present only', () => {
    const G = setup(2, { expansions: { exp01: true } });
    expect((G as any).exp?.exp01).toBeDefined();
    expect((G as any).exp?.exp02).toBeUndefined();
    expect((G as any).exp?.exp03).toBeUndefined();
  });
});