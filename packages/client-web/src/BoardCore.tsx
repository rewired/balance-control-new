import { useState, type CSSProperties } from 'react';
import type { Ctx } from 'boardgame.io';
import type { BoardProps } from 'boardgame.io/react';
import { CoreStages, engineMoveOptions, type EngineMoveOption } from '@bc/game';
import type { AxialCoord, CoreExpansionState, CoreState } from '@bc/rules';
import CoreHexBoard, { TileFace } from './CoreHexBoard.js';
import CoreSupplies from './CoreSupplies.js';
import StartCommitteeDetails from './StartCommitteeDetails.js';
import { playerColor } from './core-board-visuals.js';
import {
  boardTileLabel, coordLabel, describeOption, influenceLabel, isFormalization, movePreview, optionCost, playerLabel,
  playerShortLabel, tileOccupation,
} from './core-board-labels.js';

type Moves = Record<string, (...args: unknown[]) => void>;

export function submitCoreOption(moves: Moves, option: EngineMoveOption): void {
  moves[option.moveType](...option.parameters);
}

function OptionPicker({ core, options, selected, onSelect, submit }: {
  core: CoreExpansionState;
  options: EngineMoveOption[];
  selected: number;
  onSelect: (index: number) => void;
  submit: (option: EngineMoveOption) => void;
}) {
  const option = options[selected];
  return (
    <form className="core-action" onSubmit={event => {
      event.preventDefault();
      submit(option);
    }}>
      <label>
        Legal actions
        <select value={selected} onChange={event => onSelect(Number(event.target.value))}>
          {options.map((option, index) => (
            <option key={index} value={index}>{describeOption(core, option)} · {optionCost(option)}</option>
          ))}
        </select>
      </label>
      <p className="core-action-preview">{describeOption(core, option)}</p>
      <p>Cost: {optionCost(option)}</p>
      <button type="submit">Confirm</button>
    </form>
  );
}

interface CoreViewProps {
  G: CoreState;
  ctx: Ctx;
  revision: number;
  playerID?: string | null;
  isActive?: boolean;
  submit: (option: EngineMoveOption) => void;
  onNewMatch?: () => void;
}

