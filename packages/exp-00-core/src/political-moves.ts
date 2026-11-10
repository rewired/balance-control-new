import { z } from '@bc/rules';
import type { CoreState } from '@bc/rules';
import { createExpansionRegistry } from '@bc/rules';
import { createResolver, type DisruptionTarget, type PoliticalActionEffect } from '@bc/rules';
import type { MoveDefinition, MoveExtensionBuilder } from '@bc/rules';
import { matchResourceIds } from '@bc/rules';
import { PaymentSelectionSchema } from '@bc/rules';
import { influenceMoveCost } from './influence.js';
import { formalizationPayments, paymentCombinations, recallPayments } from './resolver.js';
import { disruptionCost, disruptionTarget } from './disruption.js';

function corePoliticalMove<P extends object>(
  type: PoliticalActionEffect['kind'],
  payloadSchema: z.ZodType<P>,
  describe: (playerID: string, payload: P) => PoliticalActionEffect,
  candidates: (G: CoreState, playerID: string) => Iterable<P>,
): MoveDefinition<unknown> {
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
const disruptionPayment = { tileId: id, resources: z.array(id).min(2).max(3), payment: PaymentSelectionSchema.optional() };

function* disruptionPayments(G: CoreState, playerID: string, target: DisruptionTarget, resorts: string[]) {
  if (disruptionTarget(G, playerID, target)) yield* paymentCombinations(resorts, disruptionCost[target.kind]);
}

// CORE-01-04-09/-09A: enumerate targets and payments using the same plan as execution.
export function registerCorePoliticalMoves({ add }: MoveExtensionBuilder): void {
  const moves = [
    corePoliticalMove(
      'placeOrMoveInfluence',
      z.object({
        markerId: id, targetTileId: id, sourceTileId: id.optional(),
        resources: z.array(id).min(1).max(3).optional(), payment: PaymentSelectionSchema.optional(),
      }).strict(),
      (playerID, payload) => ({ kind: 'placeOrMoveInfluence', playerID, ...payload }),
      function* (G, playerID) {
        const resorts = G.cfg.variants.influenceDistance ? matchResourceIds(G) : [];
        for (const { tileId: targetTileId, coord } of G.exp.core.tiles.board) {
          if (G.exp.core.allTiles[targetTileId].kind === 'StartCommittee') continue;
          for (const marker of G.exp.core.players[playerID]?.personal.influence ?? []) {
            yield { markerId: marker.id, targetTileId };
          }
          for (const marker of G.exp.core.influencesOnBoard ?? []) {
            if (marker.owner === playerID && marker.tileId !== targetTileId) {
              // CORE-01-04-12A/-12B: offer each choice of base payment once.
              const cost = influenceMoveCost(G, marker.tileId, coord);
              if (cost === undefined) continue;
              const target = { markerId: marker.id, sourceTileId: marker.tileId, targetTileId };
              for (const resources of paymentCombinations(resorts, cost)) {
                yield resources.length ? { ...target, resources } : target;
              }
            }
          }
        }
      },
    ),
    corePoliticalMove(
      'recallInfluence',
      z.object({ markerId: id, resources: z.array(id).length(3), payment: PaymentSelectionSchema.optional() }).strict(),
      (playerID, payload) => ({ kind: 'recallInfluence', playerID, ...payload }),
      function* (G, playerID) {
        // CORE-01-04-23..25: each legal target and distinct payment goes through the resolver.
        const { allTiles, influencesOnBoard, recalledThisRound } = G.exp.core;
        if (!G.cfg.variants.influenceRecall || recalledThisRound?.includes(playerID)) return;
        const payments = [...recallPayments(matchResourceIds(G))];
        for (const marker of influencesOnBoard ?? []) {
          if (marker.owner === playerID || allTiles[marker.tileId]?.kind === 'StartCommittee') continue;
          for (const resources of payments) yield { markerId: marker.id, resources };
        }
      },
    ),
    corePoliticalMove(
      'formalizeInfluence',
      z.object({ tileId: id, resources: z.array(id).min(2).max(4), payment: PaymentSelectionSchema.optional() }).strict(),
      (playerID, payload) => ({ kind: 'formalizeInfluence', playerID, ...payload }),
      function* (G) {
        const resources = matchResourceIds(G);
        for (const { tileId } of G.exp.core.tiles.board) {
          const kind = G.exp.core.allTiles[tileId].kind;
          if (kind !== 'Committee' && kind !== 'StartCommittee') continue;
          for (const payment of formalizationPayments(resources, kind === 'StartCommittee')) yield { tileId, resources: payment };
        }
      },
    ),
    corePoliticalMove(
      'convertResources',
      z.object({ tileId: id, input: id, output: id, alternative: id.optional(), payment: PaymentSelectionSchema.optional() }).strict(),
      (playerID, payload) => ({ kind: 'convertResources', playerID, ...payload }),
      function* (G, playerID) {
        const resources = matchResourceIds(G);
        const alternatives = createExpansionRegistry(G.cfg.expansions)
          .flatMap(module => module.conversionAlternatives?.(G, playerID) ?? []);
        for (const { tileId } of G.exp.core.tiles.board) {
          if (G.exp.core.allTiles[tileId].kind !== 'Grassroots') continue;
          for (const input of resources) {
            for (const output of resources) {
              if (input !== output) yield { tileId, input, output };
            }
          }
          for (const option of alternatives) {
            for (const output of resources) {
              if (option.input !== output) yield { tileId, input: option.input, output, alternative: option.id };
            }
          }
        }
      },
    ),
  ];
  moves.forEach(add);
  add(corePoliticalMove(
    'counterLobby', z.object({ ...disruptionPayment, lobbyistTileId: id }).strict(),
    (playerID, payload) => ({ kind: 'counterLobby', playerID, ...payload }),
    function* (G, playerID) {
      if (!G.cfg.variants.disruption) return;
      const resorts = matchResourceIds(G);
      const { tiles, allTiles } = G.exp.core;
      const lobbyists = tiles.board.filter(({ tileId }) => allTiles[tileId].kind === 'Lobbyist');
      for (const { tileId } of tiles.board) {
        if (allTiles[tileId].kind !== 'Committee') continue;
        for (const { tileId: lobbyistTileId } of lobbyists) {
          for (const resources of disruptionPayments(G, playerID, { kind: 'counterLobby', tileId, lobbyistTileId }, resorts)) {
            yield { tileId, lobbyistTileId, resources };
          }
        }
      }
    },
  ));
  add(corePoliticalMove(
    'displaceInfluence', z.object({ ...disruptionPayment, markerId: id }).strict(),
    (playerID, payload) => ({ kind: 'displaceInfluence', playerID, ...payload }),
    function* (G, playerID) {
      if (!G.cfg.variants.disruption) return;
      const resorts = matchResourceIds(G);
      for (const { id: markerId, tileId } of G.exp.core.influencesOnBoard ?? []) {
        for (const resources of disruptionPayments(G, playerID, { kind: 'displaceInfluence', tileId, markerId }, resorts)) {
          yield { tileId, markerId, resources };
        }
      }
    },
  ));
  add(corePoliticalMove(
    'damageResort', z.object(disruptionPayment).strict(),
    (playerID, payload) => ({ kind: 'damageResort', playerID, ...payload }),
    function* (G, playerID) {
      if (!G.cfg.variants.disruption) return;
      const resorts = matchResourceIds(G);
      for (const { tileId } of G.exp.core.tiles.board) {
        for (const resources of disruptionPayments(G, playerID, { kind: 'damageResort', tileId }, resorts)) {
          yield { tileId, resources };
        }
      }
    },
  ));
}
