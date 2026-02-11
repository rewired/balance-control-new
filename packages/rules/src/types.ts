// Zones are first-class (CORE-01-00-01..06)
export type Zone =
  | 'Board'
  | 'DrawPile'
  | 'DiscardFaceUp'
  | 'Bank'
  | 'Noise'
  | 'PersonalSupply';

// Resources (CORE-01-02-04A..G) ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â registry-based; do not hardcode unions in logic (AGENTS ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚§1.6)
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

export interface TurnScratch { pending?: { tileId: string; legalCoords: AxialCoord[] }; allowExtraPoliticalAction?: boolean; bannedMoveType?: string }

export interface InfluenceOnBoard { tileId: string; owner: string; count: number }

export interface ExpansionsState {
  // Namespaced expansion state; only created when enabled (AGENTS Ã‚§3.4, Ã‚§3.8, Ã‚§5.5)
  exp01?: Exp01State;
  exp02?: Exp02State;
  exp03?: Exp03State;
}

export type ExpansionId = 'exp01' | 'exp02' | 'exp03';

export interface Exp01MeasuresState {
  drawPile: string[];
  open: string[];
  recycle: string[];
  finalDiscard: string[];
  hands: Record<string, string[]>; // by playerID
  usedThisRound: Record<string, boolean>; // per player
  playCounts: Record<string, number>; // per measure id
  cycle: number;
}

export interface Exp01State { sentinel?: boolean; measures?: Exp01MeasuresState }
export interface Exp02State {}
export interface Exp03State {}

export interface CoreState {
  cfg: import('./schemas.js').MatchConfig;
  matchSeed: string;
  tiles: TileZonesState;
  allTiles: Record<string, Tile>;
  players: Record<string, PlayerState>;
  resources: ResourceZonesState;
  turn?: TurnScratch;
  influencesOnBoard?: InfluenceOnBoard[];
  exp?: ExpansionsState;
}