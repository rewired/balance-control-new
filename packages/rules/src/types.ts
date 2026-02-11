// Zones are first-class (CORE-01-00-01..06)
export type Zone =
  | 'Board'
  | 'DrawPile'
  | 'DiscardFaceUp'
  | 'Bank'
  | 'Noise'
  | 'PersonalSupply';

// Resources (CORE-01-02-04A..G) Ã¢â‚¬â€ registry-based; do not hardcode unions in logic (AGENTS Ã‚Â§1.6)
export type ResourceId = string; // e.g., 'DOM' | 'FOR' | 'INF' in CORE registry
export const CoreResorts: readonly ResourceId[] = ['DOM', 'FOR', 'INF'];

// Influence objects (CORE-01-01-01, CORE-01-03-04..06)
export interface Influence {
  id: string;
  owner: string; // playerID
}

export type TileKind =
  | 'ResortTile'
  | 'Committee'
  | 'Grassroots'
  | 'Lobbyist'
  | 'Hotspot'
  | 'StartCommittee';

export interface BaseTile {
  id: string;
  kind: TileKind;
}

export interface ResortTile extends BaseTile {
  kind: 'ResortTile';
  resort: ResourceId;
  w: 1 | 2 | 3 | 4 | 5; // CORE-01-02-17
}

export interface StartCommitteeTile extends BaseTile {
  kind: 'StartCommittee'; // CORE-01-02-01..03
}

export type NonResortTileKind = Exclude<TileKind, 'ResortTile' | 'StartCommittee'>;
export interface NonResortTile extends BaseTile {
  kind: NonResortTileKind;
}

export type Tile = ResortTile | NonResortTile | StartCommitteeTile;

export interface AxialCoord { q: number; r: number }
export interface BoardPlacement { tileId: string; coord: AxialCoord }

export interface PlayerPersonalSupply {
  resources: Record<ResourceId, number>; // registry-driven amounts
  influence: Influence[];
}

export interface PlayerState {
  id: string; // '0'..'N-1'
  personal: PlayerPersonalSupply; // CORE-01-00-03/04
}

export interface TileZonesState {
  drawPile: string[]; // tile ids
  discardFaceUp: string[]; // tile ids
  board: BoardPlacement[];
}

export interface ResourceZonesState {
  bank: Record<ResourceId, number>;
  noise: Record<ResourceId, number>;
}

export interface TurnScratch { pending?: { tileId: string; legalCoords: AxialCoord[] } }

export interface InfluenceOnBoard { tileId: string; owner: string; count: number }

export interface ExpansionsState {
  // Placeholders for modular expansions; present only when enabled (AGENTS Ãƒâ€šÃ‚Â§3.4, Ãƒâ€šÃ‚Â§3.8, Ãƒâ€šÃ‚Â§5.5)
  exp01?: Record<string, never>;
  exp02?: Record<string, never>;
  exp03?: Record<string, never>;
}

export interface CoreState {
  matchSeed: string;
  tiles: TileZonesState;
  allTiles: Record<string, Tile>;
  players: Record<string, PlayerState>;
  resources: ResourceZonesState;
  turn?: TurnScratch;
  influencesOnBoard?: InfluenceOnBoard[];
  exp?: ExpansionsState;
}