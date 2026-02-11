import type { ExpansionModule } from '@bc/rules';
import { registerExpansion } from '@bc/rules';

function makeStub(id: 'exp01'|'exp02'|'exp03'): ExpansionModule {
  return {
    id,
    registerResources: () => void 0,
    setupExpansionState: (G, ctx) => {
      void ctx;
      if (!G.exp) return; // state slice created only when enabled
      const k = id as 'exp01'|'exp02'|'exp03';
      const slices = G.exp as unknown as Record<string, unknown>;
      if (slices[k]) {
        slices[k] = { ...(slices[k] as Record<string, unknown>), __boot: true };
      }
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
