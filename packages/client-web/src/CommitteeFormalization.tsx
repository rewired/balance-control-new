import type { Ctx } from 'boardgame.io';
import { checkStartCommitteeFormalization, CoreStages, startCommitteeCost } from '@bc/game';
import { awaitsFirstPlacement, type CoreState } from '@bc/rules';
import { PlayerMarker } from './CoreSymbols.js';

function blockerLabel(reason: string | undefined): string {
  switch (reason) {
    case 'committee-unavailable': return 'You have already used the Start Committee this match.';
    case 'insufficient': return 'Your resources do not cover this cost.';
    case 'influence-cap': return 'You have reached your influence limit across the board and your supply.';
    default: return 'Formalization is unavailable.';
  }
}

export default function CommitteeFormalization({ G, ctx, kind, tileId, playerID, available }: {
  G: CoreState;
  ctx: Ctx;
  kind: 'StartCommittee' | 'Committee';
  tileId: string;
  playerID?: string | null;
  available: boolean;
}) {
  const isStart = kind === 'StartCommittee';
  const ended = ctx.gameover !== undefined;
  // CORE-01-08-02/-03 and CORE-01-04-26: a recalled starting marker has already been placed.
  const pending = ended ? [] : Object.values(G.exp.core.players)
    .filter(({ personal }) => personal.influence.some(awaitsFirstPlacement));
  if (!isStart && pending.length === 0) return null;

  const stage = playerID == null ? undefined : ctx.activePlayers?.[playerID];
  const check = isStart && !ended && !available && playerID != null
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
    <section className="committee-formalization" aria-label={isStart ? 'Start Committee formalization' : 'Standard Committee formalization'}>
      <h4>Formalize influence</h4>
      {pending.length > 0 && <p className="formalization-pending">
        <strong>Still to place starting markers</strong>
        {pending.map(({ id }) => <PlayerMarker key={id} id={id} numbered />)}
      </p>}
      {isStart && <>
        <p>Once per player during a political action, after everyone has placed each starting marker at least once. The new marker goes into your supply.</p>
        <p><strong>Cost</strong> · {startCommitteeCost.total} resources. Pay one each from {startCommitteeCost.distinct} different resorts plus {startCommitteeCost.total - startCommitteeCost.distinct} from any resort.</p>
        {timing && <p><strong>{timing}</strong></p>}
        {check && !check.ok && check.reason !== 'starting-influence-unplaced' && <p>{blockerLabel(check.reason)}</p>}
      </>}
    </section>
  );
}
