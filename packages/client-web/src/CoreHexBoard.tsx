import type { CSSProperties, ReactNode } from 'react';
import type { EngineMoveOption } from '@bc/game';
import type { AxialCoord, CoreState, RegulationKind, Tile } from '@bc/rules';
import committeeIcon from '@bc/exp-00-core/assets/tile-icons/committee.svg';
import lobbyistIcon from '@bc/exp-00-core/assets/tile-icons/lobbyist.svg';
import grassrootsIcon from '@bc/exp-00-core/assets/tile-icons/grassroots.svg';
import hotspotIcon from '@bc/exp-00-core/assets/tile-icons/hotspot.svg';
import startCommitteeIcon from '@bc/exp-00-core/assets/tile-icons/start-committee.svg';
import { playerColor, resortVisuals } from './core-board-visuals.js';
import { InfluenceChip, RegulationBadge } from './CoreSymbols.js';
import HexBoardViewport from './HexBoardViewport.js';
import {
  coordLabel, influenceLabel, regulationLabel, tileActionLabel, tileLabel, tileOccupation, type MovePreview,
} from './core-board-labels.js';

const tileVisuals: Record<string, { color: string; icon: string } | undefined> = {
  StartCommittee: { color: '#5C4B3B', icon: startCommitteeIcon },
  Committee: { color: '#5C4B3B', icon: committeeIcon },
  Lobbyist: { color: '#7A5C3A', icon: lobbyistIcon },
  Grassroots: { color: '#4A6A5E', icon: grassrootsIcon },
  Hotspot: { color: '#8B2E2E', icon: hotspotIcon },
  InvestmentProgram: resortVisuals.ECO,
  AuthorityApparatus: resortVisuals.SEC,
};
const tileWidth = 144;
const tileHeight = 166;
const fieldPadding = 16;

export function TileFace({ tile, controller, showOutput = false }: {
  tile: Tile;
  controller?: string | null;
  showOutput?: boolean;
}) {
  const visual = tile.kind === 'ResortTile' ? resortVisuals[tile.resort] : tileVisuals[tile.kind];
  const emblem = <span className="tile-emblem">
    {visual && <img className="tile-glyph" src={visual.icon} alt="" draggable={false} />}
    <span className="tile-name">{tile.kind === 'ResortTile' ? tile.resort : tileLabel(tile)}</span>
  </span>;
  return (
    <span className="tile-face" aria-hidden="true" style={{
      '--tile-color': visual?.color ?? '#435063',
      '--tile-rim': controller == null ? '#677789' : playerColor(controller),
    } as CSSProperties}>
      <span className="tile-art" />
      {showOutput && tile.kind === 'ResortTile' ? <span className="tile-production">
        <strong className="tile-yield">{tile.w}</strong>
        {emblem}
      </span> : emblem}
    </span>
  );
}

function pixel({ q, r }: AxialCoord) {
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
  status: ReactNode;
  matchDetails: ReactNode;
  matchAction?: ReactNode;
  legalCoords: AxialCoord[];
  tileActions: ReadonlyMap<string, EngineMoveOption[]>;
  selectedTile?: string;
  selectedCoord?: string;
  preview?: MovePreview;
  onPlace: (coord: AxialCoord) => void;
  onInspect: (tileId: string) => void;
}

