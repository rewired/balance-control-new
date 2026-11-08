// Zones are first-class (CORE-01-00-01..06)
export type Zone =
  | 'Board'
  | 'DrawPile'
  | 'DrawResolution'
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
  starting?: true;
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
export interface BoardPlacement {
  tileId: string;
  coord: AxialCoord;
  enclosureProcessed?: true; // CORE-01-06-02A/-04A, Hotspots only
}

export interface PlayerPersonalSupply {
  resources: Record<ResourceId, number>; // registry-driven amounts
  influence: Influence[];
}

export interface PlayerState {
  id: string; // '0'..'N-1'
  personal: PlayerPersonalSupply; // CORE-01-00-03/04
  usedStartCommittee?: true; // CORE-01-08-07
}

export interface TileZonesState {
  drawPile: string[]; // tile ids
  drawResolution: { tileId: string; legalCoords: AxialCoord[] } | null; // CORE-01-00-05A
  discardFaceUp: string[]; // tile ids
  board: BoardPlacement[];
}

export interface ResourceZonesState {
  bank: Record<ResourceId, number>;
  noise: Record<ResourceId, number>;
}

export interface InfluenceOnBoard extends Influence { tileId: string }

export interface ExpansionsState {
  // Namespaced expansion state; only created when enabled (AGENTS Ã‚§3.4, Ã‚§3.8, Ã‚§5.5)
  exp01?: Exp01State;
  exp02?: Exp02State;
  exp03?: Exp03State;
}

export type { ExpansionId } from './schemas.js';

export interface MeasureDeckState {
  drawPile: string[];
  open: (string | null)[];
  recycle: string[];
  finalDiscard: string[];
  hands: Record<string, string[]>; // by playerID
  playCounts: Record<string, number>; // per measure id
  cycle: number;
  usedThisRound?: Record<string, boolean>; // legacy EXP-01 saves
}

export interface Exp01State { measures?: MeasureDeckState }
export interface Exp02State { measures?: MeasureDeckState }
export interface Exp03State { measures?: MeasureDeckState }

export type ProductionMeasureId = 'ECO_M09' | 'CLM_M11';

// EXP-01-07-08: the production effect survives the card's transfer or recycling.
export interface ActiveProductionEffect {
  id: string;
  sourceCardId: ProductionMeasureId;
  playNumber: 1 | 2;
  owner: string;
  targetPlayerID: string;
}

export interface CoreState {
  cfg: import('./schemas.js').MatchConfig;
  matchSeed: string;
  tiles: TileZonesState;
  allTiles: Record<string, Tile>;
  players: Record<string, PlayerState>;
  resources: ResourceZonesState;
  lastTurnHash?: string; // AGENTS 5.3: SHA-256 at the most recent completed turn
  influencesOnBoard?: InfluenceOnBoard[];
  productionEffects?: ActiveProductionEffect[];
  playedMeasureThisRound?: Record<string, boolean>;
  exp?: ExpansionsState;
}
