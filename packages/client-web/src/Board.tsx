import type { BoardProps } from 'boardgame.io/react';

type CounterProps = Pick<BoardProps<{ count: number }>, 'G' | 'moves'>;

export function CounterBoard({ G, moves }: CounterProps) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>Count: {G.count}</div>
      <button onClick={() => moves.increment()}>Increment</button>
    </div>
  );
}
export default CounterBoard;
