import { createResortTiles, getControl, isPoliticalEffect, type ExpansionModule, type ProductionModifier } from '@bc/rules';

const MEASURE_DECK = [
  'ECO_M01', 'ECO_M02', 'ECO_M03', 'ECO_M04', 'ECO_M05', 'ECO_M06', 'ECO_M07', 'ECO_M08', 'ECO_M09', 'ECO_M10',
] as const;

export function exp01Economy(): ExpansionModule {
  return {
    id: 'exp01',
    measurePrefix: 'ECO_',
    registerResources: registry => registry.register('ECO'), // EXP-01-01-01
    // EXP-01-03-07: one copy of each special Tile in every player count.
    tiles: ({ addOn56 }) => [
      ...createResortTiles('ECO', { 1: addOn56 ? 3 : 2, 2: addOn56 ? 2 : 1, 3: addOn56 ? 2 : 1 }),
      { id: 'LaborMarket', kind: 'Hotspot' },
      { id: 'InvestmentProgram', kind: 'InvestmentProgram' },
    ],
    measureDeck: () => MEASURE_DECK,
    // EXP-01-05-01/-05: this controls eligibility only; Grassroots remains the ContextTile.
    conversionAlternatives: (G, playerID) => G.exp.core.tiles.board.some(placement =>
      G.exp.core.allTiles[placement.tileId]?.kind === 'InvestmentProgram' && getControl(G, placement.coord) === playerID
    ) ? [{ id: 'investmentProgram', input: 'ECO', cost: 2 }] : [],
    measureRules: {
      // EXP-01-08-M01-02..06.
      ECO_M01: { cost: { DOM: 1, ECO: 1, INF: 1 }, targetTile: (_G, _player, tile) => tile.kind === 'Hotspot', duration: 'thisRound' },
      // EXP-01-08-M02-02..05.
      ECO_M02: { cost: { ECO: 1, FOR: 1 }, targetTile: (_G, _player, tile) => tile.kind === 'ResortTile', duration: 'thisRound' },
      // EXP-01-08-M03-02..04.
      ECO_M03: { cost: { ECO: 2 }, duration: 'thisRound' },
      // EXP-01-08-M04-02..05.
      ECO_M04: { cost: { ECO: 1, DOM: 1 }, targetTile: (G, player, tile, coord) => {
        if (tile.kind !== 'ResortTile' || tile.resort !== 'ECO') return false;
        const controller = getControl(G, coord);
        return controller !== null && controller !== player;
      }, duration: 'thisRound' },
      // EXP-01-08-M05-02..05.
      ECO_M05: { cost: { ECO: 1, INF: 1 }, targetTile: (_G, _player, tile) => tile.kind === 'ResortTile', duration: 'thisRound' },
      // EXP-01-08-M06-02..07A.
      ECO_M06: { cost: { ECO: 2 }, targetPlayer: 'any', duration: 'untilConsumed' },
      // EXP-01-08-M07-02..04.
      ECO_M07: { cost: { DOM: 1, ECO: 2 }, duration: 'nextRound' },
      // EXP-01-08-M08-02..05.
      ECO_M08: { cost: { ECO: 3 }, duration: 'thisRound' },
      // EXP-01-08-M09-02..07.
      ECO_M09: { cost: { ECO: 2, INF: 1 }, targetPlayer: 'opponent', duration: 'thisRound' },
      // EXP-01-08-M10-02..08.
      ECO_M10: { cost: { ECO: 1 }, duration: 'thisTurn' },
    },
    hooks: {
      // EXP-01-08-M06-05..07A: consume only the targeted player's pending Deficits.
      budgetDeficits: (G, playerID) => G.exp.core.activeMeasureEffects?.filter(instance =>
        instance.sourceCardId === 'ECO_M06' && (playerID === undefined || instance.targetPlayerID === playerID))
        .map(instance => instance.id) ?? [],
      // EXP-01-08-M08-04/-05 and EXP-01-08-M10-04..07.
      paymentModifiers: (G, effect) => {
        const owned = G.exp.core.activeMeasureEffects?.filter(instance => instance.owner === effect.playerID) ?? [];
        return {
          councils: owned.filter(instance => instance.sourceCardId === 'ECO_M08' && !instance.used)
            .map(instance => ({ id: instance.id, resource: 'ECO' })),
          replaceSurcharge: isPoliticalEffect(effect) && owned.some(instance => instance.sourceCardId === 'ECO_M10'),
        };
      },
      // EXP-01-08-M09-05/-06: only current sole control by the target suppresses Measure modifiers.
      suppressMeasureProduction: (G, coord) => {
        const freezes = G.exp.core.activeMeasureEffects?.filter(effect => effect.sourceCardId === 'ECO_M09');
        const controller = freezes?.length ? getControl(G, coord) : null;
        return controller !== null && Boolean(freezes?.some(effect => effect.targetPlayerID === controller));
      },
      // EXP-01-08-M06-05: one unrestricted surcharge on the targeted player's next Political Action.
      surcharges: ({ G, effect }) => isPoliticalEffect(effect) && 'playerID' in effect
        ? G.exp.core.activeMeasureEffects?.flatMap(instance => instance.sourceCardId === 'ECO_M06' && instance.targetPlayerID === effect.playerID
          ? [{ id: instance.id, source: 'measure' as const }] : [])
        : undefined,
      prohibitions: ({ G, effect }) => {
        if (effect.kind === 'convertResources') {
          // EXP-01-08-M03-04 and EXP-01-08-M07-04.
          return Boolean(G.exp.core.activeMeasureEffects?.some(instance =>
            (instance.sourceCardId === 'ECO_M03' && effect.input === 'ECO')
            || (instance.sourceCardId === 'ECO_M07' && !instance.waitingForRound)));
        }
        if (effect.kind !== 'resolveHotspotAt') return false;
        // EXP-01-08-M01-05/-06: consume the enclosure without awarding its outcome.
        const hotspot = G.exp.core.tiles.board.find(({ coord }) => coord.q === effect.coord.q && coord.r === effect.coord.r);
        return Boolean(hotspot && G.exp.core.activeMeasureEffects?.some(instance =>
          instance.sourceCardId === 'ECO_M01' && instance.targetTileId === hotspot.tileId));
      },
      productionModifiers: ({ G, tile }) => G.exp.core.activeMeasureEffects?.flatMap<ProductionModifier>(instance => {
        if (instance.targetTileId !== tile.id) return [];
        // EXP-01-08-M02-05, EXP-01-08-M04-05 and EXP-01-08-M05-05.
        if (instance.sourceCardId === 'ECO_M02') return [{ source: 'measure', kind: 'double' }];
        if (instance.sourceCardId === 'ECO_M04' || instance.sourceCardId === 'ECO_M05') {
          return [{ source: 'measure', kind: 'additive', delta: -1 }];
        }
        return [];
      }),
    },
  };
}
