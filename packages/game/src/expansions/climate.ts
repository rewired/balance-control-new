import { createResortTiles, type ExpansionModule } from '@bc/rules';

export function exp03Climate(): ExpansionModule {
  return {
    id: 'exp03',
    registerResources: registry => registry.register('CLM'), // EXP-03-01-01
    setupExpansionState: () => {},
    // EXP-03-02-A-02A and EXP-03-03-04: the extra ResortTiles are already included in these totals.
    tiles: ({ addOn56 }) => [
      ...createResortTiles('CLM', { 1: addOn56 ? 3 : 2, 2: addOn56 ? 3 : 2 }),
      { id: 'Transformationsdruck', kind: 'Hotspot' },
    ],
    // EXP-03-03-02A..02D: the reserved cards never enter this deck.
    measureDeck: ({ expansions }) => Array.from({ length: 13 }, (_, index) => index + 1)
      .filter(number => expansions.exp01 || ![6, 9, 11].includes(number))
      .map(number => `CLM_M${String(number).padStart(2, '0')}`),
    measureRules: {
      // EXP-03-08-M11-02..09.
      CLM_M11: { cost: { CLM: 1, ECO: 1 }, targetPlayer: 'any', continuingEffect: 'CLM_M11' },
    },
  };
}
