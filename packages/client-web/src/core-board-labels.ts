import {
  computeMajority, type AxialCoord, type BoardPlacement, type BoardRegulation, type CoreExpansionState,
  type CoreState, type HotspotChoice, type PaymentSelection, type RegulationOperation, type Tile,
} from '@bc/rules';
import type { EngineMoveOption } from '@bc/game';
import { measureName } from './expansion-data.js';

export const playerLabel = (id: string) => `Player ${Number(id) + 1}`;
export const playerShortLabel = (id: string) => `P${Number(id) + 1}`;
export const coordLabel = ({ q, r }: AxialCoord) => `${q}, ${r}`;

export function words(value: string): string {
  const spaced = value.replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function tileLabel(tile: Tile): string {
  if (tile.id === 'Transformationsdruck') return 'Transformation Pressure'; // EXP-03-02-B-01
  if (tile.kind === 'Hotspot' && !tile.id.startsWith('Hotspot')) return words(tile.id);
  return tile.kind === 'ResortTile' ? `${tile.resort} · ${tile.w}` : words(tile.kind);
}

export function tileRuleSummary(tile: Tile): string {
  switch (tile.kind) {
    case 'ResortTile':
      // CORE-01-06-09, CORE-01-06-16(a)–(c)
      return 'At round settlement, apply any modifiers to the printed value. The controller gets the output. Tied leaders split it equally, with any remainder going to Noise. With zero influence, the tile produces nothing.';
    case 'StartCommittee':
      // CORE-01-08-04, CORE-01-08-05, CORE-01-08-06
      return 'The Start Committee is immune to effects, measures and regulations. Players cannot place markers here or control it.';
    case 'Committee':
      // CORE-01-04-14A, CORE-01-04-15, CORE-01-04-17, CORE-01-08-02, CORE-01-08-03
      return 'If you control this tile, you can pay 2 resources from different resorts as a political action to add 1 influence marker to your supply. Everyone must first place all their starting markers.';
    case 'Grassroots':
      // CORE-01-04-21A, CORE-01-04-22A, CORE-01-04-22B, CORE-01-04-22D
      return 'If you control this tile, you can trade 3 resources of one active resort for 1 of another active resort as a political action. Each action allows one exchange.';
    case 'Lobbyist':
      // CORE-01-05-04, CORE-01-05-05, CORE-01-05-06
      return 'The controller adds 1 virtual influence to each adjacent tile except other Lobbyists and the Start Committee. This bonus counts only toward majority.';
    case 'Hotspot':
      // CORE-01-06-01, CORE-01-06-02A, EXP-02-02-G-04, EXP-02-02-G-05A
      if (tile.hotspotOutcome === 'regulation') {
        return 'The first time this tile is fully surrounded, the player with the majority may place or move one regulation and pays any applicable costs.';
      }
      // CORE-01-06-01, CORE-01-06-02A, CORE-01-06-04, CORE-01-06-05, CORE-01-06-06, CORE-01-06-07
      return 'The first time this tile is fully surrounded, the player with the majority places 1 available influence marker here from their supply, subject to applicable effects.';
    case 'InvestmentProgram':
      // EXP-01-05-01, EXP-01-05-02, EXP-01-05-05, EXP-01-05-07
      return 'If you control this tile and a Grassroots, you can use that Grassroots to trade 2 ECO for 1 resource of another active resort as your conversion action.';
    case 'AuthorityApparatus':
      // EXP-02-05-02, EXP-02-05-02A, EXP-02-05-03
      return 'If you control this tile, you can move one regulation to another legal tile or remove it as a political action. The base cost is 0 resources.';
  }
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
    alternative?: string;
    measureId?: string;
    targetPlayerID?: string;
    targetResort?: string;
    targetRegulationId?: string;
    regulation?: RegulationOperation;
    payment?: PaymentSelection;
  };
};

export interface MeasureSelection {
  id: string;
  action: 'take' | 'play';
}

export function measureAction(option: EngineMoveOption): MeasureSelection | undefined {
  if (option.moveType !== 'doPoliticalAction') return;
  const { type, payload } = option.parameters[0] as PoliticalOption;
  if (!payload.measureId) return;
  if (type.endsWith('_takeMeasure')) return { id: payload.measureId, action: 'take' };
  if (type.endsWith('_playMeasure')) return { id: payload.measureId, action: 'play' };
}

export function isAuthorityAction(option: EngineMoveOption): boolean {
  return option.moveType === 'doPoliticalAction' && (option.parameters[0] as PoliticalOption).type === 'activateAuthorityApparatus';
}

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

export const regulationLabel = ({ kind, id }: BoardRegulation) => `${words(kind)} (${id})`;

