import type { ExpansionModule } from '@bc/rules';

const MEASURE_DECK = [
  'ECO_M01', 'ECO_M02', 'ECO_M03', 'ECO_M04', 'ECO_M05', 'ECO_M06', 'ECO_M07', 'ECO_M08',
] as const;

export function exp01Economy(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: registry => registry.register('ECO'), // EXP-01-02-A-01
    setupExpansionState: () => {},
    measureDeck: () => MEASURE_DECK,
  };
}
