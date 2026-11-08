import type { CSSProperties } from 'react';
import type { EngineMoveOption } from '@bc/game';
import type { AxialCoord, CoreState, Tile } from '@bc/rules';
import committeeIcon from '@bc/exp-00-core/assets/tile-icons/committee.svg';
import lobbyistIcon from '@bc/exp-00-core/assets/tile-icons/lobbyist.svg';
import grassrootsIcon from '@bc/exp-00-core/assets/tile-icons/grassroots.svg';
import hotspotIcon from '@bc/exp-00-core/assets/tile-icons/hotspot.svg';
import startCommitteeIcon from '@bc/exp-00-core/assets/tile-icons/start-committee.svg';
import { playerColor, resortVisuals } from './core-board-visuals.js';
import {
  coordLabel, influenceLabel, playerShortLabel, tileActionLabel, tileLabel, tileOccupation, type MovePreview,
} from './core-board-labels.js';

const tileVisuals: Record<string, { color: string; icon: string } | undefined> = {
  StartCommittee: { color: '#5C4B3B', icon: startCommitteeIcon },
  Committee: { color: '#5C4B3B', icon: committeeIcon },
  Lobbyist: { color: '#7A5C3A', icon: lobbyistIcon },
  Grassroots: { color: '#4A6A5E', icon: grassrootsIcon },
  Hotspot: { color: '#8B2E2E', icon: hotspotIcon },
};
const tileWidth = 144;
const tileHeight = 166;
const fieldPadding = 8;

export function TileFace({ tile, controller }: { tile: Tile; controller?: string | null }) {
  const visual = tile.kind === 'ResortTile' ? resortVisuals[tile.resort] : tileVisuals[tile.kind];
  return (
    <span className="tile-face" style={{
      '--tile-color': visual?.color ?? '#435063',
      '--tile-rim': controller == null ? '#94a3b8' : playerColor(controller),
    } as CSSProperties}>
      {visual && <img src={visual.icon} alt="" />}
      <span>{tileLabel(tile)}</span>
    </span>
  );
}

function pixel({ q, r }: AxialCoord, topology: CoreState['cfg']['topology']) {
  if (topology === 'orthogonal') return { x: (tileWidth + 6) * q, y: (tileHeight + 6) * r };
  return { x: (tileWidth + 4) * (q + r / 2), y: (tileHeight * 0.75 + 4) * r };
}

function MoveArrow({ source, destination, viewBox }: {
  source: { x: number; y: number };
  destination: { x: number; y: number };
  viewBox: string;
}) {
  const dx = destination.x - source.x;
  const dy = destination.y - source.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const inset = tileWidth / 3;
  const tip = Math.hypot(dx, dy) - inset;
  const head = tip - 14;
  return (
    <svg className="hex-move-arrow" viewBox={viewBox} aria-hidden="true">
      <path transform={`translate(${source.x + tileWidth / 2} ${source.y + tileHeight / 2}) rotate(${angle})`}
        d={`M ${inset} -2 H ${head} V -7 L ${tip} 0 L ${head} 7 V 2 H ${inset} Z`} />
    </svg>
  );
}

interface Props {
  G: CoreState;
  legalCoords: AxialCoord[];
  tileActions: ReadonlyMap<string, EngineMoveOption[]>;
  selectedTile?: string;
  selectedCoord?: string;
  preview?: MovePreview;
  onPlace: (coord: AxialCoord) => void;
  onInspect: (tileId: string) => void;
}

export default function CoreHexBoard({ G, legalCoords, tileActions, selectedTile, selectedCoord, preview, onPlace, onInspect }: Props) {
  const core = G.exp.core;
  const tiles = core.tiles.board.map(placement => ({
    ...placement, ...pixel(placement.coord, G.cfg.topology),
  }));
  const targets = legalCoords.map(coord => ({ coord, ...pixel(coord, G.cfg.topology) }));
  const locations = [...tiles, ...targets];
  const left = Math.min(...locations.map(({ x }) => x));
  const top = Math.min(...locations.map(({ y }) => y));
  const width = Math.max(...locations.map(({ x }) => x)) - left + tileWidth + 2 * fieldPadding;
  const height = Math.max(...locations.map(({ y }) => y)) - top + tileHeight + 2 * fieldPadding;
  const source = preview && tiles.find(({ tileId }) => tileId === preview.sourceTileId);
  const destination = preview && tiles.find(({ tileId }) => tileId === preview.targetTileId);

  return (
    <section className="hex-board" aria-label="Game board">
      <div className="hex-field" style={{ width, height }}>
        {tiles.map(placement => {
          const { tileId, coord, x, y } = placement;
          const tile = core.allTiles[tileId];
          const { controller, leaders, influence, control } = tileOccupation(G, placement);
          const action = tileActionLabel(tileActions.get(tileId) ?? []);
          const endpoint = preview?.sourceTileId === tileId ? 'source'
            : preview?.targetTileId === tileId ? 'destination' : undefined;
          const label = [
            `${tileLabel(tile)} (${coordLabel(coord)})`, control,
            influence.length ? influence.map(influenceLabel).join(', ') : 'No influence',
            action && `Legal action: ${action}`,
            endpoint && `Move preview: ${endpoint}`,
          ].filter(Boolean).join('. ');
          return (
            <button key={tileId} className="hex-cell" type="button" data-move-endpoint={endpoint}
              style={{ left: x - left + fieldPadding, top: y - top + fieldPadding }} aria-pressed={selectedTile === tileId}
              title={label} aria-label={label} onClick={() => onInspect(tileId)}>
              <TileFace tile={tile} controller={controller} />
              <span className="tile-control" style={{
                '--controller-color': controller === null ? '#94a3b8' : playerColor(controller),
              } as CSSProperties}>{controller !== null ? `${playerShortLabel(controller)} controls` : leaders.length ? 'Tied' : 'No control'}</span>
              <span className="tile-influence" data-dense={influence.length > 4}>
                {influence.map(({ id, count, virtual }) => (
                  <span key={id} style={{ '--player-color': playerColor(id) } as CSSProperties}>
                    {playerShortLabel(id)} <b>{count}</b>{virtual > 0 && <span className="virtual-influence"> +{virtual}</span>}
                  </span>
                ))}
                {!influence.length && <span className="empty-influence">No influence</span>}
              </span>
              {endpoint ? <span className="tile-action tile-move-endpoint">{endpoint === 'source' ? 'From →' : '→ To'}</span>
                : action && <span className="tile-action">{action}</span>}
            </button>
          );
        })}
        {targets.map(({ coord, x, y }) => (
          <button key={coordLabel(coord)} className="hex-cell hex-target" type="button"
            style={{ left: x - left + fieldPadding, top: y - top + fieldPadding }}
            aria-pressed={selectedCoord === coordLabel(coord)}
            aria-label={`Place tile at ${coordLabel(coord)}`} onClick={() => onPlace(coord)}>
            <span aria-hidden="true">+</span>Place tile
          </button>
        ))}
        {source && destination && <MoveArrow source={source} destination={destination}
          viewBox={`${left - fieldPadding} ${top - fieldPadding} ${width} ${height}`} />}
      </div>
    </section>
  );
}
