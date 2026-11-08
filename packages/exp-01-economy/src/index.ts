import { createResortTiles, getControl, type ExpansionModule } from '@bc/rules';

const MEASURE_DECK = [
  'ECO_M01', 'ECO_M02', 'ECO_M03', 'ECO_M04', 'ECO_M05', 'ECO_M06', 'ECO_M07', 'ECO_M08', 'ECO_M09', 'ECO_M10',
] as const;

export function exp01Economy(): ExpansionModule {
  return {
    id: 'exp01',
    registerResources: registry => registry.register('ECO'), // EXP-01-01-01
    setupExpansionState: () => {},
    // EXP-01-03-07: one copy of each special Tile in every player count.
    tiles: ({ addOn56 }) => [
      ...createResortTiles('ECO', { 1: addOn56 ? 3 : 2, 2: addOn56 ? 2 : 1, 3: addOn56 ? 2 : 1 }),
      { id: 'LaborMarket', kind: 'Hotspot' },
      { id: 'InvestmentProgram', kind: 'InvestmentProgram' },
    ],
    measureDeck: () => MEASURE_DECK,
    // EXP-01-05-01/-05: this controls eligibility only; Grassroots remains the ContextTile.
    conversionAlternatives: (G, playerID) => G.tiles.board.some(placement =>
      G.allTiles[placement.tileId]?.kind === 'InvestmentProgram' && getControl(G, placement.coord) === playerID
    ) ? [{ id: 'investmentProgram', input: 'ECO', cost: 2 }] : [],
    measureRules: {
      // EXP-01-08-M03-02..04.
      ECO_M03: { cost: { ECO: 2 }, continuingEffect: 'ECO_M03' },
      // EXP-01-08-M09-02..07.
      ECO_M09: { cost: { ECO: 2, INF: 1 }, targetPlayer: 'opponent', continuingEffect: 'ECO_M09' },
    },
    hooks: {
      // EXP-01-08-M03-04: the restriction applies to all ECO conversions in this round.
      prohibitions: ({ G, effect }) => effect.kind === 'convertResources' && effect.input === 'ECO'
        && Boolean(G.activeMeasureEffects?.some(instance => instance.sourceCardId === 'ECO_M03')),
    },
  };
}
