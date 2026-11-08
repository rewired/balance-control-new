import type { CSSProperties } from 'react';
import type { AxialCoord, CoreState, Tile } from '@bc/rules';
import { computeMajority } from '@bc/rules';
import domIcon from './assets/tile-icons/dom.svg';
import foreignIcon from './assets/tile-icons/for.svg';
import infIcon from './assets/tile-icons/inf.svg';
import ecoIcon from './assets/tile-icons/eco.svg';
import secIcon from './assets/tile-icons/sec.svg';
import clmIcon from './assets/tile-icons/clm.svg';
import committeeIcon from './assets/tile-icons/committee.svg';
import lobbyistIcon from './assets/tile-icons/lobbyist.svg';
import grassrootsIcon from './assets/tile-icons/grassroots.svg';
import hotspotIcon from './assets/tile-icons/hotspot.svg';
import startCommitteeIcon from './assets/tile-icons/start-committee.svg';
import { coordLabel, playerLabel, tileLabel } from './core-board-labels.js';

const playerColors = ['#E11D48', '#22C55E', '#2B42D6', '#FACC15', '#D946EF', '#22D3EE'];
export const playerColor = (id: string) => playerColors[Number(id)];

const colors: Record<string, string> = {
  DOM: '#3A5A78', FOR: '#2E7D6E', INF: '#6A4C93', ECO: '#8A6E2F', SEC: '#4E5B63', CLM: '#3F7F4C',
  StartCommittee: '#5C4B3B', Committee: '#5C4B3B', Lobbyist: '#7A5C3A', Grassroots: '#4A6A5E', Hotspot: '#8B2E2E',
};
const icons: Record<string, string> = {
  DOM: domIcon, FOR: foreignIcon, INF: infIcon, ECO: ecoIcon, SEC: secIcon, CLM: clmIcon,
  Committee: committeeIcon, StartCommittee: startCommitteeIcon, Lobbyist: lobbyistIcon,
  Grassroots: grassrootsIcon, Hotspot: hotspotIcon,
};
const tileWidth = 100;
const tileHeight = 116;

export function TileFace({ tile, controller }: { tile: Tile; controller?: string | null }) {
  const key = tile.kind === 'ResortTile' ? tile.resort : tile.kind;
  const iconURL = icons[key];
  return (
    <span className="tile-face" style={{
      '--tile-color': colors[key] ?? '#435063',
      '--tile-rim': controller == null ? '#94a3b8' : playerColor(controller),
    } as CSSProperties}>
      {iconURL && <img src={iconURL} alt="" />}
      <span>{tileLabel(tile)}</span>
    </span>
  );
}

function pixel({ q, r }: AxialCoord, topology: CoreState['cfg']['topology']) {
  if (topology === 'orthogonal') return { x: (tileWidth + 6) * q, y: (tileHeight + 6) * r };
  return { x: (tileWidth + 4) * (q + r / 2), y: (tileHeight * 0.75 + 4) * r };
}

interface Props {
  G: CoreState;
  legalCoords: AxialCoord[];
  selectedTile?: string;
  onPlace: (coord: AxialCoord) => void;
  onInspect: (tileId: string) => void;
}

export default function CoreHexBoard({ G, legalCoords, selectedTile, onPlace, onInspect }: Props) {
  const core = G.exp.core;
  const tiles = core.tiles.board.map(placement => ({
    ...placement, ...pixel(placement.coord, G.cfg.topology),
  }));
  const targets = legalCoords.map(coord => ({ coord, ...pixel(coord, G.cfg.topology) }));
  const locations = [...tiles, ...targets];
  const left = Math.min(...locations.map(({ x }) => x));
  const top = Math.min(...locations.map(({ y }) => y));
  const width = Math.max(...locations.map(({ x }) => x)) - left + tileWidth + 16;
  const height = Math.max(...locations.map(({ y }) => y)) - top + tileHeight + 16;

  return (
    <section className="hex-board" aria-label="Game board">
      <div className="hex-field" style={{ width, height }}>
        {tiles.map(({ tileId, coord, x, y }) => {
          const tile = core.allTiles[tileId];
          const { controller, leaders, scores } = computeMajority(G, coord, 'details');
          const influence = Object.keys(core.players).map(id => ({
            id, count: (core.influencesOnBoard ?? []).filter(marker => marker.tileId === tileId && marker.owner === id).length,
          }));
          const control = controller !== null ? `Controlled by ${playerLabel(controller)}`
            : leaders.length > 1 ? 'Tied majority' : 'Uncontrolled';
          const summary = `${control}. ${influence.filter(({ count }) => count > 0)
            .map(({ id, count }) => `${playerLabel(id)}: ${count} influence`).join(', ')}`;
          const label = `${tileLabel(tile)} (${coordLabel(coord)}). ${summary}`;
          return (
            <button key={tileId} className="hex-cell" type="button"
              style={{ left: x - left + 8, top: y - top + 8 }} aria-pressed={selectedTile === tileId}
              title={label} aria-label={label} onClick={() => onInspect(tileId)}>
              <TileFace tile={tile} controller={controller} />
              <span className="tile-control">{controller !== null ? `P${Number(controller) + 1}` : leaders.length ? 'Tie' : ''}</span>
              <span className="tile-influence">
                {influence.filter(({ id, count }) => count > 0 || scores[id] > 0).map(({ id, count }) => (
                  <span key={id} style={{ '--player-color': playerColor(id) } as CSSProperties}>
                    P{Number(id) + 1} {count}{scores[id] > count ? `+${scores[id] - count}` : ''}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
        {targets.map(({ coord, x, y }) => (
          <button key={coordLabel(coord)} className="hex-cell hex-target" type="button"
            style={{ left: x - left + 8, top: y - top + 8 }}
            aria-label={`Place tile at ${coordLabel(coord)}`} onClick={() => onPlace(coord)}>+</button>
        ))}
      </div>
    </section>
  );
}