function describeRegulation(G: CoreState, operation: RegulationOperation): string {
  const tile = 'tileId' in operation ? boardTileLabel(G.exp.core, operation.tileId) : undefined;
  if (operation.operation === 'place') return `Place ${words(operation.regulationKind)} on ${tile}`;
  if (operation.operation === 'removeAll') return `Remove all regulations from ${tile}`;
  const regulation = G.exp.exp02?.regulations?.attached.find(item => item.id === operation.regulationId);
  const name = regulation ? regulationLabel(regulation) : operation.regulationId;
  const source = regulation ? ` from ${boardTileLabel(G.exp.core, regulation.tileId)}` : '';
  return operation.operation === 'move' ? `Move ${name}${source} to ${tile}` : `Remove ${name}${source}`;
}

function paymentLabel(payment?: PaymentSelection): string {
  const notes = [
    payment?.greenwashing && `Greenwashing fee in ${payment.greenwashing}`,
    payment?.replacement && `Supplemental Budget uses ${payment.replacement.resource}`,
    payment?.council && `Economic Council uses ${payment.council.resource}`,
    payment?.partnership && `Order Partnership replaces ${payment.partnership.replacedResource}`,
    payment?.transfers?.length && 'Intergenerational Pact transfers a surcharge',
  ].filter(Boolean);
  return notes.length ? ` · ${notes.join(' · ')}` : '';
}

export function describeOption(G: CoreState, option: EngineMoveOption): string {
  const core = G.exp.core;
  if (option.moveType === 'placeTile') return `Place tile at ${coordLabel(option.parameters[0] as AxialCoord)}`;

  if (option.moveType === 'chooseHotspotOutcome' || option.moveType === 'chooseRegulationFollowUp') {
    const choice = option.parameters[0] as HotspotChoice;
    if (choice.kind === 'decline') return 'Decline this optional effect';
    if (choice.kind === 'greenwashing') return `Pay ${choice.resource} to collect the Hotspot marker`;
    return describeRegulation(G, choice.regulation) + paymentLabel(choice.payment);
  }

  if (option.moveType === 'doPoliticalAction') {
    const { type, payload } = option.parameters[0] as PoliticalOption;
    const payment = paymentLabel(payload.payment);
    const card = measureAction(option);
    if (card?.action === 'take') return `Take ${measureName(card.id)}${payment}`;
    if (card?.action === 'play') {
      const targetRegulation = G.exp.exp02?.regulations?.attached.find(item => item.id === payload.targetRegulationId);
      const targets = [
        payload.targetPlayerID && playerLabel(payload.targetPlayerID),
        payload.targetTileId && boardTileLabel(core, payload.targetTileId),
        payload.targetResort,
        targetRegulation && `${regulationLabel(targetRegulation)} on ${boardTileLabel(core, targetRegulation.tileId)}`,
        payload.regulation && describeRegulation(G, payload.regulation),
      ].filter(Boolean);
      return [`Play ${measureName(card.id)}`, ...targets].join(' · ') + payment;
    }
    if (type === 'activateAuthorityApparatus' && payload.regulation) {
      return `Activate Authority Apparatus · ${describeRegulation(G, payload.regulation)}${payment}`;
    }
    if (type === 'recallInfluence' && option.contextTile) {
      const marker = core.influencesOnBoard?.find(item => item.id === payload.markerId);
      const target = marker ? `${playerLabel(marker.owner)}'s marker (${marker.id})` : 'opposing marker';
      return `Recall ${target} from ${boardTileLabel(core, option.contextTile)} to its owner's supply${payment}`;
    }
    if (type === 'placeOrMoveInfluence' && payload.targetTileId) {
      const target = boardTileLabel(core, payload.targetTileId);
      const markers = payload.sourceTileId
        ? (core.influencesOnBoard ?? []).filter(marker => marker.owner === option.playerID && marker.tileId === payload.sourceTileId)
        : core.players[option.playerID].personal.influence;
      const index = markers.findIndex(marker => marker.id === payload.markerId) + 1;
      const marker = markers.length > 1 ? `marker ${index}` : 'a marker';
      const action = payload.sourceTileId
        ? `Move ${marker} from ${boardTileLabel(core, payload.sourceTileId)} to ${target}`
        : `Place ${marker} from your supply on ${target}`;
      return action + payment;
    }
    if (type === 'formalizeInfluence' && payload.tileId) {
      return `Formalize influence via ${boardTileLabel(core, payload.tileId)}${payment}`;
    }
    if (type === 'convertResources' && payload.tileId) {
      const alternative = payload.alternative ? ' with Investment Program' : '';
      return `Convert ${payload.input} to ${payload.output} at ${boardTileLabel(core, payload.tileId)}${alternative}${payment}`;
    }
    return words(type);
  }
  return words(option.moveType);
}
