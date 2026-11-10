import type { CSSProperties } from 'react';
import { influenceLimit } from '@bc/exp-00-core';
import { matchResourceIds, type CoreState } from '@bc/rules';
import { playerLabel } from './core-board-labels.js';
import { playerColor } from './core-board-visuals.js';
import { PlayerMarker, ResourceBadge } from './CoreSymbols.js';

function SupplyCount({ count }: { count: number }) {
  return <td data-empty={count === 0}><strong className="supply-count">{count}</strong></td>;
}

export default function CoreSupplies({ G, activePlayer, computerPlayers }: {
  G: CoreState;
  activePlayer?: string;
  computerPlayers?: ReadonlySet<string>;
}) {
  const core = G.exp.core;
  const resources = matchResourceIds(G);
  const board = core.influencesOnBoard ?? [];
  const winTarget = influenceLimit(G);
  const boardLabel = `On board · ${winTarget} markers to win`;

  return (
    <div className="core-stock core-panel" tabIndex={0} role="region" aria-label="Player supplies"
      style={{ '--supply-resource-count': resources.length } as CSSProperties}>
      <table className="core-supplies">
        <caption>Player supplies</caption>
        <colgroup className="supply-player-column" span={1} />
        <colgroup className="supply-influence-columns" span={2} />
        <colgroup span={resources.length} />
        <thead>
          <tr>
            <th scope="col" rowSpan={2}>Player</th>
            <th scope="colgroup" colSpan={2}>Influence markers</th>
            <th scope="colgroup" colSpan={resources.length}>Resources</th>
          </tr>
          <tr>
            <th scope="col" aria-label={boardLabel} title={boardLabel}>
              <svg className="supply-zone-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.5 20 7v10l-8 4.5L4 17V7Z" />
                <text className="supply-win-target" x="12" y="12" textAnchor="middle" dominantBaseline="central">{winTarget}</text>
              </svg>
            </th>
            <th scope="col" aria-label="In supply" title="In supply">
              <svg className="supply-zone-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="6" width="6" height="6" rx="1" />
                <rect x="13" y="6" width="6" height="6" rx="1" />
                <path d="M3 12h18l-2 7H5Z" />
              </svg>
            </th>
            {resources.map(resource => <th key={resource} scope="col"><ResourceBadge resource={resource} /></th>)}
          </tr>
        </thead>
        <tbody>
          {Object.values(core.players).map(({ id, personal }) => {
            const acting = id === activePlayer;
            const computer = computerPlayers?.has(id);
            const label = `${playerLabel(id)}${computer ? ' (computer)' : ''}`;
            return (
              <tr key={id} data-acting={acting} style={{ '--player-color': playerColor(id) } as CSSProperties}>
                <th scope="row" aria-label={label} title={label} aria-current={acting || undefined}>
                  <PlayerMarker id={id} numbered />
                  {computer && <span className="supply-computer" aria-hidden="true">AI</span>}
                </th>
                <SupplyCount count={board.filter(marker => marker.owner === id).length} />
                <SupplyCount count={personal.influence.length} />
                {resources.map(resource => <SupplyCount key={resource} count={personal.resources[resource] ?? 0} />)}
              </tr>
            );
          })}
          <tr className="supply-noise">
            <th scope="row">Noise</th>
            <td colSpan={2}>—</td>
            {resources.map(resource => <td key={resource}>{core.resources.noise[resource] ?? 0}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
