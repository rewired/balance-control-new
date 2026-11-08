import { ensureExpansionSlice, getControl, RegulationKinds, type BoardPlacement, type BoardRegulation, type CoreState,
  type EffectDecision, type Exp02State, type ExtensionAction, type ExpansionModule, type MeasureRule,
  type PendingRegulationChoice, type RegulationKind, type RegulationOperation, type ResolveRegulationEffect, type Tile } from '@bc/rules';

// EXP-02-02-B-04/-06 and CORE-01-08-06: validate the attachment independently of the ContextTile.
export function mayAttachRegulation(tile: Tile, kind: RegulationKind): boolean {
  if (tile.kind === 'StartCommittee') return false;
  const producesOrConverts = tile.kind === 'ResortTile' || tile.kind === 'Grassroots';
  return kind === 'Control' ? !producesOrConverts : kind === 'Administration' ? producesOrConverts : true;
}

export function regulationContext(G: CoreState, operation: RegulationOperation): BoardPlacement | undefined {
  const tileId = 'tileId' in operation ? operation.tileId
    : G.exp?.exp02?.regulations?.attached.find(regulation => regulation.id === operation.regulationId)?.tileId;
  return G.exp.core.tiles.board.find(placement => placement.tileId === tileId);
}

export function* regulationOperations(G: CoreState, kind: RegulationOperation['operation']): Generator<RegulationOperation> {
  const attached = G.exp?.exp02?.regulations?.attached ?? [];
  switch (kind) {
    case 'place':
      for (const { tileId } of G.exp.core.tiles.board) {
        for (const regulationKind of RegulationKinds) {
          if (mayAttachRegulation(G.exp.core.allTiles[tileId], regulationKind)) yield { operation: 'place', regulationKind, tileId };
        }
      }
      break;
    case 'move':
      for (const regulation of attached) {
        for (const { tileId } of G.exp.core.tiles.board) {
          if (tileId !== regulation.tileId && mayAttachRegulation(G.exp.core.allTiles[tileId], regulation.kind)) {
            yield { operation: 'move', regulationId: regulation.id, tileId };
          }
        }
      }
      break;
    case 'remove':
      for (const regulation of attached) yield { operation: 'remove', regulationId: regulation.id };
      break;
    case 'removeAll':
      for (const { tileId } of G.exp.core.tiles.board) yield { operation: 'removeAll', tileId };
      break;
  }
}

function planRegulationMutation(G: CoreState, operation: RegulationOperation): (() => BoardRegulation | void) | undefined {
  const zones = G.exp.exp02?.regulations;
  const placement = regulationContext(G, operation);
  if (!zones || !placement) return;
  // EXP-02-02-A-03/-08 and EXP-02-04-A-05: source a Regulation from unbounded supply.
  if (operation.operation === 'place') {
    if (!mayAttachRegulation(G.exp.core.allTiles[placement.tileId], operation.regulationKind)) return;
    return () => {
      const index = zones.supply.findIndex(item => item.kind === operation.regulationKind);
      const regulation = index < 0 ? { id: `reg-${++zones.serial}`, kind: operation.regulationKind } : zones.supply.splice(index, 1)[0];
      const attached = { ...regulation, tileId: placement.tileId };
      zones.attached.push(attached);
      return attached;
    };
  }
  const affected = operation.operation === 'removeAll' ? zones.attached.filter(item => item.tileId === placement.tileId)
    : zones.attached.filter(item => item.id === operation.regulationId);
  if (operation.operation !== 'removeAll' && affected.length !== 1) return;
  // EXP-02-08-M13-03 and CORE-01-06-00-05B: Surveillance checks the actual source.
  if (affected.some(item => G.exp.core.activeMeasureEffects?.some(instance => instance.sourceCardId === 'SEC_M13'
      && instance.targetTileId === item.tileId))) return;
  if (operation.operation === 'move') {
    const [regulation] = affected;
    if (regulation.tileId === placement.tileId || !mayAttachRegulation(G.exp.core.allTiles[placement.tileId], regulation.kind)) return;
    // EXP-02-02-F-01/-02: movement preserves the object and kind.
    return () => { regulation.tileId = placement.tileId; };
  }
  // EXP-02-02-E-01/-02: return the same objects without a refund.
  return () => {
    const ids = new Set(affected.map(item => item.id));
    zones.attached = zones.attached.filter(item => !ids.has(item.id));
    zones.supply.push(...affected.map(({ id, kind }) => ({ id, kind })));
  };
}

