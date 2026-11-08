import type { ActiveMeasureEffect, CoreState, ResourceId } from './types.js';
import type { EffectDescriptor } from './effects.js';
import type { Surcharge } from './expansion-registry.js';
import type { PaymentSelection } from './schemas.js';
import type { ResourceAmounts, ResourceRegistry } from './resources.js';

type Replacement = NonNullable<PaymentSelection['replacement']>;
type Transfer = NonNullable<PaymentSelection['transfers']>[number];
type Council = NonNullable<PaymentSelection['council']>;
type Partnership = NonNullable<PaymentSelection['partnership']>;
type SurchargePayment = Surcharge & { payer: string; resource?: ResourceId };

export function isPoliticalEffect(effect: EffectDescriptor): boolean {
  return ['placeOrMoveInfluence', 'formalizeInfluence', 'convertResources', 'takeMeasure', 'playMeasure', 'activateAuthorityApparatus'].includes(effect.kind);
}

// EXP-03-08-M05-04..09: one suppression fee per eligible gain, even with multiple instances.
export function isGreenwashingActive(G: CoreState): boolean {
  return G.cfg.expansions.exp03 && Boolean(G.activeMeasureEffects?.some(instance => instance.sourceCardId === 'CLM_M05'));
}

function* transferChoices(
  costs: readonly Surcharge[],
  pacts: readonly ActiveMeasureEffect[],
  players: string[],
  start = 0,
  chosen: Transfer[] = [],
): Generator<Transfer[]> {
  if (start === pacts.length) {
    yield chosen;
    return;
  }
  yield* transferChoices(costs, pacts, players, start + 1, chosen);
  for (const cost of costs) {
    if (chosen.some(transfer => transfer.costId === cost.id)) continue;
    for (const playerID of players) {
      yield* transferChoices(costs, pacts, players, start + 1, [
        ...chosen, { effectId: pacts[start].id, costId: cost.id, playerID },
      ]);
    }
  }
}

export interface PlannedPayment {
  transfers: { playerID: string; resource: ResourceId; amount: number }[];
  consumeEffects: string[];
  useCouncil?: string;
}

