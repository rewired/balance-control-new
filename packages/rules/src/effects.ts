import type { ActiveMeasureEffect, AxialCoord, CoreState, DecisionContinuation, ExpansionId, PendingHotspot, ResourceId, RegulationOperation } from './types.js';
import type { HotspotChoice, PaymentSelection } from './schemas.js';
import type { PlannedPayment } from './payment.js';
import { getCoreExpansion, type RulesModule } from './expansion-registry.js';

export type EffectKind =
  | 'addResources'
  | 'drawTile'
  | 'placeTile'
  | 'resolveHotspotAt'
  | 'chooseHotspotOutcome'
  | 'chooseRegulationFollowUp'
  | 'continueRegisteredDecisions'
  | 'recordDecisionContinuation'
  | 'applyProductionAt'
  | 'registerMeasureEffect'
  | 'expireMeasureEffects'
  | 'completeEmptyPoliticalSlot'
  | 'beforeSettlementProduction'
  | ResolveRegulationEffect['kind']
  | 'addNoise'
  | PoliticalActionEffect['kind']
  | 'initMeasures'
  | 'takeMeasure'
  | 'playMeasure'
  | 'resetMeasuresRound'
  | 'recordTurnHash';

export interface BaseEffect {
  contextCoord?: AxialCoord; // ContextTile binding (AGENTS §3.5 step 1)
  payment?: PaymentSelection;
  political?: true; // Set by the resolver for a registered political action.
  politicalContinuation?: { replacementUsed: boolean }; // CORE-01-04-19C, set by the resolver.
}

export interface AddResourcesEffect extends BaseEffect {
  kind: 'addResources';
  playerID: string;
  resource: ResourceId;
  amount: number; // base amount before modifiers
  cost?: Partial<Record<ResourceId, number>>; // paid from player personal supply
}

export interface DrawTileEffect extends BaseEffect {
  kind: 'drawTile';
  playerID: string;
  turn: number;
}

export interface PlaceTileEffect extends BaseEffect {
  kind: 'placeTile';
  playerID: string;
  tileId: string;
  coord: AxialCoord;
}

export interface ResolveHotspotAtEffect extends BaseEffect {
  kind: 'resolveHotspotAt';
  coord: AxialCoord;
}

interface ChooseHotspotOutcome extends BaseEffect {
  kind: 'chooseHotspotOutcome' | 'chooseRegulationFollowUp';
  playerID: string;
  choice: HotspotChoice;
}

interface ContinueRegisteredDecisions extends BaseEffect { kind: 'continueRegisteredDecisions' }
interface RecordDecisionContinuation extends BaseEffect {
  kind: 'recordDecisionContinuation';
  continuation?: DecisionContinuation;
}

export interface ApplyProductionAtEffect extends BaseEffect {
  kind: 'applyProductionAt';
  coord: AxialCoord;
}

export interface RegisterMeasureEffect extends BaseEffect {
  kind: 'registerMeasureEffect';
  instance: Omit<ActiveMeasureEffect, 'id' | 'waitingForRound' | 'waitingForTurn' | 'used'>;
}

export type ExpireMeasureEffects = BaseEffect & { kind: 'expireMeasureEffects' } & (
  { boundary: 'settlementEnd' } | { boundary: 'turnEnd'; playerID: string }
  | { boundary: 'turnStart'; playerID: string; nextRound?: boolean }
);

interface CompleteEmptyPoliticalSlot extends BaseEffect {
  kind: 'completeEmptyPoliticalSlot';
  playerID: string;
}

interface BeforeSettlementProductionEffect extends BaseEffect { kind: 'beforeSettlementProduction' }

const registeredActionKinds = ['regulationOperation', 'activateAuthorityApparatus'] as const;

export interface ResolveRegulationEffect extends BaseEffect {
  kind: typeof registeredActionKinds[number];
  playerID: string;
  regulation: RegulationOperation;
  contextTileId?: string;
}

