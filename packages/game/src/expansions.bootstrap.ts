import type { ExpansionModule } from '@bc/rules';
import { registerExpansion, ensureExpansionSlice } from '@bc/rules';

function makeStub(id: 'exp01'|'exp02'|'exp03'): ExpansionModule {
  return {
    id,
    registerResources: () => void 0,
    setupExpansionState: (G, ctx) => {
      void ctx;
      const slice = ensureExpansionSlice(G, id, {} as Record<string, unknown>);
      slice.__boot = true;
    },
    extendMoves: () => void 0,
  };
}

const exp01 = makeStub('exp01');
const exp02 = makeStub('exp02');
const exp03 = makeStub('exp03');

// Idempotent registration (registry dedupes by id)
registerExpansion(exp01);
registerExpansion(exp02);
registerExpansion(exp03);

export const BOOTSTRAPPED_MODULE_IDS = ['exp01','exp02','exp03'] as const;