// CORE-01-06-00-10 and EXP-03-02-D-03/-07/-08: plan only final payments for each assigned payer.
export function planSelectedPayment(
  G: CoreState,
  registry: ResourceRegistry,
  effect: EffectDescriptor & { playerID: string },
  base: Partial<ResourceAmounts>,
  raw: readonly Surcharge[],
  immune: boolean,
): PlannedPayment | undefined {
  const original = effect.playerID;
  const selected = effect.payment;
  if (selected?.greenwashing && effect.kind !== 'formalizeInfluence') return;
  const resources = registry.list();
  const effects = immune ? [] : G.activeMeasureEffects ?? [];
  const owned = effects.filter(instance => instance.owner === original);
  // EXP-03-08-M08/-M09/-M10: protection checks the original payer and only Climate surcharges.
  const protection = effects.some(instance => instance.sourceCardId === 'CLM_M08'
    || (instance.owner === original && (instance.sourceCardId === 'CLM_M10'
      || (instance.sourceCardId === 'CLM_M09' && isPoliticalEffect(effect) && effect.kind !== 'playMeasure'))));
  const costs = raw.filter(cost => !cost.climate || !protection);
  const pacts = owned.filter(instance => instance.sourceCardId === 'CLM_M13');
  const councils = owned.filter(instance => instance.sourceCardId === 'ECO_M08' && !instance.used);
  const partnerships = effect.kind === 'playMeasure' || effect.kind === 'regulationOperation' || effect.kind === 'activateAuthorityApparatus'
    ? effects.filter(instance => instance.sourceCardId === 'SEC_M06') : [];
  const supplemental = isPoliticalEffect(effect) && owned.some(instance => instance.sourceCardId === 'ECO_M10');
  const others = Object.keys(G.players).filter(playerID => playerID !== original);
  const replacements: (Replacement | undefined)[] = selected ? [selected.replacement] : [
    undefined,
    ...(supplemental ? costs.flatMap(cost => resources.map(resource => ({ costId: cost.id, resource }))) : []),
  ];

  for (const replacement of replacements) {
    // EXP-01-08-M10-04..07: the replacement is a fixed payment and cannot be transferred.
    if (replacement && (!supplemental || !registry.has(replacement.resource) || !costs.some(cost => cost.id === replacement.costId))) continue;
    const eligible = costs.filter(cost => cost.id !== replacement?.costId);
    for (const transfer of selected ? [selected.transfers ?? []] : transferChoices(eligible, pacts, others)) {
      const byCost = new Map(transfer.map(item => [item.costId, item.playerID]));
      const consumed = new Set(transfer.map(item => item.effectId));
      if (byCost.size !== transfer.length || consumed.size !== transfer.length || transfer.some(item =>
        !eligible.some(cost => cost.id === item.costId) || !pacts.some(pact => pact.id === item.effectId) || !others.includes(item.playerID))) continue;
      const requested = selected?.surcharges ?? {};
      if (Object.keys(requested).some(id => !eligible.some(cost => cost.id === id))) continue;
      const units: SurchargePayment[] = eligible.map(cost => ({
        ...cost, payer: byCost.get(cost.id) ?? original, resource: Object.hasOwn(requested, cost.id) ? requested[cost.id] : undefined,
      }));

      const councilChoices: (Council | undefined)[] = selected ? [selected.council] : [
        undefined, ...councils.flatMap(instance => resources.filter(resource => resource !== 'ECO').map(resource => ({ effectId: instance.id, resource }))),
      ];
      const partnershipChoices: (Partnership | undefined)[] = selected ? [selected.partnership] : [
        undefined, ...partnerships.flatMap(instance => resources.filter(resource => resource !== 'SEC')
          .map(replacedResource => ({ effectId: instance.id, replacedResource }))),
      ];
      for (const [council, partnership] of councilChoices.flatMap(council => partnershipChoices.map(partnership => [council, partnership] as const))) {
        if (council && (!councils.some(instance => instance.id === council.effectId) || council.resource === 'ECO' || !registry.has(council.resource))) continue;
        if (partnership && (!partnerships.some(instance => instance.id === partnership.effectId)
            || partnership.replacedResource === 'SEC' || !registry.has(partnership.replacedResource))) continue;
        const accounts = new Map<string, ResourceAmounts>([[original, Object.assign(Object.create(null), base)]]);
        if (replacement) {
          const cost = accounts.get(original)!;
          cost[replacement.resource] = (cost[replacement.resource] ?? 0) + 1;
        }
        // EXP-01-08-M08-04: account for one ECO substitution during the search without paying anything yet.
        if (council) {
          const cost = accounts.get(original)!;
          cost.ECO = (cost.ECO ?? 0) - 1;
          cost[council.resource] = (cost[council.resource] ?? 0) + 1;
        }
        // EXP-02-08-M06-03: substitute one original Resource with SEC for a Regulation or Measure.
        if (partnership) {
          const cost = accounts.get(original)!;
          cost[partnership.replacedResource] = (cost[partnership.replacedResource] ?? 0) - 1;
          cost.SEC = (cost.SEC ?? 0) + 1;
        }
        const affordable = (payer: string, amounts: ResourceAmounts) => Object.entries(amounts)
          .every(([resource, amount]) => registry.has(resource) && Number.isSafeInteger(amount)
            && amount <= (G.players[payer].personal.resources[resource] ?? 0));
        if (!affordable(original, accounts.get(original)!)) continue;

        const allocate = (index: number): boolean => {
          if (index === units.length) {
            const cost = accounts.get(original)!;
            // CORE-01-06-00-10: a Resource created by one substitution cannot satisfy the other.
            return (!council || cost.ECO >= 0) && (!partnership || cost[partnership.replacedResource]
              >= (council?.resource === partnership.replacedResource ? 1 : 0));
          }
          const unit = units[index];
          const options = unit.resources ?? resources;
          const choices = unit.resource === undefined ? options : options.includes(unit.resource) ? [unit.resource] : [];
          const amount = accounts.get(unit.payer) ?? Object.create(null) as ResourceAmounts;
          accounts.set(unit.payer, amount);
          for (const resource of choices) {
            if (!registry.has(resource)) continue;
            const before = amount[resource] ?? 0;
            amount[resource] = before + 1;
            if (affordable(unit.payer, amount) && allocate(index + 1)) return true;
            amount[resource] = before;
          }
          return false;
        };
        if (!allocate(0)) continue;

        const transfers = [...accounts].flatMap(([playerID, amounts]) => Object.entries(amounts)
          .filter(([, amount]) => amount !== 0)
          .map(([resource, amount]) => ({ playerID, resource, amount })));
        return { transfers, consumeEffects: [...consumed], ...(council ? { useCouncil: council.effectId } : {}) };
      }
    }
  }
}
