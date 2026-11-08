// Zones are first-class (CORE-01-00-01..06)
export type Zone =
  | 'Board'
  | 'DrawPile'
  | 'DrawResolution'
  | 'DiscardFaceUp'
  | 'Bank'
  | 'Noise'
  | 'PersonalSupply';

// Resources (CORE-01-02-04A..G) — registry-based. Do not hardcode resource types in core logic (AGENTS §1.6).
export type ResourceId = string; // e.g., 'DOM' | 'FOR' | 'INF' in CORE registry

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
  | 'InvestmentProgram'
  | 'AuthorityApparatus'
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
  hotspotOutcome?: 'regulation';
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
  core: CoreExpansionState;
  // Optional slices are created only when enabled (AGENTS §3.4, §3.8, §5.5).
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
export const RegulationKinds = ['SecurityLevel', 'Control', 'Administration', 'Blockade'] as const;
export type RegulationKind = typeof RegulationKinds[number];
export interface Regulation { id: string; kind: RegulationKind }
export interface BoardRegulation extends Regulation { tileId: string }
export interface RegulationZones {
  attached: BoardRegulation[];
  supply: Regulation[];
  serial: number;
}
export type RegulationOperation =
  | { operation: 'place'; regulationKind: RegulationKind; tileId: string }
  | { operation: 'move'; regulationId: string; tileId: string }
  | { operation: 'remove'; regulationId: string }
  | { operation: 'removeAll'; tileId: string };
export interface Exp02State { measures?: MeasureDeckState; regulations?: RegulationZones }
export interface Exp03State { measures?: MeasureDeckState }

export type MeasureDuration = 'thisRound' | 'nextRound' | 'throughNextRound' | 'ownerNextTurn' | 'thisTurn' | 'targetNextTurn' | 'untilConsumed';

// EXP-01-07-08: the production effect survives the card's transfer or recycling.
export interface ActiveMeasureEffect {
  id: string;
  sourceCardId: string;
  playNumber: 1 | 2;
  owner: string;
  targetPlayerID?: string;
  targetTileId?: string;
  targetResort?: ResourceId;
  targetRegulationId?: string;
  regulation?: RegulationOperation;
  duration: MeasureDuration;
  waitingForRound?: true;
  waitingForTurn?: true;
  used?: true;
}

export interface PendingHotspot {
  tileId: string;
  playerID: string;
  outcome: 'regulation' | 'greenwashing';
}

export type PendingRegulationChoice = { instanceId: string; playerID: string } & (
  { kind: 'deploymentOrder'; regulationId: string }
  | { kind: 'competenceConflict'; tileId: string }
);
export type DecisionContinuation = 'enclosures' | 'additional' | 'turnEnd' | 'finalSettlement';

export interface CoreExpansionState {
  tiles: TileZonesState;
  allTiles: Record<string, Tile>;
  players: Record<string, PlayerState>;
  resources: ResourceZonesState;
  influencesOnBoard?: InfluenceOnBoard[];
  activeMeasureEffects?: ActiveMeasureEffect[];
  pendingHotspot?: PendingHotspot;
  remainingHotspots?: string[];
  pendingRegulationChoices?: PendingRegulationChoice[];
  decisionContinuation?: DecisionContinuation;
  playedMeasureThisRound?: Record<string, boolean>;
}

export interface CoreState {
  cfg: import('./schemas.js').MatchConfig;
  matchSeed: string;
  lastTurnHash?: string; // AGENTS 5.3: SHA-256 at the most recent completed turn
  exp: ExpansionsState;
}
