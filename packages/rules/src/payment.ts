import type { CoreState, ResourceId } from './types.js';
import type { EffectDescriptor } from './effects.js';
import { createExpansionRegistry, type ExpansionHooks, type Surcharge } from './expansion-registry.js';
import type { PaymentSelection } from './schemas.js';
import type { ResourceAmounts, ResourceRegistry } from './resources.js';

type Replacement = NonNullable<PaymentSelection['replacement']>;
type Transfer = NonNullable<PaymentSelection['transfers']>[number];
type Council = NonNullable<PaymentSelection['council']>;
type Partnership = NonNullable<PaymentSelection['partnership']>;
type SurchargePayment = Surcharge & { payer: string; resource?: ResourceId };

export function budgetDeficitIds(G: CoreState, playerID?: string, hooks: readonly ExpansionHooks[] = activeHooks(G)): string[] {
  return hooks.flatMap(hook => hook.budgetDeficits?.(G, playerID) ?? []);
}

export function isPoliticalEffect(effect: EffectDescriptor): boolean {
  return ['placeOrMoveInfluence', 'formalizeInfluence', 'convertResources', 'takeMeasure', 'playMeasure', 'activateAuthorityApparatus'].includes(effect.kind);
}

// EXP-03-08-M05-04..09: one suppression fee per eligible gain, even with multiple instances.
function activeHooks(G: CoreState): ExpansionHooks[] {
  return createExpansionRegistry(G.cfg.expansions).flatMap(module => module.hooks ?? []);
}

export function greenwashingResources(G: CoreState, hooks: readonly ExpansionHooks[] = activeHooks(G)): readonly ('CLM' | 'INF')[] {
  return hooks.flatMap(hook => hook.greenwashing?.(G) ?? []);
}

function* transferChoices(
  costs: readonly Surcharge[],
  pacts: readonly string[],
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
        ...chosen, { effectId: pacts[start], costId: cost.id, playerID },
      ]);
    }
  }
}

export interface PlannedPayment {
  transfers: { playerID: string; resource: ResourceId; amount: number }[];
  consumeEffects: string[];
  useCouncil?: string;
  selection?: PaymentSelection;
}