function queueRegulationFollowUps(G: CoreState, playerID: string, placed?: BoardRegulation | void, apparatusId?: string): void {
  // EXP-02-08-M03-03/-04 and EXP-02-08-M05-03..05: capture the first actual triggering operation.
  const queued = new Set(G.exp.core.pendingRegulationChoices?.map(choice => choice.instanceId));
  const choices: PendingRegulationChoice[] = [];
  for (const instance of G.exp.core.activeMeasureEffects ?? []) {
    if (instance.owner !== playerID || queued.has(instance.id)) continue;
    if (placed && instance.sourceCardId === 'SEC_M03') {
      choices.push({ kind: 'deploymentOrder', instanceId: instance.id, playerID, regulationId: placed.id });
    } else if (apparatusId && instance.sourceCardId === 'SEC_M05') {
      choices.push({ kind: 'competenceConflict', instanceId: instance.id, playerID, tileId: apparatusId });
    }
  }
  if (choices.length) (G.exp.core.pendingRegulationChoices ??= []).unshift(...choices);
}

function regulationPrice(G: CoreState, operation: RegulationOperation): { amount: number; discounts: string[] } {
  if (operation.operation !== 'place') return { amount: 0, discounts: [] };
  // EXP-02-04-A-01 and EXP-02-08-M15-03: discount the next placement this round with a floor of one SEC.
  const discounts = G.exp.core.activeMeasureEffects?.filter(instance => instance.sourceCardId === 'SEC_M15' && !instance.used)
    .map(instance => instance.id) ?? [];
  return { amount: Math.max(1, 2 - discounts.length), discounts };
}

function commitRegulationDiscounts(G: CoreState, discounts: string[] = []): void {
  if (!discounts.length) return;
  for (const instance of G.exp.core.activeMeasureEffects ?? []) {
    if (discounts.includes(instance.id)) instance.used = true;
  }
}

function permitsFollowUp(pending: PendingRegulationChoice, operation: RegulationOperation): boolean {
  // EXP-02-08-M03-03/-04 and EXP-02-08-M05-03/-05.
  return pending.kind === 'deploymentOrder'
    ? operation.operation === 'move' && operation.regulationId === pending.regulationId
    : operation.operation === 'place' && operation.regulationKind === 'Control' && operation.tileId === pending.tileId;
}

// EXP-02-02-A-03/-08: an unbounded supply with no initial attachments.
export function initializeRegulations(G: CoreState): void {
  const slice = ensureExpansionSlice<Exp02State>(G, 'exp02', {});
  slice.regulations ??= { attached: [], supply: [], serial: 0 };
}

function planOperation(G: CoreState, operation: RegulationOperation, playerID: string, authorityTileId?: string) {
  const mutate = planRegulationMutation(G, operation);
  if (!mutate) return;
  const { amount, discounts } = regulationPrice(G, operation);
  return {
    cost: amount ? { SEC: amount } : undefined,
    commit: () => {
      const placed = mutate();
      commitRegulationDiscounts(G, discounts);
      queueRegulationFollowUps(G, playerID, placed, authorityTileId);
    },
  };
}

const regulationAction: ExtensionAction = {
  // EXP-02-04-A-05 and EXP-02-02-G-05B: an enclosing effect can supply the context.
  context(G, effect) {
    const placement = effect.contextTileId === undefined ? regulationContext(G, effect.regulation)
      : G.exp.core.tiles.board.find(tile => tile.tileId === effect.contextTileId);
    return placement ? { placement } : { reason: 'regulation-unavailable' };
  },
  plan: (G, effect) => planOperation(G, effect.regulation, effect.playerID),
};

const authorityAction: ExtensionAction = {
  political: true,
  // EXP-02-05-02/-04: a controlled Apparatus is the sole context of its move or removal.
  context(G, effect) {
    const placement = G.exp.core.tiles.board.find(tile => G.exp.core.allTiles[tile.tileId]?.kind === 'AuthorityApparatus');
    return (effect.regulation.operation === 'move' || effect.regulation.operation === 'remove') && placement
      && getControl(G, placement.coord) === effect.playerID ? { placement } : { reason: 'apparatus-unavailable' };
  },
  plan: (G, effect, placement) => planOperation(G, effect.regulation, effect.playerID, placement.tileId),
};

export const regulationActions = {
  regulationOperation: regulationAction,
  activateAuthorityApparatus: authorityAction,
} satisfies NonNullable<ExpansionModule['actions']>;

