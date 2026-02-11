// Zones are first-class (CORE-01-00-01..06)
export type Zone =
  | 'Board'
  | 'DrawPile'
  | 'DiscardFaceUp'
  | 'Bank'
  | 'Noise'
  | 'PersonalSupply';

// Resources (CORE-01-02-04A..G)
export type Resort = 'DOM' | 'FOR' | 'INF';
export const CoreResorts: readonly Resort[] = ['DOM', 'FOR', 'INF'];

export interface Resource {
  id: string;
  resort: Resort;
}

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
  resort: Resort;
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
  resources: Resource[];
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
  bank: Resource[];
  noise: Resource[];
}

export interface CoreState {
  matchSeed: string; // deterministic seed anchor
  tiles: TileZonesState;
  allTiles: Record<string, Tile>; // id -> tile
  players: Record<string, PlayerState>;
  resources: ResourceZonesState;
}