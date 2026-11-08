import { useState, type CSSProperties } from 'react';
import type { Ctx } from 'boardgame.io';
import type { BoardProps } from 'boardgame.io/react';
import { engineMoveOptions, type EngineMoveOption } from '@bc/game';
import type { AxialCoord, CoreExpansionState, CoreState } from '@bc/rules';
import CoreHexBoard, { playerColor, TileFace } from './CoreHexBoard.js';
import { boardTileLabel, coordLabel, describeOption, optionCost, playerLabel } from './core-board-labels.js';

type Moves = Record<string, (...args: unknown[]) => void>;

export function submitCoreOption(moves: Moves, option: EngineMoveOption): void {
  moves[option.moveType](...option.parameters);
}

function OptionPicker({ core, options, submit }: {
  core: CoreExpansionState;
  options: EngineMoveOption[];
  submit: (option: EngineMoveOption) => void;
}) {
  const [selected, setSelected] = useState(0);
  return (
    <form className="core-action" onSubmit={event => {
      event.preventDefault();
      submit(options[selected]);
    }}>
      <label>
        Choose an action
        <select value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {options.map((option, index) => (
            <option key={index} value={index}>{describeOption(core, option)} · {optionCost(option)}</option>
          ))}
        </select>
      </label>
      <p>Cost: {optionCost(options[selected])}</p>
      <button type="submit">Confirm</button>
    </form>
  );
}

interface CoreViewProps {
  G: CoreState;
  ctx: Ctx;
  revision: number;
  playerID?: string | null;
  submit: (option: EngineMoveOption) => void;
  onNewMatch?: () => void;
}

export function CoreView({ G, ctx, revision, playerID, submit, onNewMatch }: CoreViewProps) {
  const [selection, setSelection] = useState<{ revision: number; playerID?: string | null; tile?: string; coord?: string }>();
  const current = selection?.revision === revision && selection.playerID === playerID ? selection : undefined;
  const selectedTile = current?.tile;
  const selectedCoord = current?.coord;
  const core = G.exp.core;
  const drawn = core.tiles.drawResolution;
  const activePlayer = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const stage = ctx.activePlayers?.[activePlayer];
  const result = ctx.gameover as { winners: string[] } | undefined;
  const options = playerID == null ? [] : engineMoveOptions(G, ctx, playerID);
  const placements = new Map<string, { coord: AxialCoord; options: EngineMoveOption[] }>();
  for (const option of options) {
    if (option.moveType !== 'placeTile') continue;
    const coord = option.parameters[0] as AxialCoord;
    const key = coordLabel(coord);
    const entry = placements.get(key);
    if (entry) entry.options.push(option);
    else placements.set(key, { coord, options: [option] });
  }
  const placementOptions = selectedCoord ? placements.get(selectedCoord)?.options ?? [] : [];
  const politicalOptions = options.filter(option => option.moveType !== 'placeTile');
  const visibleActions = selectedTile ? politicalOptions.filter(option => option.contextTile === selectedTile) : politicalOptions;
  const phase = drawn ? 'Place the drawn tile' : stage === 'ExactlyOnePoliticalAction' || stage === 'AdditionalPoliticalAction'
    ? 'Choose a political action' : 'Resolve a decision';
  const status = result ? (result.winners.length > 1 ? `Shared win · ${result.winners.map(playerLabel).join(' and ')}`
    : `${playerLabel(result.winners[0])} wins`) : `Turn ${ctx.turn} · ${playerLabel(ctx.currentPlayer)}`;

  return (
    <div className="core-match">
      <div className="core-heading">
        <h2 aria-live="polite">{status}</h2>
        <p>{core.tiles.drawPile.length} in draw pile · {core.tiles.discardFaceUp.length} discarded</p>
      </div>
      <div className="core-supplies" aria-label="Player supplies">
        {Object.values(core.players).map(({ id, personal }) => (
          <section key={id} className="core-supply" style={{ '--player-color': playerColor(id) } as CSSProperties}>
            <strong>{playerLabel(id)}</strong>
            <span>{personal.influence.length} in supply · {(core.influencesOnBoard ?? []).filter(marker => marker.owner === id).length} on board</span>
            <span>{Object.entries(personal.resources).map(([resource, count]) => `${resource} ${count}`).join(' · ')}</span>
          </section>
        ))}
        <section className="core-supply">
          <strong>Noise</strong>
          <span>{Object.entries(core.resources.noise).map(([resource, count]) => `${resource} ${count}`).join(' · ')}</span>
        </section>
      </div>
      {result ? <p>Final score is the number of influence markers each player has on the board.</p> : (
        <div className="core-offer">
          {drawn && <TileFace tile={core.allTiles[drawn.tileId]} />}
          <p>{options.length ? phase : `Waiting for ${playerLabel(activePlayer)}`}{activePlayer !== ctx.currentPlayer && options.length ? ` · ${playerLabel(activePlayer)}` : ''}</p>
        </div>
      )}
      {selectedTile && <p>Selected tile: {boardTileLabel(core, selectedTile)}{' '}
        <button type="button" onClick={() => setSelection(undefined)}>Clear selection</button>
      </p>}
      {placementOptions.length > 0 && <OptionPicker key={`${revision}:${selectedCoord}`} core={core} options={placementOptions} submit={submit} />}
      {visibleActions.length > 0 && <OptionPicker key={`${revision}:${selectedTile ?? 'all'}`} core={core} options={visibleActions} submit={submit} />}
      {politicalOptions.length > 0 && visibleActions.length === 0 && <p>No actions here. Clear the selection to see all legal actions.</p>}
      <CoreHexBoard G={G} selectedTile={selectedTile} legalCoords={Array.from(placements.values(), entry => entry.coord)}
        onInspect={tileId => setSelection({ revision, playerID, tile: selectedTile === tileId ? undefined : tileId })}
        onPlace={coord => {
          const key = coordLabel(coord);
          const choices = placements.get(key)?.options ?? [];
          if (choices.length === 1 && choices[0].costBreakdown.length === 0) submit(choices[0]);
          else setSelection({ revision, playerID, coord: key });
        }} />
      {result && onNewMatch && <div><button type="button" className="new-match" onClick={onNewMatch}>Start a new match</button></div>}
    </div>
  );
}

export default function CoreBoard({ G, ctx, _stateID, playerID, isActive, moves }: BoardProps<CoreState>) {
  return <CoreView G={G} ctx={ctx} revision={_stateID} playerID={isActive ? playerID : null}
    submit={option => submitCoreOption(moves, option)} />;
}
