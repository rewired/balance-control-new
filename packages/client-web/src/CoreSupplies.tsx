import type { CSSProperties } from 'react';
import { matchResourceIds, type CoreState, type Influence } from '@bc/rules';
import { playerLabel } from './core-board-labels.js';
import { playerColor } from './core-board-visuals.js';
import { PlayerMarker, ResourceBadge } from './CoreSymbols.js';

function InfluenceCount({ markers }: { markers: Influence[] }) {
  const starting = markers.filter(marker => marker.starting).length;
  return (
    <td data-empty={markers.length === 0}>
      <strong className="supply-count">{markers.length}</strong>
      <span className="supply-breakdown">{starting} starting · {markers.length - starting} additional</span>
    </td>
  );
}

export default function CoreSupplies({ G, activePlayer }: { G: CoreState; activePlayer?: string }) {
  const core = G.exp.core;
  const resources = matchResourceIds(G);
  const board = core.influencesOnBoard ?? [];

  return (
    <div className="core-stock core-panel" tabIndex={0} role="region" aria-label="Player supplies">
      <table className="core-supplies">
        <caption>Player supplies</caption>
        <colgroup span={1} />
        <colgroup span={2} />
        <colgroup span={resources.length} />
        <thead>
          <tr>
            <th scope="col" rowSpan={2}>Player</th>
            <th scope="colgroup" colSpan={2}>Influence markers</th>
            <th scope="colgroup" colSpan={resources.length}>Resources</th>
          </tr>
          <tr>
            <th scope="col">On board</th>
            <th scope="col">In supply</th>
            {resources.map(resource => <th key={resource} scope="col"><ResourceBadge resource={resource} /></th>)}
          </tr>
        </thead>
        <tbody>
          {Object.values(core.players).map(({ id, personal }) => (
            <tr key={id} data-acting={id === activePlayer} style={{ '--player-color': playerColor(id) } as CSSProperties}>
              <th scope="row"><PlayerMarker id={id} />{playerLabel(id)}{id === activePlayer && <span className="acting-label">To act</span>}</th>
              <InfluenceCount markers={board.filter(marker => marker.owner === id)} />
              <InfluenceCount markers={personal.influence} />
              {resources.map(resource => {
                const count = personal.resources[resource] ?? 0;
                return <td key={resource} data-empty={count === 0}><strong className="supply-count">{count}</strong></td>;
              })}
            </tr>
          ))}
          <tr className="supply-noise">
            <th scope="row"><span className="noise-symbol" aria-hidden="true">≋</span>Noise</th>
            <td colSpan={2}>—</td>
            {resources.map(resource => <td key={resource}>{core.resources.noise[resource] ?? 0}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