export default function CoreHexBoard({
  G, status, matchDetails, matchAction, legalCoords, tileActions, selectedTile, selectedCoord, preview, onPlace, onInspect,
}: Props) {
  const core = G.exp.core;
  const tiles = core.tiles.board.map(placement => ({
    ...placement, ...pixel(placement.coord),
  }));
  const targets = legalCoords.map(coord => ({ coord, ...pixel(coord) }));
  const locations = [...tiles, ...targets];
  const left = Math.min(...locations.map(({ x }) => x));
  const top = Math.min(...locations.map(({ y }) => y));
  const width = Math.max(...locations.map(({ x }) => x)) - left + tileWidth + 2 * fieldPadding;
  const height = Math.max(...locations.map(({ y }) => y)) - top + tileHeight + 2 * fieldPadding;
  const center = {
    x: (Math.min(...tiles.map(({ x }) => x)) + Math.max(...tiles.map(({ x }) => x))) / 2,
    y: (Math.min(...tiles.map(({ y }) => y)) + Math.max(...tiles.map(({ y }) => y))) / 2,
  };
  const source = preview && tiles.find(({ tileId }) => tileId === preview.sourceTileId);
  const destination = preview && tiles.find(({ tileId }) => tileId === preview.targetTileId);

  return (
    <section className="core-board core-panel" aria-label="Game board">
      <HexBoardViewport status={status} tileCount={tiles.length} width={width} height={height} center={center}
        origin={{ x: left - fieldPadding - tileWidth / 2, y: top - fieldPadding - tileHeight / 2 }}>
          {tiles.map(placement => {
            const { tileId, coord, x, y } = placement;
            const tile = core.allTiles[tileId];
            const regulations = G.exp.exp02?.regulations?.attached.filter(item => item.tileId === tileId) ?? [];
            const regulationCounts = new Map<RegulationKind, number>();
            for (const { kind } of regulations) regulationCounts.set(kind, (regulationCounts.get(kind) ?? 0) + 1);
            const { controller, leaders, influence, control } = tileOccupation(G, placement);
            const action = tileActionLabel(tileActions.get(tileId) ?? []);
            const endpoint = preview?.sourceTileId === tileId ? 'source'
              : preview?.targetTileId === tileId ? 'destination' : undefined;
            const name = tile.kind === 'ResortTile' ? resortVisuals[tile.resort]?.name ?? tile.resort : tileLabel(tile);
            const label = [
              `${name} (${coordLabel(coord)})`,
              tile.kind === 'ResortTile' && `Printed output ${tile.w} ${tile.resort}`,
              control,
              influence.length ? influence.map(influenceLabel).join(', ') : 'No influence',
              action && `Legal action: ${action}`,
              endpoint && `Move preview: ${endpoint}`,
              regulations.length > 0 && `Regulations: ${regulations.map(regulationLabel).join(', ')}`,
            ].filter(Boolean).join('. ');
            return (
              <button key={tileId} className="hex-cell" type="button" data-move-endpoint={endpoint}
                style={{ left: x - left + fieldPadding, top: y - top + fieldPadding }} aria-pressed={selectedTile === tileId}
                title={label} aria-label={label} onClick={() => onInspect(tileId)}>
                <TileFace tile={tile} controller={controller} showOutput />
                {regulations.length > 0 && <span className="tile-regulations" aria-hidden="true">
                  {[...regulationCounts].map(([kind, count]) => <RegulationBadge key={kind} kind={kind} count={count} />)}
                </span>}
                <span className="tile-influence">
                  {influence.map(({ id, count, virtual }) => (
                    <InfluenceChip key={id} id={id} count={count} virtual={virtual}
                      majority={controller === id ? 'control' : leaders.includes(id) ? 'tie' : undefined} />
                  ))}
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
      </HexBoardViewport>
      <footer className="core-board-footer">
        <details className="core-map-legend">
          <summary>Legend</summary>
          <div className="core-map-key">
            <span><InfluenceChip id="0" count={1} /> Influence <span className="virtual-influence">+ virtual</span></span>
            <span><i className="majority-key" data-majority="control" aria-hidden="true" /> Controls tile</span>
            <span><i className="majority-key" data-majority="tie" aria-hidden="true" /> Tied lead</span>
            {G.exp.exp02?.regulations && <span><RegulationBadge kind="Administration" /> Regulation</span>}
            {legalCoords.length > 0 && <span><b>+</b> Legal tile placement</span>}
            {tileActions.size > 0 && <span><b>Place / Move</b> Marker action</span>}
          </div>
        </details>
        {matchAction}
        {matchDetails}
      </footer>
    </section>
  );
}