export function isRegisteredAction(effect: EffectDescriptor): effect is ResolveRegulationEffect {
  return registeredActionKinds.some(kind => kind === effect.kind);
}

export interface AddNoiseEffect extends BaseEffect {
  kind: 'addNoise';
  resource: ResourceId;
  amount: number;
}

export interface ConversionSelection {
  tileId: string;
  input: ResourceId;
  output: ResourceId;
  alternative?: string;
  payment?: PaymentSelection;
}

export type PoliticalActionEffect = BaseEffect & { playerID: string } & (
  | { kind: 'placeOrMoveInfluence'; markerId: string; targetTileId: string; sourceTileId?: string }
  | { kind: 'formalizeInfluence'; tileId: string; resources: ResourceId[]; conversion?: ConversionSelection }
  | ({ kind: 'convertResources' } & ConversionSelection)
);

export interface InitMeasuresEffect extends BaseEffect {
  kind: 'initMeasures';
  expansion: ExpansionId;
  deck: readonly string[];
}
export interface TakeMeasureEffect extends BaseEffect {
  kind: 'takeMeasure';
  expansion: ExpansionId;
  playerID: string;
  measureId: string; // must be from open
}
export interface PlayMeasureEffect extends BaseEffect {
  kind: 'playMeasure';
  expansion: ExpansionId;
  playerID: string;
  measureId: string; // must be in hand
  targetPlayerID?: string;
  targetTileId?: string;
  targetResort?: ResourceId;
  targetRegulationId?: string;
  regulation?: RegulationOperation;
  resourceOutputs?: readonly AddResourcesEffect[]; // Set by the resolver from the registered Measure rule.
}
export interface ResetMeasuresRoundEffect extends BaseEffect {
  kind: 'resetMeasuresRound';
}

interface RecordTurnHashEffect extends BaseEffect {
  kind: 'recordTurnHash';
  turn: number;
  playerID: string;
}

export type EffectDescriptor =
  | AddResourcesEffect
  | DrawTileEffect
  | PlaceTileEffect
  | ResolveHotspotAtEffect
  | ChooseHotspotOutcome
  | ContinueRegisteredDecisions
  | RecordDecisionContinuation
  | ApplyProductionAtEffect
  | RegisterMeasureEffect
  | ExpireMeasureEffects
  | CompleteEmptyPoliticalSlot
  | BeforeSettlementProductionEffect
  | ResolveRegulationEffect
  | AddNoiseEffect
  | PoliticalActionEffect
  | InitMeasuresEffect
  | TakeMeasureEffect
  | PlayMeasureEffect
  | ResetMeasuresRoundEffect
  | RecordTurnHashEffect;

export interface ResolveResult { ok: boolean; reason?: string; attemptEffectsConsumed?: true }

// EXP-01-06-00A/-00B and EXP-02-02-A-03: create each expansion zone at its setup effect.
export function ensureExpansionSlice<T extends object>(G: CoreState, id: ExpansionId, initial: T): T {
  const slices: Partial<Record<ExpansionId, object>> = G.exp;
  return (slices[id] ??= initial) as T;
}

export interface PaymentQuote {
  payment?: PaymentSelection;
  costBreakdown: PlannedPayment['transfers'];
  contextTile: string | null;
}

export type DecisionQuote = Omit<PaymentQuote, 'payment'> & { choice: HotspotChoice };

export interface EffectResolver {
  (G: CoreState, effect: EffectDescriptor): ResolveResult;
  actionQuotes(G: CoreState, requested: PoliticalActionEffect | TakeMeasureEffect | PlayMeasureEffect | ResolveRegulationEffect | PlaceTileEffect): PaymentQuote[];
  hotspotQuotes(G: CoreState, pending?: PendingHotspot): DecisionQuote[];
  regulationFollowUpQuotes(G: CoreState): DecisionQuote[];
}

export function createResolver(modules?: readonly RulesModule[]): EffectResolver {
  return getCoreExpansion().createResolver(modules);
}