export function CoreView({ G, ctx, revision, playerID, isActive = true, submit, onNewMatch }: CoreViewProps) {
  const [selection, setSelection] = useState<{
    revision: number;
    playerID?: string | null;
    tile?: string;
    coord?: string;
    actionIndex?: number;
  }>();
  const current = selection?.revision === revision && selection.playerID === playerID ? selection : undefined;
  const selectedTile = current?.tile;
  const selectedCoord = current?.coord;
  const core = G.exp.core;
  const inspected = core.tiles.board.find(placement => placement.tileId === selectedTile);
  const occupation = inspected && tileOccupation(G, inspected);
  const startCommitteeSelected = inspected && core.allTiles[inspected.tileId].kind === 'StartCommittee';
  const drawn = core.tiles.drawResolution;
  const activePlayer = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const stage = ctx.activePlayers?.[activePlayer];
  const result = ctx.gameover as { winners: string[] } | undefined;
  const options = !isActive || playerID == null ? [] : engineMoveOptions(G, ctx, playerID);
  const placements = new Map<string, { coord: AxialCoord; options: EngineMoveOption[] }>();
  const tileActions = new Map<string, EngineMoveOption[]>();
  const otherActions: EngineMoveOption[] = [];
  for (const option of options) {
    if (option.moveType !== 'placeTile') {
      otherActions.push(option);
      if (option.contextTile !== null) {
        const actions = tileActions.get(option.contextTile);
        if (actions) actions.push(option);
        else tileActions.set(option.contextTile, [option]);
      }
      continue;
    }
    const coord = option.parameters[0] as AxialCoord;
    const key = coordLabel(coord);
    const entry = placements.get(key);
    if (entry) entry.options.push(option);
    else placements.set(key, { coord, options: [option] });
  }
  const visibleActions = selectedCoord ? placements.get(selectedCoord)?.options ?? []
    : selectedTile ? tileActions.get(selectedTile) ?? [] : otherActions;
  const actionIndex = current?.actionIndex ?? 0;
  const preview = movePreview(visibleActions[actionIndex]);
  const phase = drawn ? 'Place the drawn tile' : stage === CoreStages.ExactlyOnePoliticalAction || stage === CoreStages.AdditionalPoliticalAction
    ? 'Choose a political action' : stage === CoreStages.ResolveHotspot ? 'Resolve a Hotspot'
      : stage === CoreStages.ResolveRegulationFollowUp ? 'Resolve a Regulation' : 'Resolve a decision';
  const status = result ? (result.winners.length > 1 ? `Shared win · ${result.winners.map(playerLabel).join(' and ')}`
    : `${playerLabel(result.winners[0])} wins`) : `${playerLabel(activePlayer)} to act`;

  return (
    <div className="core-match" style={{ '--acting-color': result ? '#94a3b8' : playerColor(activePlayer) } as CSSProperties}>
      <header className="core-heading" aria-live="polite">
        {!result && <span className="turn-token" aria-hidden="true">{playerShortLabel(activePlayer)}</span>}
        <div>
          <h2>{status}</h2>
          {!result && <p>{phase}</p>}
        </div>
        <p className="turn-number">Turn {ctx.turn}{!result && activePlayer !== ctx.currentPlayer
          && ` · ${playerLabel(ctx.currentPlayer)}'s turn`}</p>
      </header>
      <CoreSupplies G={G} activePlayer={result ? undefined : activePlayer} />
      <div className="core-play">
        <div className="core-map">
          <div className="core-map-key">
            <p><strong>Influence</strong> · P1 2 +1 means 2 markers and 1 virtual influence for Player 1.</p>
            {placements.size > 0 && <p><strong>+</strong> marks a legal space for the drawn tile.</p>}
            {tileActions.size > 0 && <p><strong>Place / Move</strong> marks where {playerLabel(activePlayer)} can add or move a marker.</p>}
          </div>
          <CoreHexBoard G={G} selectedTile={selectedTile} selectedCoord={selectedCoord} tileActions={tileActions} preview={preview}
            legalCoords={Array.from(placements.values(), entry => entry.coord)}
            onInspect={tileId => setSelection({ revision, playerID, tile: selectedTile === tileId ? undefined : tileId })}
            onPlace={coord => {
              const key = coordLabel(coord);
              const choices = placements.get(key)?.options ?? [];
              if (choices.length === 1 && choices[0].costBreakdown.length === 0) submit(choices[0]);
              else setSelection({ revision, playerID, coord: key });
            }} />
        </div>
        <aside className="core-inspector" aria-label="Tile details and actions">
          {occupation && selectedTile ? <>
            <div className="core-inspector-heading">
              <h3>{boardTileLabel(core, selectedTile)}</h3>
              <button type="button" onClick={() => setSelection(undefined)}>Clear</button>
            </div>
            <p><strong>{occupation.control}</strong></p>
            {occupation.influence.length ? (
              <ul className="inspected-influence">
                {occupation.influence.map(entry => <li key={entry.id}
                  style={{ '--player-color': playerColor(entry.id) } as CSSProperties}>{influenceLabel(entry)}</li>)}
              </ul>
            ) : <p>No influence here.</p>}
            {startCommitteeSelected && <StartCommitteeDetails G={G} ctx={ctx} tileId={selectedTile} playerID={playerID}
              available={visibleActions.some(isFormalization)} />}
          </> : (
            <h3>{selectedCoord ? `Placement at ${selectedCoord}` : 'Board overview'}</h3>
          )}
          {result ? <p>Final score is the number of influence markers each player has on the board.</p> : (
            <>
              {drawn && <div className="core-offer">
                <TileFace tile={core.allTiles[drawn.tileId]} />
                <div>
                  <strong>Drawn tile</strong>
                  <p>{core.tiles.drawPile.length} in draw pile · {core.tiles.discardFaceUp.length} discarded</p>
                </div>
              </div>}
              {options.length === 0 ? <p>Waiting for {playerLabel(activePlayer)}.</p>
                : placements.size > 0 && !selectedCoord ? <p>Select a + space to place the tile.</p>
                  : !selectedTile && tileActions.size > 0 ? <p>Select a marked tile to see the actions available there.</p> : null}
              {!startCommitteeSelected && otherActions.length > 0 && visibleActions.length === 0 && <p>No legal action on this tile. Clear to see all actions.</p>}
              {visibleActions.length > 0 && <OptionPicker core={core} options={visibleActions} selected={actionIndex}
                onSelect={index => setSelection({ ...current, revision, playerID, actionIndex: index })} submit={submit} />}
            </>
          )}
        </aside>
      </div>
      {result && onNewMatch && <div><button type="button" className="new-match" onClick={onNewMatch}>Start a new match</button></div>}
    </div>
  );
}

export default function CoreBoard({ G, ctx, _stateID, playerID, isActive, moves }: BoardProps<CoreState>) {
  return <CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID} isActive={isActive}
    submit={option => submitCoreOption(moves, option)} />;
}
