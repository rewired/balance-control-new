import type { CoreState, ResourceId } from './types.js';
import type { EffectDescriptor } from './effects.js';
import type { ExpansionHooks, FixedPaymentOption, PaymentRules, PaymentSubstitutionGroup, Surcharge } from './expansion-registry.js';
import { FixedPaymentSelectionSchema, SubstitutionSelectionSchema, type PaymentSelection } from './schemas.js';
import type { ResourceAmounts, ResourceRegistry } from './resources.js';

type Transfer = NonNullable<PaymentSelection['transfers']>[number];
type SurchargePayment = Surcharge & { payer: string; resource?: ResourceId };

export function isPoliticalEffect(effect: EffectDescriptor): boolean {
  return effect.political === true || ['placeOrMoveInfluence', 'recallInfluence', 'formalizeInfluence', 'convertResources', 'takeMeasure', 'playMeasure'].includes(effect.kind);
}

function* transferChoices(
  costs: readonly Surcharge[],
  rules: NonNullable<PaymentRules['transfers']>,
  start = 0,
  chosen: Transfer[] = [],
): Generator<Transfer[]> {
  if (start === rules.length) {
    yield chosen;
    return;
  }
  yield* transferChoices(costs, rules, start + 1, chosen);
  for (const cost of costs) {
    if (chosen.some(transfer => transfer.costId === cost.id)) continue;
    for (const playerID of rules[start].playerIDs) {
      yield* transferChoices(costs, rules, start + 1, [
        ...chosen, { effectId: rules[start].effectId, costId: cost.id, playerID },
      ]);
    }
  }
}

type Substitution = PaymentSubstitutionGroup['options'][number] & { key: PaymentSubstitutionGroup['key'] };

function* substitutionChoices(
  groups: readonly PaymentSubstitutionGroup[],
  requested?: PaymentSelection,
  keys = Object.keys(SubstitutionSelectionSchema.shape) as Substitution['key'][],
  chosen: Substitution[] = [],
): Generator<Substitution[]> {
  const [key, ...rest] = keys;
  if (!key) {
    yield chosen;
    return;
  }
  const selection = requested?.[key];
  if (!selection) yield* substitutionChoices(groups, requested, rest, chosen);
  if (requested && !selection) return;
  for (const group of groups) {
    if (group.key !== key) continue;
    for (const option of group.options) {
      if (selection && (Object.keys(selection).length !== Object.keys(option.choice).length ||
        !Object.entries(option.choice).every(([field, value]) => Object.entries(selection)
          .some(([name, selected]) => name === field && selected === value)))) continue;
      yield* substitutionChoices(groups, requested, rest, [...chosen, { key, ...option }]);
    }
  }
}

export interface PlannedPayment {
  transfers: { playerID: string; resource: ResourceId; amount: number }[];
  consumeEffects: string[];
  markUsed: string[];
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
  ignoredSurcharges?: ReadonlySet<string>,
): Generator<PlannedPayment> {
  const fixed = immune ? [] : hooks.flatMap(hook => hook.fixedPaymentOptions?.({ G, effect }) ?? []);
  const parsed = FixedPaymentSelectionSchema.safeParse(effect.payment ?? {});
  if (!parsed.success) return;
  const requested = Object.entries(parsed.data).filter(([, value]) => value !== undefined);
  if (!fixed.length) {
    if (!requested.length) yield* surchargePlans(G, registry, effect, base, raw, immune, hooks, explore, ignoredSurcharges);
    return;
  }
  for (const option of fixed) {
    if ((!explore || requested.length > 0)
        && (requested.length !== Object.keys(option.selection).length
          || !requested.every(([key, value]) => option.selection[key as keyof FixedPaymentOption['selection']] === value))) continue;
    yield* surchargePlans(G, registry, effect, base, raw, immune, hooks, explore, ignoredSurcharges, option);
  }
}