// CORE-01-06-00-10 and EXP-03-02-D-03/-07/-08: plan only final payments for each assigned payer.
export function* paymentPlans(
  G: CoreState,
  registry: ResourceRegistry,
  effect: EffectDescriptor & { playerID: string },
  base: Partial<ResourceAmounts>,
  raw: readonly Surcharge[],
  immune: boolean,
  hooks: readonly ExpansionHooks[],
  explore = false,
  unpaidDeficits?: ReadonlySet<string>,
): Generator<PlannedPayment> {
  const original = effect.playerID;
  const selected = explore ? undefined : effect.payment ?? {};
  const greenwashing = effect.payment?.greenwashing;
  if (greenwashing && effect.kind !== 'formalizeInfluence') return;
  const resources = registry.list();
  const modifiers = immune ? [] : hooks.flatMap(hook => hook.paymentModifiers?.(G, effect) ?? []);
  const protection = modifiers.some(modifier => modifier.waiveClimateSurcharges);
  const costs = raw.filter(cost => !cost.climate || !protection);
  const pacts = modifiers.flatMap(modifier => modifier.transferSurchargeIds ?? []);
  const councils = modifiers.flatMap(modifier => modifier.councils ?? []);
  const partnerships = modifiers.flatMap(modifier => modifier.partnerships ?? []);
  const supplemental = modifiers.some(modifier => modifier.replaceSurcharge);
  const others = Object.keys(G.exp.core.players).filter(playerID => playerID !== original);
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
        !eligible.some(cost => cost.id === item.costId) || !pacts.includes(item.effectId) || !others.includes(item.playerID))) continue;
      const requested = selected?.surcharges ?? {};
      if (Object.keys(requested).some(id => !eligible.some(cost => cost.id === id))) continue;
      const units: SurchargePayment[] = eligible.map(cost => ({
        ...cost, payer: byCost.get(cost.id) ?? original, resource: Object.hasOwn(requested, cost.id) ? requested[cost.id] : undefined,
      }));

      const councilChoices: (Council | undefined)[] = selected ? [selected.council] : [
        undefined, ...councils.flatMap(instance => resources.filter(resource => resource !== instance.resource).map(resource => ({ effectId: instance.id, resource }))),
      ];
      const partnershipChoices: (Partnership | undefined)[] = selected ? [selected.partnership] : [
        undefined, ...partnerships.flatMap(instance => resources.filter(resource => resource !== instance.resource)
          .map(replacedResource => ({ effectId: instance.id, replacedResource }))),
      ];
      for (const [council, partnership] of councilChoices.flatMap(council => partnershipChoices.map(partnership => [council, partnership] as const))) {
        const councilRule = council && councils.find(instance => instance.id === council.effectId);
        const partnershipRule = partnership && partnerships.find(instance => instance.id === partnership.effectId);
        if (council && (!councilRule || council.resource === councilRule.resource || !registry.has(council.resource))) continue;
        if (partnership && (!partnershipRule || partnership.replacedResource === partnershipRule.resource
            || !registry.has(partnership.replacedResource))) continue;
        const accounts = new Map<string, ResourceAmounts>([[original, Object.assign(Object.create(null), base)]]);
        if (replacement && !unpaidDeficits?.has(replacement.costId)) {
          const cost = accounts.get(original)!;
          cost[replacement.resource] = (cost[replacement.resource] ?? 0) + 1;
        }
        // EXP-01-08-M08-04: account for one ECO substitution during the search without paying anything yet.
        if (council && councilRule) {
          const cost = accounts.get(original)!;
          cost[councilRule.resource] = (cost[councilRule.resource] ?? 0) - 1;
          cost[council.resource] = (cost[council.resource] ?? 0) + 1;
        }
        // EXP-02-08-M06-03: substitute one original Resource with SEC for a Regulation or Measure.
        if (partnership && partnershipRule) {
          const cost = accounts.get(original)!;
          cost[partnership.replacedResource] = (cost[partnership.replacedResource] ?? 0) - 1;
          cost[partnershipRule.resource] = (cost[partnershipRule.resource] ?? 0) + 1;
        }
        const affordable = (payer: string, amounts: ResourceAmounts) => Object.entries(amounts)
          .every(([resource, amount]) => registry.has(resource) && Number.isSafeInteger(amount)
            && amount <= (G.exp.core.players[payer].personal.resources[resource] ?? 0));
        if (!affordable(original, accounts.get(original)!)) continue;

        const allocate = function* (index: number, chosen: Record<string, ResourceId>): Generator<Record<string, ResourceId>> {
          if (index === units.length) {
            const cost = accounts.get(original)!;
            // CORE-01-06-00-10: a Resource created by one substitution cannot satisfy the other.
            if ((!councilRule || cost[councilRule.resource] >= 0) && (!partnership || cost[partnership.replacedResource]
              >= (council?.resource === partnership.replacedResource ? 1 : 0))) yield { ...chosen };
            return;
          }
          const unit = units[index];
          const options = unit.resources ?? resources;
          const choices = unit.resource === undefined ? options : options.includes(unit.resource) ? [unit.resource] : [];
          const amount = accounts.get(unit.payer) ?? Object.create(null) as ResourceAmounts;
          accounts.set(unit.payer, amount);
          for (const resource of choices) {
            if (!registry.has(resource)) continue;
            const before = amount[resource];
            // EXP-01-08-M06-06/-07: validate a failed attempt with only its Deficit charges unpaid.
            amount[resource] = (before ?? 0) + (unpaidDeficits?.has(unit.id) ? 0 : 1);
            if (affordable(unit.payer, amount)) {
              if (options.length > 1) chosen[unit.id] = resource;
              yield* allocate(index + 1, chosen);
              delete chosen[unit.id];
            }
            if (before === undefined) delete amount[resource];
            else amount[resource] = before;
          }
        };
        for (const surcharges of allocate(0, Object.create(null))) {
          const transfers = [...accounts].flatMap(([playerID, amounts]) => Object.entries(amounts)
            .filter(([, amount]) => amount !== 0)
            .map(([resource, amount]) => ({ playerID, resource, amount })));
          const selection: PaymentSelection = {
            ...(Object.keys(surcharges).length ? { surcharges } : {}),
            ...(replacement ? { replacement } : {}),
            ...(transfer.length ? { transfers: transfer } : {}),
            ...(council ? { council } : {}),
            ...(partnership ? { partnership } : {}),
            ...(greenwashing ? { greenwashing } : {}),
          };
          yield {
            transfers, consumeEffects: [...consumed], ...(council ? { useCouncil: council.effectId } : {}),
            ...(Object.keys(selection).length ? { selection } : {}),
          };
        }
      }
    }
  }
}
