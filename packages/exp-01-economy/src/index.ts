import type { ExpansionModule } from '@bc/rules';
import { ensureExpansionSlice, type MoveDefinition, type MoveExtensionBuilder, type CoreState, createExpansionRegistry, createResolver } from '@bc/rules';
import { z } from '@bc/rules';

const NoopPayload = z.object({}).strict();
const TakePayload = z.object({ measureId: z.string().min(1) }).strict();
const PlayPayload = z.object({ measureId: z.string().min(1) }).strict();

const MEASURE_DECK = [
  'ECO_M01','ECO_M02','ECO_M03','ECO_M04','ECO_M05','ECO_M06','ECO_M07','ECO_M08'
] as const;

type Exp01Slice = { sentinel?: boolean; measures?: import('@bc/rules').Exp01MeasuresState };

export function exp01Economy(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: (registry) => {
      registry.register('ECO'); // AGENTS 1.6 — expansion adds resource type
    },
    setupExpansionState: (G) => {
      const slice = ensureExpansionSlice<Exp01Slice>(G, 'exp01', { sentinel: false });
      // Initialize measures via resolver to obey AGENTS §3.5
      const mods = createExpansionRegistry(G.cfg.expansions);
      const resolve = createResolver(mods);
      resolve(G, { kind: 'initMeasures', expansion: 'exp01', deck: [...MEASURE_DECK], openCount: 3 });
      slice.sentinel = !!slice.sentinel; // keep sentinel present
    },
    extendMoves: ({ add }: MoveExtensionBuilder) => {
      const noop: MoveDefinition<unknown> = {
        type: 'exp01_noop',
        payloadSchema: NoopPayload,
        execute: (G: CoreState, _playerID: string) => {
          const s = (G.exp as { exp01?: { sentinel?: boolean } } | undefined)?.exp01;
          if (s) s.sentinel = !s.sentinel;
        },
      } as unknown as MoveDefinition<unknown>;
      add(noop);

      const take: MoveDefinition<{ measureId: string }> = {
        type: 'exp01_takeMeasure',
        payloadSchema: TakePayload,
        execute: (G: CoreState, playerID: string, payload: { measureId: string }) => {
          const resolve = createResolver(createExpansionRegistry(G.cfg.expansions));
          resolve(G, { kind: 'takeMeasure', expansion: 'exp01', playerID, measureId: payload.measureId });
        },
      } as unknown as MoveDefinition<unknown>;
      add(take);

      const play: MoveDefinition<{ measureId: string }> = {
        type: 'exp01_playMeasure',
        payloadSchema: PlayPayload,
        execute: (G: CoreState, playerID: string, payload: { measureId: string }) => {
          const resolve = createResolver(createExpansionRegistry(G.cfg.expansions));
          resolve(G, { kind: 'playMeasure', expansion: 'exp01', playerID, measureId: payload.measureId });
        },
      } as unknown as MoveDefinition<unknown>;
      add(play);
    },
  };
}