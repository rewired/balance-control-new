import React from 'react';

export interface CoreMoves { placeTile: (coord: { q: number; r: number }) => void; chooseNoop?: () => void }
export interface CoreProps { G: unknown; moves: CoreMoves }

export default function CoreBoard({ G, moves }: CoreProps) {
  const pending = G.turn?.pending;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div><strong>Core â€” DrawAndPlaceTile</strong></div>
      {pending?.tileId ? (
        <div>
          <div>Drawn: <code>{pending.tileId}</code></div>
          <div>Legal placements:</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {pending.legalCoords.map((c: unknown) => (
              <button key={`${c.q},${c.r}`} onClick={() => moves.placeTile({ q: c.q, r: c.r })}>
                ({c.q},{c.r})
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>No tile drawn or all discarded.</div>
      )}
      {moves.chooseNoop && <button onClick={() => moves.chooseNoop!()}>End Political Action</button>}
    </div>
  );
}
