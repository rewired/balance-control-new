import { createResortTiles, isPoliticalEffect, type CoreState, type ExpansionModule } from '@bc/rules';

// EXP-03-08-M05-04..09: offer one fixed replacement per eligible gain, regardless of active copies.
function greenwashingPayments(G: CoreState) {
  if (!G.exp.core.activeMeasureEffects?.some(instance => instance.sourceCardId === 'CLM_M05')) return [];
  return (['CLM', 'INF'] as const).map(resource => ({ resource, cost: { [resource]: 1 } }));
}

export function exp03Climate(): ExpansionModule {
  return {
    id: 'exp03',
    measurePrefix: 'CLM_',
    canRegisterMeasure: (G, instance) => instance.sourceCardId !== 'CLM_M11' || G.cfg.expansions.exp01, // EXP-03-03-02A
    registerResources: registry => registry.register('CLM'), // EXP-03-01-01
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
      CLM_M02: { cost: { CLM: 2 }, targetResort: (G, resort) =>
        !G.exp.core.activeMeasureEffects?.some(instance => instance.sourceCardId === 'CLM_M02' && instance.targetResort === resort),
      duration: 'throughNextRound' },
      // EXP-03-08-M03-02..05.
      CLM_M03: {
        cost: { CLM: 2 }, targetTile: (_G, _player, tile) => tile.kind === 'ResortTile',
        resourceOutputs: (G, playerID, placement) => {
          const tile = placement && G.exp.core.allTiles[placement.tileId];
          return tile?.kind === 'ResortTile' && placement
            ? [{ kind: 'addResources', playerID, resource: tile.resort, amount: 1, contextCoord: placement.coord }]
            : [];
        },
      },
      // EXP-03-08-M04-02..05.
      CLM_M04: { cost: { CLM: 2 }, targetPlayer: () => true, duration: 'targetNextTurn' },
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
      CLM_M11: { cost: { CLM: 1, ECO: 1 }, targetPlayer: () => true, duration: 'ownerNextTurn' },
      // EXP-03-08-M12-02..06 and EXP-03-08-M13-02..10.
      CLM_M12: { cost: { CLM: 1 }, duration: 'ownerNextTurn' },
      CLM_M13: { cost: { CLM: 1, DOM: 1 }, duration: 'untilConsumed' },
    },
    hooks: {
      // EXP-03-08-M05-04/-09: only formalization outside the immune Start Committee.
      fixedPaymentOptions: ({ G, effect }) => effect.kind === 'formalizeInfluence'
        ? greenwashingPayments(G).map(({ resource, cost }) => ({ selection: { greenwashing: resource }, cost }))
        : undefined,
      // EXP-03-08-M05-04..09: charge the Hotspot recipient only for normal Influence payouts.
      hotspotInfluencePayment: (G, effect) => {
        const placement = G.exp.core.tiles.board.find(({ coord }) => coord.q === effect.coord.q && coord.r === effect.coord.r);
        const tile = placement && G.exp.core.allTiles[placement.tileId];
        if (tile?.kind !== 'Hotspot' || tile.hotspotOutcome !== undefined) return;
        const options = greenwashingPayments(G).map(({ resource, cost }) => ({ choice: { kind: 'greenwashing' as const, resource }, cost }));
        if (options.length) return { outcome: 'greenwashing', options };
      },
      // EXP-03-08-M08/-M09/-M10 and -M13: assess protection on the original payer before transferring surcharges.
      paymentRules: (G, effect) => {
        const effects = G.exp.core.activeMeasureEffects ?? [];
        const protectedPayer = effects.some(instance => instance.sourceCardId === 'CLM_M08'
          || (instance.owner === effect.playerID && (instance.sourceCardId === 'CLM_M10'
            || (instance.sourceCardId === 'CLM_M09' && isPoliticalEffect(effect) && effect.kind !== 'playMeasure'))));
        const playerIDs = Object.keys(G.exp.core.players).filter(playerID => playerID !== effect.playerID);
        return {
          waive: protectedPayer ? cost => cost.origin === 'exp03' : undefined,
          transfers: effects.filter(instance => instance.owner === effect.playerID && instance.sourceCardId === 'CLM_M13')
            .map(instance => ({ effectId: instance.id, playerIDs, consumeOnCommit: instance.id })),
        };
      },
      // EXP-03-08-M11-05..09: cap each applicable receipt after the regular split.
      productionReceiptLimit: (G, playerID) => G.cfg.expansions.exp01 && G.exp.core.activeMeasureEffects?.some(instance =>
        instance.sourceCardId === 'CLM_M11' && instance.targetPlayerID === playerID) ? 1 : undefined,
      prohibitions: ({ G, effect }) => {
        if (effect.kind === 'playMeasure') {
          // EXP-03-08-M04-05.
          return Boolean(G.exp.core.activeMeasureEffects?.some(instance =>
            instance.sourceCardId === 'CLM_M04' && instance.targetPlayerID === effect.playerID && !instance.waitingForTurn));
        }
        if (effect.kind !== 'resolveHotspotAt') return false;
        // EXP-03-08-M07-04..06: the Inner Order outcome is not an Influence gain.
        const placement = G.exp.core.tiles.board.find(({ coord }) => coord.q === effect.coord.q && coord.r === effect.coord.r);
        const tile = placement && G.exp.core.allTiles[placement.tileId];
        return tile?.kind === 'Hotspot' && tile.hotspotOutcome === undefined
          && Boolean(G.exp.core.activeMeasureEffects?.some(instance => instance.sourceCardId === 'CLM_M07'));
      },
      surcharges: ({ G, effect }) => {
        const ctx = effect.contextCoord;
        const placement = ctx && G.exp.core.tiles.board.find(({ coord }) => coord.q === ctx.q && coord.r === ctx.r);
        const contextTile = placement && G.exp.core.allTiles[placement.tileId];
        const placingResort = effect.kind === 'placeTile' && G.exp.core.allTiles[effect.tileId]?.kind === 'ResortTile';
        return G.exp.core.activeMeasureEffects?.flatMap(instance => {
          // EXP-03-02-D-03 and EXP-03-08-M01/-M02/-M06/-M12: origin is independent of resort chosen for payment.
          if (instance.sourceCardId === 'CLM_M06' && effect.kind === 'convertResources') {
            return [{ id: instance.id, source: 'measure' as const, resources: ['DOM'], origin: 'exp03' as const }];
          }
          if ((instance.sourceCardId === 'CLM_M01' && instance.targetTileId === contextTile?.id)
              || (instance.sourceCardId === 'CLM_M02' && contextTile?.kind === 'ResortTile' && instance.targetResort === contextTile.resort)
              || (instance.sourceCardId === 'CLM_M12' && placingResort)) {
            return [{ id: instance.id, source: 'measure' as const, resources: ['CLM', 'DOM'], origin: 'exp03' as const }];
          }
          return [];
        });
      },
    },
  };
}
