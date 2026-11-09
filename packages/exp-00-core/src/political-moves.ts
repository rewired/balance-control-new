import { z } from '@bc/rules';
import type { CoreState } from '@bc/rules';
import { createExpansionRegistry, getControl } from '@bc/rules';
import { createResolver, type PoliticalActionEffect } from '@bc/rules';
import type { MoveDefinition, MoveExtensionBuilder } from '@bc/rules';
import { matchResourceIds } from '@bc/rules';
import { PaymentSelectionSchema } from '@bc/rules';
import { conversionAssistedQuotes, formalizationPayments } from './resolver.js';

function corePoliticalMove<P extends object>(
  type: PoliticalActionEffect['kind'],
  payloadSchema: z.ZodType<P>,
  describe: (playerID: string, payload: P) => PoliticalActionEffect,
  candidates: (G: CoreState, playerID: string) => Iterable<P>,
): MoveDefinition<P> & Required<Pick<MoveDefinition<P>, 'quotes'>> {
  const resolve = createResolver();
  return {
    type,
    payloadSchema,
    execute: (G, playerID, input) => {
      const parsed = payloadSchema.safeParse(input);
      return parsed.success ? resolve(G, describe(playerID, parsed.data)) : { ok: false, reason: 'invalid-payload' };
    },
    *quotes(G, playerID) {
      // CORE-01-04-09A: existence checks can stop at the first legal option.
      for (const payload of candidates(G, playerID)) {
        for (const { payment, ...quote } of resolve.actionQuotes(G, describe(playerID, payload))) {
          yield { ...quote, payload: { ...payload, ...(payment ? { payment } : {}) } };
        }
      }
    },
  };
}

const id = z.string().min(1);
const conversionSchema = z.object({
  tileId: id, input: id, output: id, alternative: id.optional(), payment: PaymentSelectionSchema.optional(),
}).strict();

// CORE-01-04-14A and CORE-01-08-02..08: enumerate payable shapes only at eligible Committees.
function* committeePayments(G: CoreState, playerID: string) {
  const { allTiles, tiles, players } = G.exp.core;
  if (Object.values(players).some(player => player.personal.influence.some(marker => marker.starting))) return;
  const resources = matchResourceIds(G);
  for (const { tileId, coord } of tiles.board) {
    const kind = allTiles[tileId].kind;
    const eligible = kind === 'StartCommittee' ? !players[playerID]?.usedStartCommittee
      : kind === 'Committee' && getControl(G, coord) === playerID;
    if (!eligible) continue;
    for (const payment of formalizationPayments(resources, kind === 'StartCommittee')) yield { tileId, resources: payment };
  }
}

// CORE-01-04-09/-09A: enumerate targets and payments using the same plan as execution.
export function registerCorePoliticalMoves({ add }: MoveExtensionBuilder): void {
  add(corePoliticalMove(
    'placeOrMoveInfluence',
    z.object({ markerId: id, targetTileId: id, sourceTileId: id.optional(), payment: PaymentSelectionSchema.optional() }).strict(),
    (playerID, payload) => ({ kind: 'placeOrMoveInfluence', playerID, ...payload }),
    function* (G, playerID) {
      for (const { tileId: targetTileId } of G.exp.core.tiles.board) {
        if (G.exp.core.allTiles[targetTileId].kind === 'StartCommittee') continue;
        for (const marker of G.exp.core.players[playerID]?.personal.influence ?? []) {
          yield { markerId: marker.id, targetTileId };
        }
        for (const marker of G.exp.core.influencesOnBoard ?? []) {
          if (marker.owner === playerID && marker.tileId !== targetTileId) {
            yield { markerId: marker.id, sourceTileId: marker.tileId, targetTileId };
          }
        }
      }
    },
  ));
  const formalization = corePoliticalMove(
    'formalizeInfluence',
    z.object({
      tileId: id, resources: z.array(id).min(2).max(4), payment: PaymentSelectionSchema.optional(),
      conversion: conversionSchema.optional(),
    }).strict(),
    (playerID, payload) => ({ kind: 'formalizeInfluence', playerID, ...payload }),
    committeePayments,
  );
  const conversion = corePoliticalMove(
    'convertResources',
    conversionSchema,
    (playerID, payload) => ({ kind: 'convertResources', playerID, ...payload }),
    function* (G, playerID) {
      const resources = matchResourceIds(G);
      const alternatives = createExpansionRegistry(G.cfg.expansions)
        .flatMap(module => module.conversionAlternatives?.(G, playerID) ?? []);
      for (const { tileId, coord } of G.exp.core.tiles.board) {
        if (G.exp.core.allTiles[tileId].kind !== 'Grassroots') continue;
        // CORE-01-04-21A and EXP-01-05-01: neutral access applies to the ordinary exchange.
        const controller = getControl(G, coord);
        if (controller !== null && controller !== playerID) continue;
        for (const input of resources) {
          for (const output of resources) {
            if (input !== output) yield { tileId, input, output };
          }
        }
        if (controller === playerID) {
          for (const option of alternatives) {
            for (const output of resources) {
              if (option.input !== output) yield { tileId, input: option.input, output, alternative: option.id };
            }
          }
        }
      }
    },
  );
  add(conversion);
  add({
    ...formalization,
    *quotes(G, playerID) {
      yield* formalization.quotes(G, playerID);
      yield* conversionAssistedQuotes(G, playerID, conversion.quotes(G, playerID), committeePayments(G, playerID));
    },
  });
}
