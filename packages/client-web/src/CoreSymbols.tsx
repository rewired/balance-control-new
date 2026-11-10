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

export function FormalizationChip({ id, status }: { id: string; status: 'locked' | 'available' | 'used' }) {
  const palette = playerPalette(id);
  return <span className="formalization-chip" data-status={status} aria-hidden="true" style={{
    '--player-color': palette?.fill,
    '--player-text': palette?.text,
  } as CSSProperties}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {status === 'used' ? <path d="m5 12 4 4L19 6" /> : <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d={status === 'available' ? 'M8 10V6a4 4 0 0 1 8 0' : 'M8 10V6a4 4 0 0 1 8 0v4'} />
      </>}
    </svg>
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
