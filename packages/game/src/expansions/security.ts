import {
  createResolver, isFullySurrounded, PaymentSelectionSchema, regulationOperations, RegulationOperationSchema, z,
  type AxialCoord, type BoardRegulation, type CoreState, type EffectDescriptor, type ExpansionModule, type Surcharge,
} from '@bc/rules';

function attachedAt(G: CoreState, context?: AxialCoord): BoardRegulation[] {
  const tile = context && G.tiles.board.find(({ coord }) => coord.q === context.q && coord.r === context.r);
  return tile ? G.exp?.exp02?.regulations?.attached.filter(regulation => regulation.tileId === tile.tileId) ?? [] : [];
}

function instances(G: CoreState, regulation: BoardRegulation): number {
  // EXP-02-08-M14-03: one selected Regulation counts twice on its selected tile.
  return G.activeMeasureEffects?.some(effect => effect.sourceCardId === 'SEC_M14'
    && effect.targetRegulationId === regulation.id && effect.targetTileId === regulation.tileId) ? 2 : 1;
}

function reducible(effect: EffectDescriptor): boolean {
  // EXP-02-02-B-02A/-02B: reduce only specified Resource and Influence gains.
  return effect.kind === 'convertResources' || effect.kind === 'formalizeInfluence'
    || effect.kind === 'addResources' || effect.kind === 'resolveHotspotAt'
    || (effect.kind === 'playMeasure' && effect.measureId === 'CLM_M03');
}

const AuthorityPayload = z.object({ regulation: RegulationOperationSchema, payment: PaymentSelectionSchema.optional() }).strict();

