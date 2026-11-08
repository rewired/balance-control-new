import type { CSSProperties } from 'react';
import type { RegulationKind } from '@bc/rules';
import { playerColor, resortVisuals } from './core-board-visuals.js';

export function PlayerMarker({ id }: { id: string }) {
  return <span className="player-marker" style={{ '--player-color': playerColor(id) } as CSSProperties} aria-hidden="true" />;
}

export function ResourceBadge({ resource }: { resource: string }) {
  const visual = resortVisuals[resource];
  return (
    <span className="resource-badge">
      {visual && <span className="resource-icon" style={{ '--resort-color': visual.color } as CSSProperties}>
        <img src={visual.icon} alt="" />
      </span>}
      {resource}
    </span>
  );
}

const regulationCodes: Record<RegulationKind, string> = {
  Administration: 'ADM',
  Blockade: 'BLK',
  Control: 'CTL',
  SecurityLevel: 'LVL',
};

export function RegulationBadge({ kind, count = 1 }: { kind: RegulationKind; count?: number }) {
  return <span className="regulation-badge" data-blockade={kind === 'Blockade'} aria-hidden="true">
    {regulationCodes[kind]}{count > 1 && ` ×${count}`}
  </span>;
}
