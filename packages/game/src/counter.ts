import type { Game,  } from "boardgame.io";

export interface CounterState {
  count: number;
}

export const CounterGame: Game<CounterState> = {
  name: 'counter',
  setup: (): CounterState => ({ count: 0 }),
  moves: {
    // NON-NORMATIVE: Task 0002 connectivity example move only. Not part of CORE.
    // See docs/design-decisions/DD-0002-hello-game-non-normative.md
    increment({ G }: { G: CounterState }) {
      G.count += 1;
    },
  },
};
export default CounterGame;


