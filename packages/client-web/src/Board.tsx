import React from 'react';

export interface Moves { increment: () => void }
export interface CounterProps { G: { count: number }; moves: Moves }

export function CounterBoard({ G, moves }: CounterProps) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>Count: {G.count}</div>
      <button onClick={() => moves.increment()}>Increment</button>
    </div>
  );
}
export default CounterBoard;
