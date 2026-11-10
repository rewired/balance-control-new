import type { CoreState, MeasureDeckState } from '@bc/rules';
import type { EngineMoveOption } from '@bc/game';
import { boardTileLabel, isAuthorityAction, measureAction, playerLabel, regulationLabel, words, type MeasureSelection } from './core-board-labels.js';
import { expansions, measureName, measurePrice, measureText } from './expansion-data.js';
import { RegulationBadge, ResourceBadge } from './CoreSymbols.js';

export function MeasureDetails({ G, selection, available }: { G: CoreState; selection: MeasureSelection; available: boolean }) {
  const card = measureText(selection.id);
  return (
    <section className="measure-details" aria-label="Measure details">
      <p>{selection.action === 'take' ? 'From the market' : 'From a player’s hand'}</p>
      {card?.cost && <p><strong>Base card cost</strong> · {measurePrice(G, selection.id)}</p>}
      {card && <details>
        <summary>Card rules</summary>
        {card.clauses.map((clause, index) => <p key={index}>{clause}</p>)}
      </details>}
      {!available && <p>This card has no legal action right now.</p>}
    </section>
  );
}

interface MeasureProps {
  G: CoreState;
  options: EngineMoveOption[];
  selected?: MeasureSelection;
  onSelect: (selection: MeasureSelection) => void;
}

export function MeasurePanel({ G, options, selected, onSelect }: MeasureProps) {
  const decks = expansions.flatMap(expansion => {
    const deck = G.exp[expansion.id]?.measures;
    return deck ? [{ ...expansion, deck }] : [];
  });
  const legalCards = options.flatMap(option => measureAction(option) ?? []);

  function cardButton(id: string, action: MeasureSelection['action'], deck: MeasureDeckState) {
    const legal = legalCards.some(card => card.id === id && card.action === action);
    const name = measureName(id);
    return (
      <button type="button" className="measure-card" data-available={legal}
        aria-pressed={selected?.id === id && selected.action === action}
        onClick={() => onSelect({ id, action })}>
        <strong>{name}</strong>
        <span>Base card cost · {measurePrice(G, id)}</span>
        <small>{deck.playCounts[id] ?? 0} played{legal && ` · ${action === 'take' ? 'Take available' : 'Play available'}`}</small>
      </button>
    );
  }

  return (
    <div className="expansion-panels">
      <section className="expansion-panel" aria-label="Measure market">
        <h3>Open Measures</h3>
        <div className="measure-markets">
          {decks.map(({ id, label, resource, deck }) => (
            <div className="measure-deck market-deck" key={id}>
              <div className="measure-deck-heading">
                <ResourceBadge resource={resource} />
                <h4>{label}</h4>
              </div>
              <small>{deck.drawPile.length} in deck · {deck.recycle.length} in recycle · {deck.finalDiscard.length} retired</small>
              <ol className="market-slots">
                {deck.open.map((card, index) => (
                  <li key={index}>{card ? cardButton(card, 'take', deck) : <p>Empty slot</p>}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
      <details className="expansion-disclosure">
        <summary>Player hands</summary>
        <div className="expansion-panel">
          {Object.keys(G.exp.core.players).map(playerID => {
            const cards = decks.flatMap(({ deck }) => (deck.hands[playerID] ?? []).map(id => ({ id, deck })));
            return (
              <div className="measure-deck" key={playerID}>
                <h4>{playerLabel(playerID)} · {cards.length} in hand</h4>
                {cards.length ? <ul className="hand-cards">
                  {cards.map(({ id, deck }) => <li key={id}>{cardButton(id, 'play', deck)}</li>)}
                </ul> : <p>No measures in hand.</p>}
              </div>
            );
          })}
        </div>
      </details>
      <details className="expansion-disclosure">
        <summary>Active measures · {G.exp.core.activeMeasureEffects?.length ?? 0}</summary>
        <div className="expansion-panel">
          {G.exp.core.activeMeasureEffects?.length ? <ul className="expansion-list">
            {G.exp.core.activeMeasureEffects.map(effect => (
              <li key={effect.id}>
                <strong>{measureName(effect.sourceCardId)}</strong>
                {' · '}{playerLabel(effect.owner)} · {words(effect.duration)}
                {effect.targetPlayerID && ` · Targets ${playerLabel(effect.targetPlayerID)}`}
                {effect.targetTileId && ` · ${boardTileLabel(G.exp.core, effect.targetTileId)}`}
                {effect.targetResort && ` · ${effect.targetResort}`}
                {(effect.waitingForTurn || effect.waitingForRound) && ' · Waiting to start'}
                {effect.used && ' · Used'}
              </li>
            ))}
          </ul> : <p>No active measures.</p>}
        </div>
      </details>
    </div>
  );
}

export function RegulationPanel({ G, options, onInspect }: {
  G: CoreState;
  options: EngineMoveOption[];
  onInspect: (tileId: string) => void;
}) {
  const regulations = G.exp.exp02?.regulations?.attached ?? [];
  const authorityTile = options.find(isAuthorityAction)?.contextTile;
  return (
    <section className="expansion-panel" aria-label="Regulations">
      <h3>Regulations on the board</h3>
      {regulations.length ? <ul className="expansion-list regulation-list">
        {regulations.map(regulation => (
          <li key={regulation.id}>
            <strong><RegulationBadge kind={regulation.kind} /> {regulationLabel(regulation)}</strong>
            <button type="button" onClick={() => onInspect(regulation.tileId)}>{boardTileLabel(G.exp.core, regulation.tileId)}</button>
          </li>
        ))}
      </ul> : <p>No regulations are attached yet.</p>}
      {authorityTile && <button type="button" onClick={() => onInspect(authorityTile)}>
        View Authority Apparatus actions
      </button>}
      <p>Regulation choices are offered by Security measures, Inner Order and a controlled Authority Apparatus.</p>
    </section>
  );
}
