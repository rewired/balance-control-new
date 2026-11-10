import type { Ctx } from 'boardgame.io';
import { checkStartCommitteeFormalization, CoreStages, startCommitteeCost } from '@bc/game';
import { awaitsFirstPlacement, type CoreState } from '@bc/rules';
import { playerLabel } from './core-board-labels.js';

function blockerLabel(G: CoreState, reason: string | undefined): string {
  switch (reason) {
    case 'starting-influence-unplaced': {
      const remaining = Object.values(G.exp.core.players).flatMap(({ id, personal }) => {
        const count = personal.influence.filter(awaitsFirstPlacement).length;
        return count ? [`${playerLabel(id)} (${count})`] : [];
      });
      return `Starting markers still in supply · ${remaining.join(', ')}.`;
    }
    case 'committee-unavailable': return 'You have already used the Start Committee this match.';
    case 'insufficient': return 'Your resources do not cover this cost.';
    case 'influence-cap': return 'You have reached your influence limit across the board and your supply.';
    default: return 'Formalization is unavailable.';
  }
}

export default function StartCommitteeDetails({ G, ctx, tileId, playerID, available }: {
  G: CoreState;
  ctx: Ctx;
  tileId: string;
  playerID?: string | null;
  available: boolean;
}) {
  const ended = ctx.gameover !== undefined;
  const stage = playerID == null ? undefined : ctx.activePlayers?.[playerID];
  const check = !ended && !available && playerID != null
    ? checkStartCommitteeFormalization(G, playerID, tileId) : undefined;
  let timing: string | undefined;
  if (ended) timing = 'This match has ended.';
  else if (available) timing = 'Available now. Choose a payment below.';
  else if (playerID != null) {
    if (playerID !== ctx.currentPlayer) timing = 'Wait for your turn.';
    else if (stage === CoreStages.DrawAndPlaceTile) timing = 'Place your drawn tile first.';
    else if (stage === CoreStages.ResolveHotspot || stage === CoreStages.ResolveRegulationFollowUp) {
      timing = 'Resolve the pending decision first.';
    }
  }

  return (
    <section className="start-committee-details" aria-label="Start Committee formalization">
      <h4>Formalize influence</h4>
      <p>Once per player during a political action, after everyone has placed all their starting markers. The new marker goes into your supply.</p>
      <p><strong>Cost</strong> · {startCommitteeCost.total} resources. Pay one each from {startCommitteeCost.distinct} different resorts plus {startCommitteeCost.total - startCommitteeCost.distinct} from any resort.</p>
      {timing && <p><strong>{timing}</strong></p>}
      {check && !check.ok && <p>{blockerLabel(G, check.reason)}</p>}
    </section>
  );
}
