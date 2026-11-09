import { useRef, useState, type CSSProperties } from 'react';
import type { Ctx } from 'boardgame.io';
import type { BoardProps } from 'boardgame.io/react';
import { CoreStages, engineMoveOptions, type EngineMoveOption } from '@bc/game';
import { MatchConfigSchema, type AxialCoord, type CoreState, type Tile } from '@bc/rules';
import CoreHexBoard, { TileFace } from './CoreHexBoard.js';
import CoreSupplies from './CoreSupplies.js';
import StartCommitteeDetails from './StartCommitteeDetails.js';
import { MeasureDetails, MeasurePanel, RegulationPanel } from './ExpansionPanels.js';
import { expansions, measureName } from './expansion-data.js';
import { playerColor, resortVisuals } from './core-board-visuals.js';
import { PlayerMarker, RegulationBadge, ResourceBadge } from './CoreSymbols.js';
import {
  coordLabel, describeOption, isFormalization, measureAction, movePreview, optionCost, playerLabel,
  regulationLabel, tileLabel, tileOccupation, type MeasureSelection,
} from './core-board-labels.js';

type Moves = Record<string, (...args: unknown[]) => void>;

export function submitCoreOption(moves: Moves, option: EngineMoveOption): void {
  moves[option.moveType](...option.parameters);
}

function OptionPicker({ G, options, selected, onSelect, submit }: {
  G: CoreState;
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
            <option key={index} value={index}>{describeOption(G, option)} · {optionCost(option)}</option>
          ))}
        </select>
      </label>
      <p className="core-action-preview">{describeOption(G, option)}</p>
      {option.costBreakdown.length ? <div className="action-cost">
        <strong>Cost:</strong>
        {option.costBreakdown.map(({ playerID, resource, amount }, index) => (
          <span className="action-cost-item" key={index}>
            {playerID !== option.playerID && `${playerLabel(playerID)} pays `}{amount} <ResourceBadge resource={resource} />
          </span>
        ))}
      </div> : <p>Cost: Free</p>}
      <button type="submit">Confirm</button>
    </form>
  );
}