// EXP-02-08-M01/-M04/-M07/-M08/-M12: a card can resolve an operation now or register it for Settlement.
export function operationTarget(kind: RegulationOperation['operation'], timing: 'immediate' | 'settlement', hotspotOnly = false):
  NonNullable<MeasureRule['extensionTarget']> {
  return {
    options: function* (G) {
      for (const regulation of regulationOperations(G, kind)) yield { regulation };
    },
    plan(G, effect) {
      if (effect.targetRegulationId !== undefined) return { ok: false, reason: 'invalid-target' };
      const { regulation } = effect;
      const placement = regulation && regulationContext(G, regulation);
      if (!regulation || regulation.operation !== kind || !placement) return { ok: false, reason: 'invalid-regulation-operation' };
      const tile = G.exp.core.allTiles[placement.tileId];
      if ((hotspotOnly && tile.kind !== 'Hotspot')
        || (regulation.operation === 'place' && !mayAttachRegulation(tile, regulation.regulationKind))) {
        return { ok: false, reason: 'invalid-regulation-operation' };
      }
      const operation = timing === 'immediate' ? planOperation(G, regulation, effect.playerID) : undefined;
      if (timing === 'immediate' && !operation) return { ok: false, reason: 'invalid-regulation-operation' };
      return { ok: true, placement, operation, registration: { regulation } };
    },
  };
}

// EXP-02-08-M14-02/-03: target the selected attachment and remember its tile.
export const attachedRegulationTarget: NonNullable<MeasureRule['extensionTarget']> = {
  options: G => (G.exp.exp02?.regulations?.attached ?? []).map(({ id }) => ({ targetRegulationId: id })),
  plan(G, effect) {
    const regulation = G.exp.exp02?.regulations?.attached.find(item => item.id === effect.targetRegulationId);
    if (!regulation) return { ok: false, reason: 'invalid-target' };
    if (effect.regulation !== undefined) return { ok: false, reason: 'invalid-regulation-operation' };
    return {
      ok: true, placement: G.exp.core.tiles.board.find(tile => tile.tileId === regulation.tileId),
      registration: { targetRegulationId: regulation.id, targetTileId: regulation.tileId },
    };
  },
};

function operationDecision(
  playerID: string,
  contextTile: string | null,
  operations: Iterable<RegulationOperation>,
  permits: (operation: RegulationOperation) => boolean,
  contextTileId?: string,
): EffectDecision {
  const makeEffect = (regulation: RegulationOperation): ResolveRegulationEffect =>
    ({ kind: 'regulationOperation', playerID, regulation, ...(contextTileId === undefined ? {} : { contextTileId }) });
  return {
    contextTile,
    options: {
      *[Symbol.iterator]() {
        for (const regulation of operations) yield {
          effect: makeEffect(regulation),
          choice: payment => ({ kind: 'regulation', regulation, ...(payment ? { payment } : {}) }),
        };
      },
    },
    select: choice => choice.kind === 'regulation' && permits(choice.regulation)
      ? { ...makeEffect(choice.regulation), payment: choice.payment } : undefined,
  };
}

function* innerOrderOperations(G: CoreState): Generator<RegulationOperation> {
  yield* regulationOperations(G, 'place');
  yield* regulationOperations(G, 'move');
}

// EXP-02-02-G-04..05B/-07: replace the marker payout with a paid operation in Inner Order.
export function innerOrderDecision(G: CoreState, tileId: string, playerID: string): (EffectDecision & { outcome: 'regulation' }) | undefined {
  const tile = G.exp.core.allTiles[tileId];
  if (tile?.kind !== 'Hotspot' || tile.hotspotOutcome !== 'regulation') return;
  return {
    outcome: 'regulation',
    ...operationDecision(playerID, tileId, innerOrderOperations(G),
      operation => operation.operation === 'place' || operation.operation === 'move', tileId),
  };
}

// EXP-02-08-M03-03/-04 and EXP-02-08-M05-03..05: offer the operation tied to the triggering object.
export function regulationFollowUp(G: CoreState, pending: PendingRegulationChoice): EffectDecision {
  const context = pending.kind === 'competenceConflict' ? pending.tileId
    : G.exp.exp02?.regulations?.attached.find(regulation => regulation.id === pending.regulationId)?.tileId ?? null;
  const operations: RegulationOperation[] = pending.kind === 'deploymentOrder'
    ? [...regulationOperations(G, 'move')].filter(operation => permitsFollowUp(pending, operation))
    : [{ operation: 'place', regulationKind: 'Control', tileId: pending.tileId }];
  return {
    ...operationDecision(pending.playerID, context, operations, operation => permitsFollowUp(pending, operation)),
    consumeOnCompletion: [pending.instanceId],
  };
}
