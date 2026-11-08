import type { ExpansionModule } from '@bc/rules';
import { type MoveDefinition, type MoveExtensionBuilder, type CoreState, createExpansionRegistry, createResolver } from '@bc/rules';
import { z } from '@bc/rules';

const TakePayload = z.object({ measureId: z.string().min(1) }).strict();
const PlayPayload = z.object({ measureId: z.string().min(1) }).strict();

const MEASURE_DECK = [
  'ECO_M01','ECO_M02','ECO_M03','ECO_M04','ECO_M05','ECO_M06','ECO_M07','ECO_M08'
] as const;

export function exp01Economy(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: (registry) => {
      registry.register('ECO'); // AGENTS 1.6 â€” expansion adds resource type
    },
    setupExpansionState: (G) => {
      // Initialize measures via resolver to obey AGENTS Â§3.5
      const mods = createExpansionRegistry(G.cfg.expansions);
      const resolve = createResolver(mods);
      resolve(G, { kind: 'initMeasures', expansion: 'exp01', deck: [...MEASURE_DECK], openCount: 3 });
    },
    extendMoves: ({ add }: MoveExtensionBuilder) => {
      const take: MoveDefinition<{ measureId: string }> = {
        type: 'exp01_takeMeasure',
        payloadSchema: TakePayload,
        execute: (G: CoreState, playerID: string, payload: { measureId: string }) => {
          const resolve = createResolver(createExpansionRegistry(G.cfg.expansions));
          return resolve(G, { kind: 'takeMeasure', expansion: 'exp01', playerID, measureId: payload.measureId });
        },
        enumerate: (G: CoreState, playerID: string) => {
          const m = (G.exp as NonNullable<import('@bc/rules').CoreState['exp']> | undefined)?.exp01?.measures as import('@bc/rules').Exp01MeasuresState | undefined;
          if (!m) return [];
          if ((m.hands[playerID] ?? []).length >= 2) return [];
          return m.open.map((id) => ({ measureId: id }));
        },
      };
      add(take);

      const play: MoveDefinition<{ measureId: string }> = {
        type: 'exp01_playMeasure',
        isPlayMeasure: true,
        payloadSchema: PlayPayload,
        execute: (G: CoreState, playerID: string, payload: { measureId: string }) => {
          const resolve = createResolver(createExpansionRegistry(G.cfg.expansions));
          return resolve(G, { kind: 'playMeasure', expansion: 'exp01', playerID, measureId: payload.measureId });
        },
        enumerate: (G: CoreState, playerID: string) => {
          const m = (G.exp as NonNullable<import('@bc/rules').CoreState['exp']> | undefined)?.exp01?.measures as import('@bc/rules').Exp01MeasuresState | undefined;
          if (!m) return [];
          if (m.usedThisRound[playerID]) return [];
          const hand = m.hands[playerID] ?? [];
          return hand.map((id) => ({ measureId: id }));
        },
      };
      add(play);
    },
  };
}
