import type { ExpansionModule } from '@bc/rules';

export function exp02Security(): ExpansionModule {
  return {
    id: 'exp02',
    // EXP-02-01-01 and EXP-02-03-01..04.
    registerResources: registry => registry.register('SEC'),
    setupExpansionState: () => {},
    tiles: () => [
      { id: 'InnerOrder', kind: 'Hotspot', hotspotOutcome: 'regulation' },
      { id: 'AuthorityApparatus', kind: 'AuthorityApparatus' },
    ],
    measureDeck: () => Array.from({ length: 15 }, (_, index) => `SEC_M${String(index + 1).padStart(2, '0')}`),
    measureRules: {},
  };
}
