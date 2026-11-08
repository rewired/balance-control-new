import type { CSSProperties } from 'react';
import { matchResourceIds, type CoreState, type Influence } from '@bc/rules';
import { playerLabel } from './core-board-labels.js';
import { playerColor, resortVisuals } from './core-board-visuals.js';

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
          <th scope="col">In supply</th>
          <th scope="col">On board</th>
          {resources.map(resource => {
            const visual = resortVisuals[resource];
            return (
              <th key={resource} scope="col">
                <span className="supply-resource" style={{ '--resort-color': visual?.color } as CSSProperties}>
                  {visual && <img src={visual.icon} alt="" />}
                  {resource}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {Object.values(core.players).map(({ id, personal }) => (
          <tr key={id} data-acting={id === activePlayer} style={{ '--player-color': playerColor(id) } as CSSProperties}>
            <th scope="row">{playerLabel(id)}{id === activePlayer && <> <span className="acting-label">To act</span></>}</th>
            <InfluenceCount markers={personal.influence} />
            <InfluenceCount markers={board.filter(marker => marker.owner === id)} />
            {resources.map(resource => {
              const count = personal.resources[resource] ?? 0;
              return <td key={resource} data-empty={count === 0}><strong className="supply-count">{count}</strong></td>;
            })}
          </tr>
        ))}
        <tr className="supply-noise">
          <th scope="row">Noise</th>
          <td colSpan={2}>—</td>
          {resources.map(resource => <td key={resource}>{core.resources.noise[resource] ?? 0}</td>)}
        </tr>
      </tbody>
    </table>
  );
}
