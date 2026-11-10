import type { CSSProperties } from 'react';
import type { RegulationKind } from '@bc/rules';
import { playerLabel, playerShortLabel } from './core-board-labels.js';
import { playerPalette, resortVisuals } from './core-board-visuals.js';

export function PlayerMarker({ id, numbered = false }: { id: string; numbered?: boolean }) {
  const palette = playerPalette(id);
  const label = numbered ? playerLabel(id) : undefined;
  return <span className={numbered ? 'player-marker player-marker-numbered' : 'player-marker'} style={{
    '--player-color': palette?.fill,
    '--player-text': numbered ? palette?.text : undefined,
  } as CSSProperties} role={numbered ? 'img' : undefined} aria-label={label} title={label} aria-hidden={!numbered || undefined}>
    {numbered && playerShortLabel(id)}
  </span>;
}

export function InfluenceChip({ id, count, virtual = 0, majority }: {
  id: string;
  count: number;
  virtual?: number;
  majority?: 'control' | 'tie';
}) {
  const palette = playerPalette(id);
  return <span className="influence-chip" data-majority={majority} aria-hidden="true" style={{
    '--player-color': palette?.fill,
    '--player-text': palette?.text,
  } as CSSProperties}>
    <b>{count}</b>
    {virtual > 0 && <span className="virtual-influence">+{virtual}</span>}
  </span>;
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
