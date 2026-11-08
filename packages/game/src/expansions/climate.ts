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
      // EXP-03-08-M01-02..06.
      CLM_M01: { cost: { CLM: 2 }, targetTile: (_G, _player, tile) => tile.kind === 'ResortTile', duration: 'ownerNextTurn' },
      // EXP-03-08-M02-02..08.
      CLM_M02: { cost: { CLM: 2 }, targetResort: 'unique', duration: 'throughNextRound' },
      // EXP-03-08-M03-02..05.
      CLM_M03: { cost: { CLM: 2 }, targetTile: (_G, _player, tile) => tile.kind === 'ResortTile', gainTargetResort: true },
      // EXP-03-08-M04-02..05.
      CLM_M04: { cost: { CLM: 2 }, targetPlayer: 'any', duration: 'targetNextTurn' },
      // EXP-03-08-M05-02..09.
      CLM_M05: { cost: { CLM: 1, INF: 1 }, duration: 'ownerNextTurn' },
      // EXP-03-08-M06-02..05.
      CLM_M06: { cost: { CLM: 1, ECO: 1 }, duration: 'ownerNextTurn' },
      // EXP-03-08-M07-02..06.
      CLM_M07: { cost: { CLM: 1 }, duration: 'ownerNextTurn' },
      // EXP-03-08-M08-02..05.
      CLM_M08: { cost: { CLM: 2 }, duration: 'ownerNextTurn' },
      // EXP-03-08-M09-02..06.
      CLM_M09: { cost: { CLM: 1, ECO: 1, DOM: 1 }, duration: 'thisTurn' },
      // EXP-03-08-M10-02..05.
      CLM_M10: { cost: { CLM: 1, DOM: 1, FOR: 1 }, duration: 'ownerNextTurn' },
      // EXP-03-08-M11-02..09.
      CLM_M11: { cost: { CLM: 1, ECO: 1 }, targetPlayer: 'any', duration: 'ownerNextTurn' },
      // EXP-03-08-M12-02..06 and EXP-03-08-M13-02..10.
      CLM_M12: { cost: { CLM: 1 }, duration: 'ownerNextTurn' },
      CLM_M13: { cost: { CLM: 1, DOM: 1 }, duration: 'untilConsumed' },
    },
    hooks: {
      prohibitions: ({ G, effect }) => {
        if (effect.kind === 'playMeasure') {
          // EXP-03-08-M04-05.
          return Boolean(G.activeMeasureEffects?.some(instance =>
            instance.sourceCardId === 'CLM_M04' && instance.targetPlayerID === effect.playerID && !instance.waitingForTurn));
        }
        if (effect.kind !== 'resolveHotspotAt') return false;
        // EXP-03-08-M07-04..06: the Inner Order outcome is not an Influence gain.
        const placement = G.tiles.board.find(({ coord }) => coord.q === effect.coord.q && coord.r === effect.coord.r);
        const tile = placement && G.allTiles[placement.tileId];
        return tile?.kind === 'Hotspot' && tile.hotspotOutcome !== 'regulation'
          && Boolean(G.activeMeasureEffects?.some(instance => instance.sourceCardId === 'CLM_M07'));
      },
      surcharges: ({ G, effect }) => {
        const ctx = effect.contextCoord;
        const placement = ctx && G.tiles.board.find(({ coord }) => coord.q === ctx.q && coord.r === ctx.r);
        const contextTile = placement && G.allTiles[placement.tileId];
        const placingResort = effect.kind === 'placeTile' && G.allTiles[effect.tileId]?.kind === 'ResortTile';
        return G.activeMeasureEffects?.flatMap(instance => {
          // EXP-03-02-D-03 and EXP-03-08-M01/-M02/-M06/-M12: origin is independent of resort chosen for payment.
          if (instance.sourceCardId === 'CLM_M06' && effect.kind === 'convertResources') {
            return [{ id: instance.id, source: 'measure' as const, resources: ['DOM'], climate: true as const }];
          }
          if ((instance.sourceCardId === 'CLM_M01' && instance.targetTileId === contextTile?.id)
              || (instance.sourceCardId === 'CLM_M02' && contextTile?.kind === 'ResortTile' && instance.targetResort === contextTile.resort)
              || (instance.sourceCardId === 'CLM_M12' && placingResort)) {
            return [{ id: instance.id, source: 'measure' as const, resources: ['CLM', 'DOM'], climate: true as const }];
          }
          return [];
        });
      },
    },
  };
}
