import type { ExpansionModule } from '@bc/rules';
import { ensureExpansionSlice, type MoveDefinition, type MoveExtensionBuilder, type CoreState } from '@bc/rules';
import { z } from '@bc/rules';

const PayloadSchema = z.object({}).strict();

export function exp01Economy(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: (registry) => {
      registry.register('ECO'); // AGENTS 1.6 — expansion adds resource type
    },
    setupExpansionState: (G) => {
      type Exp01State = { sentinel: boolean };
      ensureExpansionSlice<Exp01State>(G, 'exp01', { sentinel: false });
    },
    extendMoves: ({ add }: MoveExtensionBuilder) => {
      const def: MoveDefinition<unknown> = {
        type: 'exp01_noop',
        payloadSchema: PayloadSchema,
        execute: (G: CoreState) => {
          const s = (G.exp as { exp01?: { sentinel: boolean } } | undefined)?.exp01;
          if (s) s.sentinel = !s.sentinel;
        },
      } as unknown as MoveDefinition<unknown>;
      add(def);
    },
  };
}