function* surchargePlans(
  G: CoreState,
  registry: ResourceRegistry,
  effect: EffectDescriptor & { playerID: string },
  base: Partial<ResourceAmounts>,
  raw: readonly Surcharge[],
  immune: boolean,
  hooks: readonly ExpansionHooks[],
  explore: boolean,
  ignoredSurcharges?: ReadonlySet<string>,
  fixed?: FixedPaymentOption,
): Generator<PlannedPayment> {
  const original = effect.playerID;
  const selected = explore ? undefined : effect.payment ?? {};
  const resources = registry.list();
  const rules = immune ? [] : hooks.flatMap(hook => hook.paymentRules?.(G, effect, resources) ?? []);
  // EXP-03-02-D-08: waive first, then replace, assign payers and apply substitutions.
  const costs = raw.filter(cost => !rules.some(rule => rule.waive?.(cost)));
  const reassignments = rules.flatMap(rule => rule.transfers ?? []);
  const substitutions = rules.flatMap(rule => rule.substitutions ?? []);
  const offeredReplacements = costs.flatMap(cost => rules.flatMap(rule =>
    rule.replacements?.(cost).map(option => ({ costId: cost.id, ...option })) ?? []));
  const requestedReplacement = selected?.replacement;
  const replacements = selected ? requestedReplacement ? offeredReplacements.filter(option =>
    option.costId === requestedReplacement.costId && option.resource === requestedReplacement.resource) : [undefined]
    : [undefined, ...offeredReplacements];

  for (const replacement of replacements) {
    const eligible = costs.filter(cost => cost.id !== replacement?.costId);
    for (const transfer of selected ? [selected.transfers ?? []] : transferChoices(eligible, reassignments)) {
      const byCost = new Map(transfer.map(item => [item.costId, item.playerID]));
      const applied = transfer.map(item => eligible.some(cost => cost.id === item.costId)
        ? reassignments.find(rule => rule.effectId === item.effectId && rule.playerIDs.includes(item.playerID)) : undefined);
      if (byCost.size !== transfer.length || new Set(transfer.map(item => item.effectId)).size !== transfer.length
          || applied.some(rule => rule === undefined)) continue;
      const consumed = applied.flatMap(rule => rule?.consumeOnCommit ?? []);
      const requested = selected?.surcharges ?? {};
      if (Object.keys(requested).some(id => !eligible.some(cost => cost.id === id))) continue;
      const units: SurchargePayment[] = eligible.map(cost => ({
        ...cost, payer: byCost.get(cost.id) ?? original, resource: Object.hasOwn(requested, cost.id) ? requested[cost.id] : undefined,
      }));

      for (const changes of substitutionChoices(substitutions, selected)) {
        const accounts = new Map<string, ResourceAmounts>([[original, Object.assign(Object.create(null), base)]]);
        const cost = accounts.get(original)!;
        if (replacement && !ignoredSurcharges?.has(replacement.costId)) {
          cost[replacement.resource] = (cost[replacement.resource] ?? 0) + replacement.amount;
        }
        const produced = new Map<ResourceId, number>();
        for (const { from, to } of changes) {
          cost[from] = (cost[from] ?? 0) - 1;
          cost[to] = (cost[to] ?? 0) + 1;
          produced.set(to, (produced.get(to) ?? 0) + 1);
        }
        const affordable = (payer: string, amounts: ResourceAmounts) => Object.entries(amounts)
          .every(([resource, amount]) => registry.has(resource) && Number.isSafeInteger(amount)
            && amount <= (G.exp.core.players[payer].personal.resources[resource] ?? 0));
        if (!affordable(original, accounts.get(original)!)) continue;

        const allocate = function* (index: number, chosen: Record<string, ResourceId>): Generator<Record<string, ResourceId>> {
          if (index === units.length) {
            // CORE-01-06-00-10: a Resource created by one substitution cannot satisfy the other.
            if (changes.every(({ from }) => cost[from] >= (produced.get(from) ?? 0))) yield { ...chosen };
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
            amount[resource] = (before ?? 0) + (ignoredSurcharges?.has(unit.id) ? 0 : 1);
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
          // EXP-03-02-D-03/-08: fixed payments are separate from surcharge waivers, replacements and transfers.
          let amountsByPayer = accounts;
          if (fixed) {
            const originalCost: ResourceAmounts = Object.assign(Object.create(null), accounts.get(original));
            for (const [resource, amount] of Object.entries(fixed.cost)) {
              originalCost[resource] = (originalCost[resource] ?? 0) + amount;
            }
            if (!affordable(original, originalCost)) continue;
            amountsByPayer = new Map(accounts).set(original, originalCost);
          }
          const transfers = [...amountsByPayer].flatMap(([playerID, amounts]) => Object.entries(amounts)
            .filter(([, amount]) => amount !== 0)
            .map(([resource, amount]) => ({ playerID, resource, amount })));
          const selection: PaymentSelection = {
            ...(Object.keys(surcharges).length ? { surcharges } : {}),
            ...(replacement ? { replacement: { costId: replacement.costId, resource: replacement.resource } } : {}),
            ...(transfer.length ? { transfers: transfer } : {}),
            ...Object.fromEntries(changes.map(({ key, choice }) => [key, choice])),
            ...fixed?.selection,
          };
          yield {
            transfers, consumeEffects: consumed, markUsed: changes.flatMap(({ markUsed }) => markUsed ?? []),
            ...(Object.keys(selection).length ? { selection } : {}),
          };
        }
      }
    }
  }
}