function TileSummary({ tile, label, controller }: { tile: Tile; label: string; controller?: string | null }) {
  return (
    <div className="tile-summary">
      <TileFace tile={tile} controller={controller} />
      <div>
        <p className="core-kicker">{label}</p>
        <h4>{tile.kind === 'ResortTile' ? resortVisuals[tile.resort]?.name ?? tile.resort : tileLabel(tile)}</h4>
        {tile.kind === 'ResortTile' && <p>{tile.resort} · Printed output {tile.w}</p>}
      </div>
    </div>
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
  const [expansionView, setExpansionView] = useState<'measures' | 'regulations'>('measures');
  const inspector = useRef<HTMLElement>(null);
  const [selection, setSelection] = useState<{
    revision: number;
    playerID?: string | null;
    tile?: string;
    coord?: string;
    measure?: MeasureSelection;
    actionIndex?: number;
  }>();
  const current = selection?.revision === revision && selection.playerID === playerID ? selection : undefined;
  const selectedTile = current?.tile;
  const selectedCoord = current?.coord;
  const selectedMeasure = current?.measure;
  const core = G.exp.core;
  const inspected = core.tiles.board.find(placement => placement.tileId === selectedTile);
  const occupation = inspected && tileOccupation(G, inspected);
  const inspectedTile = inspected && core.allTiles[inspected.tileId];
  const regulations = G.exp.exp02?.regulations;
  const tileRegulations = regulations?.attached.filter(item => item.tileId === selectedTile) ?? [];
  const enabledExpansions = expansions.filter(expansion => G.exp[expansion.id]?.measures);
  const startCommitteeSelected = inspectedTile?.kind === 'StartCommittee';
  const drawn = core.tiles.drawResolution;
  const activePlayer = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const stage = ctx.activePlayers?.[activePlayer];
  const resolvingDecision = stage === CoreStages.ResolveHotspot || stage === CoreStages.ResolveRegulationFollowUp;
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
  const visibleActions = resolvingDecision ? otherActions
    : selectedMeasure ? otherActions.filter(option => {
      const card = measureAction(option);
      return card?.id === selectedMeasure.id && card.action === selectedMeasure.action;
    }) : selectedCoord ? placements.get(selectedCoord)?.options ?? []
    : selectedTile ? tileActions.get(selectedTile) ?? [] : otherActions;
  const actionIndex = current?.actionIndex ?? 0;
  const preview = movePreview(visibleActions[actionIndex]);
  const phase = drawn ? 'Place the drawn tile' : stage === CoreStages.AdditionalPoliticalAction ? 'Choose an additional political action'
    : stage === CoreStages.ExactlyOnePoliticalAction ? 'Choose a political action' : stage === CoreStages.ResolveHotspot ? 'Resolve a Hotspot'
      : stage === CoreStages.ResolveRegulationFollowUp ? 'Resolve a Regulation' : 'Resolve a decision';
  const status = result ? (result.winners.length > 1 ? `Shared win · ${result.winners.map(playerLabel).join(' and ')}`
    : `${playerLabel(result.winners[0])} wins`) : `${playerLabel(activePlayer)} to act`;

  const inspectTile = (tileId: string) => {
    setSelection({ revision, playerID, tile: tileId });
  };

  return (
    <div className="core-match" style={{ '--acting-color': result ? '#94a3b8' : playerColor(activePlayer) } as CSSProperties}>
      <header className="core-heading core-panel">
        <div className="core-modules" aria-label="Active modules">
          <span className="core-module">CORE</span>
          {enabledExpansions.map(({ id, resource, label }) => (
            <span key={id} className="core-module" title={label}><ResourceBadge resource={resource} /> EXP {id.slice(-2)}</span>
          ))}
        </div>
        <div className="core-turn" aria-live="polite">
          <p className="turn-number">Turn {ctx.turn}{!result && activePlayer !== ctx.currentPlayer
            && ` · ${playerLabel(ctx.currentPlayer)}'s turn`}</p>
          {!result && <PlayerMarker id={activePlayer} />}
          <div>
            {!result && <p className="core-kicker">{phase}</p>}
            <h2>{status}</h2>
          </div>
        </div>
        <p className="core-match-seed">Seed <code>{G.matchSeed}</code></p>
      </header>
      <div className="core-play">
        <CoreHexBoard G={G} selectedTile={selectedTile} selectedCoord={selectedCoord} tileActions={tileActions} preview={preview}
          legalCoords={Array.from(placements.values(), entry => entry.coord)}
          onInspect={tileId => selectedTile === tileId ? setSelection(undefined) : inspectTile(tileId)}
          onPlace={coord => {
            const key = coordLabel(coord);
            const choices = placements.get(key)?.options ?? [];
            if (choices.length === 1 && choices[0].costBreakdown.length === 0) submit(choices[0]);
            else setSelection({ revision, playerID, coord: key });
          }} />
        <aside className="core-inspector core-panel" aria-label="Tile details and actions" ref={inspector} tabIndex={-1}>
          <header className="core-inspector-heading">
            <div><p className="core-kicker">Details and actions</p><h3>{selectedMeasure ? 'Measure inspector' : 'Tile inspector'}</h3></div>
            {(selectedTile || selectedCoord || selectedMeasure) && <button type="button" onClick={() => setSelection(undefined)}>Clear</button>}
          </header>
          <div className="core-inspector-body" key={selectedTile ?? selectedMeasure?.id ?? selectedCoord ?? 'board'}
            tabIndex={0} role="region" aria-label="Inspection details">
            {occupation && inspected && inspectedTile ? <>
              <TileSummary tile={inspectedTile} controller={occupation.controller} label={`Selected tile · ${coordLabel(inspected.coord)}`} />
              <p className="inspected-control"><strong>{occupation.control}</strong></p>
              {occupation.influence.length ? (
                <table className="inspected-influence">
                  <caption>Influence on tile</caption>
                  <thead><tr><th scope="col">Player</th><th scope="col">Markers</th><th scope="col">Virtual</th></tr></thead>
                  <tbody>{occupation.influence.map(({ id, count, virtual }) => (
                    <tr key={id} data-controls={id === occupation.controller}>
                      <th scope="row"><PlayerMarker id={id} />{playerLabel(id)}</th>
                      <td>{count}</td><td className={virtual ? 'virtual-influence' : undefined}>{virtual ? `+${virtual}` : '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p>No influence here.</p>}
              {tileRegulations.length > 0 && <section className="core-tile-regulations">
                <h4>Attached regulations</h4>
                <ul className="expansion-list" aria-label="Regulations on this tile">
                  {tileRegulations.map(item => <li key={item.id} className="inspected-regulation">
                    <RegulationBadge kind={item.kind} />{regulationLabel(item)}
                  </li>)}
                </ul>
              </section>}
              {startCommitteeSelected && <StartCommitteeDetails G={G} ctx={ctx} tileId={inspected.tileId} playerID={playerID}
                available={visibleActions.some(isFormalization)} />}
            </> : selectedMeasure ? <>
              <h4>{measureName(selectedMeasure.id)}</h4>
              <MeasureDetails selection={selectedMeasure} available={!resolvingDecision && visibleActions.length > 0} />
            </> : selectedCoord && <h4>Placement at {selectedCoord}</h4>}
            {result ? <p>Final score is the number of influence markers each player has on the board.</p> : (
              <>
                {drawn && <div className="core-offer">
                  <TileSummary tile={core.allTiles[drawn.tileId]} label="Drawn tile" />
                  <p>{core.tiles.drawPile.length} in draw pile · {core.tiles.discardFaceUp.length} discarded</p>
                </div>}
                {options.length === 0 ? <p>Waiting for {playerLabel(activePlayer)}.</p>
                  : resolvingDecision ? <p>{phase}. Choose how to proceed below.</p>
                    : placements.size > 0 && !selectedCoord ? <p>Select a + space on the board to place the tile.</p>
                      : !selectedTile && !selectedMeasure && tileActions.size > 0
                        ? <p>Select a marked tile to see the actions available there.</p> : null}
                {selectedTile && !startCommitteeSelected && otherActions.length > 0 && visibleActions.length === 0
                  && <p>No legal action on this tile. Clear to see all actions.</p>}
              </>
            )}
          </div>
          {!result && visibleActions.length > 0 && <OptionPicker G={G} options={visibleActions} selected={actionIndex}
            onSelect={index => setSelection({ ...current, revision, playerID, actionIndex: index })} submit={submit} />}
        </aside>
      </div>
      <div className="core-dashboard" data-expanded={enabledExpansions.length > 0 || !!regulations}>
        <CoreSupplies G={G} activePlayer={result ? undefined : activePlayer} />
        {(enabledExpansions.length > 0 || regulations) && (
          <section className="core-operations core-panel" aria-label="Expansion tools">
            {regulations && enabledExpansions.length > 0 && (
              <div className="core-view-switch" role="group" aria-label="Expansion views">
                <button type="button" aria-pressed={expansionView === 'measures'} onClick={() => setExpansionView('measures')}>Measures</button>
                <button type="button" aria-pressed={expansionView === 'regulations'} onClick={() => setExpansionView('regulations')}>
                  Regulations · {regulations.attached.length}
                </button>
              </div>
            )}
            {regulations && (expansionView === 'regulations' || !enabledExpansions.length)
              ? <RegulationPanel G={G} options={otherActions} onInspect={tileId => {
                inspectTile(tileId);
                inspector.current?.focus();
              }} />
              : <MeasurePanel G={G} options={otherActions} selected={selectedMeasure} onSelect={measure => {
                setSelection({ revision, playerID, measure });
                inspector.current?.focus();
              }} />}
          </section>
        )}
      </div>
      {result && onNewMatch && <div><button type="button" className="new-match" onClick={onNewMatch}>Start a new match</button></div>}
    </div>
  );
}

export default function CoreBoard({ G, ctx, _stateID, playerID, isActive, moves }: BoardProps<CoreState>) {
  if (!MatchConfigSchema.shape.topology.safeParse(G.cfg.topology).success) {
    return <p role="status">This match uses a board topology that is no longer supported.</p>;
  }
  return <CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID} isActive={isActive}
    submit={option => submitCoreOption(moves, option)} />;
}
