import type { AxialCoord, CoreExpansionState, Tile } from '@bc/rules';
import type { EngineMoveOption } from '@bc/game';

export const playerLabel = (id: string) => `Player ${Number(id) + 1}`;
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
      return `Formalize influence on ${boardTileLabel(core, payload.tileId)}`;
    }
    if (type === 'convertResources' && payload.tileId) {
      return `Convert ${payload.input} to ${payload.output} at ${boardTileLabel(core, payload.tileId)}`;
    }
  }
  // The shared network board can receive expansion options outside the CORE playtest.
  return `${words(option.moveType)} ${JSON.stringify(option.parameters)}`;
}
