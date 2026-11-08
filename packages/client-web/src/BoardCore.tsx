import React, { useState } from 'react';
import type { Ctx } from 'boardgame.io';
import { politicalMoveOptions, type AxialCoord, type CoreState } from '@bc/rules';

type PoliticalAction = { type: string; payload: unknown };

export interface CoreMoves {
  placeTile: (coord: AxialCoord) => void;
  doPoliticalAction: (action: PoliticalAction) => void;
}
export interface CoreProps { G: CoreState; ctx: Ctx; isActive: boolean; moves: CoreMoves }

function PoliticalActions({ options, submit }: { options: PoliticalAction[]; submit: CoreMoves['doPoliticalAction'] }) {
  const [selected, setSelected] = useState(0);
  return (
    <form onSubmit={event => {
      event.preventDefault();
      const action = options[selected];
      if (action) submit(action);
    }}>
      <label>
        Political action{' '}
        <select value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {options.map((action, i) => (
            <option key={i} value={i}>{action.type} {JSON.stringify(action.payload)}</option>
          ))}
        </select>
      </label>{' '}
      <button type="submit" disabled={!options[selected]}>Play</button>
    </form>
  );
}

export default function CoreBoard({ G, ctx, isActive, moves }: CoreProps) {
  const drawn = G.tiles.drawResolution;
  const stage = ctx.activePlayers?.[ctx.currentPlayer];
  const additional = stage === 'AdditionalPoliticalAction';
  const political = isActive && (additional || stage === 'ExactlyOnePoliticalAction');
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div><strong>Core {stage}</strong></div>
      {drawn ? (
        <div>
          <div>Drawn <code>{drawn.tileId}</code></div>
          <div>Legal placements</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {drawn.legalCoords.map(c => (
              <button key={`${c.q},${c.r}`} disabled={!isActive} onClick={() => moves.placeTile(c)}>
                ({c.q},{c.r})
              </button>
            ))}
          </div>
        </div>
      ) : political && (
        <PoliticalActions
          key={`${ctx.turn}-${stage}`}
          options={[...politicalMoveOptions(G, ctx.currentPlayer, additional)]}
          submit={moves.doPoliticalAction}
        />
      )}
    </div>
  );
}