export function exp02Security(): ExpansionModule {
  return {
    id: 'exp02',
    // EXP-02-01-01 and EXP-02-03-01..04.
    registerResources: registry => registry.register('SEC'),
    setupExpansionState: G => { createResolver()(G, { kind: 'initRegulations' }); },
    tiles: () => [
      { id: 'InnerOrder', kind: 'Hotspot', hotspotOutcome: 'regulation' },
      { id: 'AuthorityApparatus', kind: 'AuthorityApparatus' },
    ],
    measureDeck: () => Array.from({ length: 15 }, (_, index) => `SEC_M${String(index + 1).padStart(2, '0')}`),
    measureRules: {
      // EXP-02-08-M01-01..03, EXP-02-04-A-06.
      SEC_M01: { cost: { SEC: 1, INF: 1 }, regulation: { timing: 'immediate', operation: 'place' } },
      // EXP-02-08-M02-01..05.
      SEC_M02: { cost: { SEC: 2 }, targetTile: (G, _owner, tile, coord) => tile.kind === 'Hotspot'
        && !G.tiles.board.find(placement => placement.tileId === tile.id)?.enclosureProcessed && !isFullySurrounded(G, coord),
      duration: 'untilConsumed' },
      // EXP-02-08-M03-01..04.
      SEC_M03: { cost: { SEC: 1 }, duration: 'untilConsumed' },
      // EXP-02-08-M04-01..03, EXP-02-02-F-04.
      SEC_M04: { cost: { SEC: 1 }, regulation: { timing: 'immediate', operation: 'move' } },
      // EXP-02-08-M05-01..05.
      SEC_M05: { cost: { SEC: 1, DOM: 1 }, duration: 'thisTurn' },
      // EXP-02-08-M06-01..03.
      SEC_M06: { cost: { SEC: 1, FOR: 1 }, duration: 'thisRound' },
      // EXP-02-08-M07-01..03.
      SEC_M07: { cost: { SEC: 1, DOM: 1 }, regulation: { timing: 'immediate', operation: 'remove' } },
      // EXP-02-08-M08-01..04.
      SEC_M08: { cost: { SEC: 1, INF: 1 }, regulation: { timing: 'settlement', operation: 'removeAll', hotspotOnly: true }, duration: 'thisRound' },
      // EXP-02-08-M09-01..03 and EXP-02-08-M10-01..03.
      SEC_M09: { cost: { DOM: 1, SEC: 1 }, duration: 'thisRound' },
      SEC_M10: { cost: { SEC: 2, DOM: 1 }, duration: 'thisRound' },
      // EXP-02-08-M11-01..03.
      SEC_M11: { cost: { SEC: 1 }, targetPlayer: 'any', duration: 'nextRound' },
      // EXP-02-08-M12-01..04.
      SEC_M12: { cost: { SEC: 2 }, regulation: { timing: 'settlement', operation: 'place', hotspotOnly: true }, duration: 'thisRound' },
      // EXP-02-08-M13-01..03 and EXP-02-08-M14-01..03.
      SEC_M13: { cost: { SEC: 1, INF: 1 }, targetTile: () => true, duration: 'thisRound' },
      SEC_M14: { cost: { SEC: 1, DOM: 1 }, targetRegulation: true, duration: 'thisRound' },
      // EXP-02-08-M15-01..03.
      SEC_M15: { cost: { SEC: 1 }, duration: 'thisRound' },
    },
    hooks: {
      prohibitions: ({ G, effect }) => {
        // EXP-02-02-D-03 and EXP-02-04-B-01: Blockade is evaluated before cost and output.
        if (attachedAt(G, effect.contextCoord).some(regulation => regulation.kind === 'Blockade')) return true;
        // EXP-02-08-M11-03.
        return effect.kind === 'playMeasure' && Boolean(G.activeMeasureEffects?.some(instance =>
          instance.sourceCardId === 'SEC_M11' && !instance.waitingForRound && instance.targetPlayerID === effect.playerID));
      },
      surcharges: ({ G, effect }) => {
        // EXP-02-02-B-03/-05, EXP-02-08-M09-03 and EXP-02-08-M10-03.
        const oversight = G.activeMeasureEffects?.filter(instance => instance.sourceCardId === 'SEC_M09') ?? [];
        const additional: Surcharge[] = [];
        for (const regulation of attachedAt(G, effect.contextCoord)) {
          const increases = regulation.kind === 'Control' || regulation.kind === 'Administration';
          if (!increases && !(regulation.kind === 'SecurityLevel' && reducible(effect))) continue;
          for (let index = 0; index < instances(G, regulation); index++) {
            if (increases) additional.push({ id: `${regulation.id}:${index}`, source: 'regulation' });
            for (const instance of oversight) additional.push({ id: `${instance.id}:${regulation.id}:${index}`, source: 'measure' });
          }
        }
        for (const instance of G.activeMeasureEffects ?? []) {
          if (instance.sourceCardId === 'SEC_M10') additional.push({ id: instance.id, source: 'measure' });
        }
        return additional;
      },
      outputModifiers: ({ G, effect, amount }) => reducible(effect) ? amount - attachedAt(G, effect.contextCoord)
        .filter(regulation => regulation.kind === 'SecurityLevel').reduce((total, regulation) => total + instances(G, regulation), 0) : amount,
      productionModifiers: ({ G, coord }) => attachedAt(G, coord).flatMap(regulation => regulation.kind === 'SecurityLevel'
        ? [{ source: 'regulation' as const, kind: 'additive' as const, delta: -instances(G, regulation) }] : []),
    },
    extendMoves: ({ add }) => {
      const resolve = createResolver();
      add<z.infer<typeof AuthorityPayload>>({
        type: 'activateAuthorityApparatus',
        payloadSchema: AuthorityPayload,
        execute: (G, playerID, payload) => resolve(G, { kind: 'activateAuthorityApparatus', playerID, ...payload }),
        quotes: (G, playerID) => [...regulationOperations(G, 'move'), ...regulationOperations(G, 'remove')]
          .flatMap(regulation => resolve.actionQuotes(G, { kind: 'activateAuthorityApparatus', playerID, regulation })
            .map(({ payment, ...quote }) => ({ ...quote, payload: { regulation, ...(payment ? { payment } : {}) } }))),
      });
    },
  };
}
