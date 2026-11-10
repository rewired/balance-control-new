import type { Ctx } from 'boardgame.io';
import { checkStartCommitteeFormalization, CoreStages, startCommitteeCost } from '@bc/game';
import type { CoreState } from '@bc/rules';
import { PlayerMarker } from './CoreSymbols.js';
import { committeeProgress } from './core-board-labels.js';

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
  const { pending, used } = committeeProgress(G);
  if (!isStart && (ended || pending.length === 0)) return null;

  const stage = playerID == null ? undefined : ctx.activePlayers?.[playerID];
  const check = isStart && !ended && !available && playerID != null
    ? checkStartCommitteeFormalization(G, playerID, tileId) : undefined;
  let timing: string | undefined;
  if (ended) timing = 'This match has ended.';
  else if (available) timing = 'Available now. Choose a payment below.';
  else if (playerID != null) {
    if (playerID !== ctx.currentPlayer) timing = 'Wait for your turn.';
    else if (stage === CoreStages.DrawAndPlaceTile) timing = 'Place your drawn tile first.';
    else if (stage === CoreStages.ResolveHotspot || stage === CoreStages.ResolveRegulationFollowUp || stage === CoreStages.ChooseDisplacement) {
      timing = 'Resolve the pending decision first.';
    } else if (check?.ok) timing = 'Unavailable in this step.';
  }

  return (
    <section className="committee-formalization" aria-label={isStart ? 'Start Committee formalization' : 'Standard Committee formalization'}>
      <h4>Formalize influence</h4>
      {!ended && pending.length > 0 && <p className="formalization-players">
        <strong>Still to place starting markers</strong>
        {pending.map(({ id }) => <PlayerMarker key={id} id={id} numbered />)}
      </p>}
      {isStart && <>
        <p className="formalization-players">
          <strong>Already used the Start Committee</strong>
          {used.length ? used.map(({ id }) => <PlayerMarker key={id} id={id} numbered />) : <span>No one yet</span>}
        </p>
        <p>Once per player during a political action, after everyone has placed each starting marker at least once. The new marker goes into your supply.</p>
        <p><strong>Cost</strong> · {startCommitteeCost.total} resources. Pay one each from {startCommitteeCost.distinct} different resorts plus {startCommitteeCost.total - startCommitteeCost.distinct} from any resort.</p>
        {timing && <p><strong>{timing}</strong></p>}
        {check && !check.ok && check.reason !== 'starting-influence-unplaced' && <p>{blockerLabel(check.reason)}</p>}
      </>}
    </section>
  );
}
