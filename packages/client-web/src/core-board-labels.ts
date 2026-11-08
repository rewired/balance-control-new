import { computeMajority, type AxialCoord, type BoardPlacement, type CoreExpansionState, type CoreState, type Tile } from '@bc/rules';
import type { EngineMoveOption } from '@bc/game';

export const playerLabel = (id: string) => `Player ${Number(id) + 1}`;
export const playerShortLabel = (id: string) => `P${Number(id) + 1}`;
export const coordLabel = ({ q, r }: AxialCoord) => `${q}, ${r}`;

export function words(value: string): string {
  const spaced = value.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function tileLabel(tile: Tile): string {
  return tile.kind === 'ResortTile' ? `${tile.resort} · ${tile.w}` : words(tile.kind);
}

export function boardTileLabel(core: CoreExpansionState, tileId: string): string {
  const placement = core.tiles.board.find(tile => tile.tileId === tileId);
  return placement ? `${tileLabel(core.allTiles[tileId])} (${coordLabel(placement.coord)})` : tileId;
}

export function optionCost(option: EngineMoveOption): string {
  return option.costBreakdown.map(({ playerID, resource, amount }) =>
    `${playerID === option.playerID ? '' : `${playerLabel(playerID)} pays `}${amount} ${resource}`).join(' + ') || 'Free';
}

export function tileOccupation(G: CoreState, { tileId, coord }: BoardPlacement) {
  const core = G.exp.core;
  const { controller, leaders, scores } = computeMajority(G, coord, 'details');
  const influence = Object.keys(core.players).map(id => {
    const count = (core.influencesOnBoard ?? []).filter(marker => marker.tileId === tileId && marker.owner === id).length;
    return { id, count, virtual: Math.max(0, scores[id] - count) };
  }).filter(({ count, virtual }) => count > 0 || virtual > 0);
  const control = controller !== null ? `Controlled by ${playerLabel(controller)}`
    : leaders.length > 1 ? `Tied majority (${leaders.map(playerShortLabel).join(', ')})`
      : core.allTiles[tileId].kind === 'StartCommittee' ? 'Cannot be controlled' : 'Uncontrolled';
  return { controller, leaders, influence, control };
}

export function influenceLabel({ id, count, virtual }: ReturnType<typeof tileOccupation>['influence'][number]): string {
  return `${playerLabel(id)} has ${count} ${count === 1 ? 'marker' : 'markers'}${virtual ? ` and ${virtual} virtual influence` : ''}`;
}

type PoliticalOption = {
  type: string;
  payload: {
    markerId?: string;
    sourceTileId?: string;
    targetTileId?: string;
    tileId?: string;
    input?: string;
    output?: string;
  };
};

export function isFormalization(option: EngineMoveOption): boolean {
  return option.moveType === 'doPoliticalAction' && (option.parameters[0] as PoliticalOption).type === 'formalizeInfluence';
}

export interface MovePreview {
  sourceTileId: string;
  targetTileId: string;
}

export function movePreview(option?: EngineMoveOption): MovePreview | undefined {
  if (option?.moveType !== 'doPoliticalAction') return;
  const { type, payload: { sourceTileId, targetTileId } } = option.parameters[0] as PoliticalOption;
  if (type === 'placeOrMoveInfluence' && sourceTileId && targetTileId) return { sourceTileId, targetTileId };
}

export function tileActionLabel(options: EngineMoveOption[]): string {
  const influenceActions = options.flatMap(option => {
    if (option.moveType !== 'doPoliticalAction') return [];
    const { type, payload } = option.parameters[0] as PoliticalOption;
    if (type !== 'placeOrMoveInfluence') return [];
    return [payload.sourceTileId ? 'Move' : 'Place'];
  });
  return [...new Set(influenceActions)].join(' / ') || (options.length ? 'Action' : '');
}

export function describeOption(core: CoreExpansionState, option: EngineMoveOption): string {
  if (option.moveType === 'placeTile') return `Place tile at ${coordLabel(option.parameters[0] as AxialCoord)}`;

  if (option.moveType === 'doPoliticalAction') {
    const { type, payload } = option.parameters[0] as PoliticalOption;
    if (type === 'placeOrMoveInfluence' && payload.targetTileId) {
      const target = boardTileLabel(core, payload.targetTileId);
      const markers = payload.sourceTileId
        ? (core.influencesOnBoard ?? []).filter(marker => marker.owner === option.playerID && marker.tileId === payload.sourceTileId)
        : core.players[option.playerID].personal.influence;
      const index = markers.findIndex(marker => marker.id === payload.markerId) + 1;
      const marker = markers.length > 1 ? `marker ${index}` : 'a marker';
      return payload.sourceTileId
        ? `Move ${marker} from ${boardTileLabel(core, payload.sourceTileId)} to ${target}`
        : `Place ${marker} from your supply on ${target}`;
    }
    if (type === 'formalizeInfluence' && payload.tileId) {
      return `Formalize influence via ${boardTileLabel(core, payload.tileId)}`;
    }
    if (type === 'convertResources' && payload.tileId) {
      return `Convert ${payload.input} to ${payload.output} at ${boardTileLabel(core, payload.tileId)}`;
    }
  }
  // The shared network board can receive expansion options outside the CORE playtest.
  return `${words(option.moveType)} ${JSON.stringify(option.parameters)}`;
}
