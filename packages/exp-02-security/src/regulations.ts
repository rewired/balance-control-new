import { ensureExpansionSlice, getControl, RegulationKinds, type BoardPlacement, type BoardRegulation, type CoreState,
  type Exp02State, type PendingRegulationChoice, type RegulationKind, type RegulationOperation, type RegulationRules, type Tile } from '@bc/rules';

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

export const regulationRules: RegulationRules = {
  // EXP-02-02-A-03/-08: an unbounded supply with no initial attachments.
  initialize(G) {
    const slice = ensureExpansionSlice<Exp02State>(G, 'exp02', {});
    slice.regulations ??= { attached: [], supply: [], serial: 0 };
  },
  attached: G => G.exp.exp02?.regulations?.attached ?? [],
  mayAttach: mayAttachRegulation,
  context: regulationContext,
  operations: regulationOperations,
  // EXP-02-05-02/-04: the controlled Apparatus is the sole context of its embedded operation.
  authorityContext(G, request) {
    if (request.regulation.operation !== 'move' && request.regulation.operation !== 'remove') return;
    const authority = G.exp.core.tiles.board.find(tile => G.exp.core.allTiles[tile.tileId]?.kind === 'AuthorityApparatus');
    if (authority && getControl(G, authority.coord) === request.playerID) return authority;
  },
  plan(G, operation, playerID, authorityTileId) {
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
  },
  permitsFollowUp,
  followUpOperations(G, pending) {
    return pending.kind === 'deploymentOrder'
      ? [...regulationOperations(G, 'move')].filter(operation => permitsFollowUp(pending, operation))
      : [{ operation: 'place', regulationKind: 'Control', tileId: pending.tileId }];
  },
  followUpContext(G, pending) {
    return pending.kind === 'competenceConflict' ? pending.tileId
      : G.exp.exp02?.regulations?.attached.find(regulation => regulation.id === pending.regulationId)?.tileId ?? null;
  },
};
