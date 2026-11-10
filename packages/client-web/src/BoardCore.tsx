import { useRef, useState, type CSSProperties } from 'react';
import type { Ctx } from 'boardgame.io';
import type { BoardProps } from 'boardgame.io/react';
import { CoreStages, engineMoveOptions, type EngineMoveOption } from '@bc/game';
import { MatchConfigSchema, type AxialCoord, type CoreState, type Tile } from '@bc/rules';
import CoreHexBoard, { TileFace } from './CoreHexBoard.js';
import CoreSupplies from './CoreSupplies.js';
import CommitteeFormalization from './CommitteeFormalization.js';
import { MeasureDetails, MeasurePanel, RegulationPanel } from './ExpansionPanels.js';
import { expansions, measureName } from './expansion-data.js';
import { playerColor, resortVisuals } from './core-board-visuals.js';
import { PlayerMarker, RegulationBadge, ResourceBadge } from './CoreSymbols.js';
import {
  coordLabel, describeOption, isAuthorityAction, isFormalization, measureAction, movePreview, optionCost, playerLabel,
  regulationLabel, tileLabel, tileOccupation, tileRuleSummary, type MeasureSelection,
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
  computerPlayers?: ReadonlySet<string>;
  submit: (option: EngineMoveOption) => void;
  onNewMatch?: () => void;
}

type SidebarView = 'actions' | 'supplies' | 'measures' | 'regulations';

export function CoreView({ G, ctx, revision, playerID, isActive = true, computerPlayers, submit, onNewMatch }: CoreViewProps) {
  const [sidebarView, setSidebarView] = useState<SidebarView>('actions');
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
  const counterLobby = core.counterLobbies?.find(effect => effect.tileId === selectedTile);
  const damaged = core.damagedResorts?.some(effect => effect.tileId === selectedTile);
  const enabledExpansions = expansions.filter(expansion => G.exp[expansion.id]?.measures);
  const startCommitteeSelected = inspectedTile?.kind === 'StartCommittee';
  const drawn = core.tiles.drawResolution;
  const activePlayer = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const isComputerTurn = computerPlayers?.has(activePlayer);
  const stage = ctx.activePlayers?.[activePlayer];
  const resolvingDecision = stage === CoreStages.ResolveHotspot || stage === CoreStages.ResolveRegulationFollowUp
    || stage === CoreStages.ChooseDisplacement;
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
  const legalMeasures = otherActions.flatMap(option => measureAction(option) ?? []);
  const playableCards = new Set(legalMeasures.filter(card => card.action === 'play').map(card => card.id));
  const canTakeMeasure = legalMeasures.some(card => card.action === 'take');
  const keepsAction = G.cfg.variants.measureRegulationAccess && stage === CoreStages.ExactlyOnePoliticalAction
    && enabledExpansions.every(({ id }) => !G.exp[id]?.measures?.hands[activePlayer]?.length);
  const authorityTile = otherActions.find(isAuthorityAction)?.contextTile;
  const phase = drawn ? 'Place the drawn tile' : stage === CoreStages.AdditionalPoliticalAction ? 'Choose an additional political action'
    : stage === CoreStages.ExactlyOnePoliticalAction ? 'Choose a political action' : stage === CoreStages.ResolveHotspot ? 'Resolve a Hotspot'
    : stage === CoreStages.ResolveRegulationFollowUp ? 'Resolve a Regulation'
    : stage === CoreStages.ChooseDisplacement ? 'Choose where your displaced marker goes' : 'Resolve a decision';
  const status = result ? (result.winners.length > 1 ? `Shared win · ${result.winners.map(playerLabel).join(' and ')}`
    : `${playerLabel(result.winners[0])} wins`) : isComputerTurn ? `${playerLabel(activePlayer)} (computer) is thinking…`
    : `${playerLabel(activePlayer)} to act`;

  const inspectTile = (tileId: string) => {
    setSidebarView('actions');
    setSelection({ revision, playerID, tile: tileId });
  };

  const focusInspector = () => {
    requestAnimationFrame(() => inspector.current?.focus({ preventScroll: true }));
  };

  return (
    <div className="core-match" style={{ '--acting-color': result ? '#94a3b8' : playerColor(activePlayer) } as CSSProperties}>
      <CoreHexBoard G={G} selectedTile={selectedTile} selectedCoord={selectedCoord} tileActions={tileActions} preview={preview}
        matchEnded={!!result}
        formalizationPlayer={!result && (stage === CoreStages.ExactlyOnePoliticalAction || stage === CoreStages.AdditionalPoliticalAction)
          ? activePlayer : undefined}
        status={<div className="core-turn" aria-live="polite">
          <p className="turn-number">Turn {ctx.turn}{!result && activePlayer !== ctx.currentPlayer
            && ` · ${playerLabel(ctx.currentPlayer)}'s turn`}</p>
          <h2>{!result && <PlayerMarker id={activePlayer} />}{status}</h2>
          {!result && <p className="core-kicker">{phase}</p>}
        </div>}
        matchDetails={<details className="core-match-details">
          <summary>Match details</summary>
          <div className="core-modules" role="group" aria-label="Active modules">
            <span className="core-module">CORE</span>
            {enabledExpansions.map(({ id, resource, label }) => (
              <span key={id} className="core-module" title={label}><ResourceBadge resource={resource} /> EXP {id.slice(-2)}</span>
            ))}
          </div>
          <p className="core-match-seed">Seed <code>{G.matchSeed}</code></p>
        </details>}
        matchAction={onNewMatch && <button type="button" className={result ? 'new-match' : undefined} onClick={onNewMatch}>
          {result ? 'Start a new match' : 'Back to match setup'}
        </button>}
        legalCoords={Array.from(placements.values(), entry => entry.coord)}
        onInspect={tileId => selectedTile === tileId && sidebarView === 'actions' ? setSelection(undefined) : inspectTile(tileId)}
        onPlace={coord => {
          setSidebarView('actions');
          const key = coordLabel(coord);
          const choices = placements.get(key)?.options ?? [];
          if (choices.length === 1 && choices[0].costBreakdown.length === 0) submit(choices[0]);
          else setSelection({ revision, playerID, coord: key });
        }} />
      <div className="core-sidebar" data-view={sidebarView}>
        <div className="core-view-switch" role="group" aria-label="Match views">
          <button type="button" aria-pressed={sidebarView === 'actions'} onClick={() => setSidebarView('actions')}>Actions</button>
          <button type="button" aria-pressed={sidebarView === 'supplies'} onClick={() => setSidebarView('supplies')}>Supplies</button>
          {enabledExpansions.length > 0 && <button type="button" aria-pressed={sidebarView === 'measures'}
            onClick={() => setSidebarView('measures')}>Measures</button>}
          {regulations && <button type="button" aria-pressed={sidebarView === 'regulations'}
            onClick={() => setSidebarView('regulations')}>Regulations</button>}
        </div>
        <aside className="core-inspector core-panel" aria-label="Tile details and actions" ref={inspector} tabIndex={-1}
          hidden={sidebarView !== 'actions'}>
          {!isComputerTurn && (canTakeMeasure || playableCards.size > 0 || authorityTile) &&
            <div className="core-view-switch" role="group" aria-label="Available Measure and Regulation actions">
              {canTakeMeasure && <button type="button" onClick={() => setSidebarView('measures')}>
                {keepsAction ? 'Take a Measure and keep your action' : 'Take a Measure'}
              </button>}
              {Array.from(playableCards, id => <button type="button" key={id} onClick={() => {
                setSelection({ revision, playerID, measure: { id, action: 'play' } });
                focusInspector();
              }}>Play {measureName(id)}</button>)}
              {authorityTile && <button type="button" onClick={() => {
                inspectTile(authorityTile);
                focusInspector();
              }}>Authority Apparatus actions</button>}
            </div>}
          <header className="core-inspector-heading">
            <h3>{selectedMeasure ? 'Measure inspector' : 'Tile inspector'}</h3>
            {(selectedTile || selectedCoord || selectedMeasure) && <button type="button" onClick={() => setSelection(undefined)}>Clear</button>}
          </header>
          <div className="core-inspector-body" key={selectedTile ?? selectedMeasure?.id ?? selectedCoord ?? 'board'}
            tabIndex={0} role="region" aria-label="Inspection details">
            {occupation && inspected && inspectedTile ? <>
              <TileSummary tile={inspectedTile} controller={occupation.controller} label={`Selected tile · ${coordLabel(inspected.coord)}`} />
              <section className="tile-rules">
                <h4>Tile rules</h4>
                <p>{tileRuleSummary(inspectedTile, G.cfg)}</p>
              </section>
              {counterLobby && <p>Counter-lobby suspends the bonus from {counterLobby.lobbyistTileId} for {playerLabel(counterLobby.controller)}.</p>}
              {damaged && <p>Permanent damage · −1 production</p>}
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
              {(inspectedTile.kind === 'StartCommittee' || inspectedTile.kind === 'Committee') && (
                <CommitteeFormalization G={G} ctx={ctx} kind={inspectedTile.kind} tileId={inspected.tileId} playerID={playerID}
                  available={visibleActions.some(isFormalization)} />
              )}
            </> : selectedMeasure ? <>
              <h4>{measureName(selectedMeasure.id)}</h4>
              <MeasureDetails G={G} selection={selectedMeasure} available={!resolvingDecision && visibleActions.length > 0} />
            </> : selectedCoord && <h4>Placement at {selectedCoord}</h4>}
            {result ? <p>Final score is the number of influence markers each player has on the board.</p> : (
              <>
                {drawn && <div className="core-offer">
                  <TileSummary tile={core.allTiles[drawn.tileId]} label="Drawn tile" />
                  <section className="tile-rules">
                    <h4>Drawn tile rules</h4>
                    <p>{tileRuleSummary(core.allTiles[drawn.tileId], G.cfg)}</p>
                  </section>
                  <p>{core.tiles.discardFaceUp.length} discarded</p>
                </div>}
                {options.length === 0 ? <p>Waiting for {playerLabel(activePlayer)}{isComputerTurn && ' (computer)'}.</p>
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
        <CoreSupplies G={G} activePlayer={result ? undefined : activePlayer} computerPlayers={computerPlayers} />
        {enabledExpansions.length > 0 && <section className="core-operations core-panel" aria-label="Measures"
          hidden={sidebarView !== 'measures'} tabIndex={0}>
          <MeasurePanel G={G} options={otherActions} selected={selectedMeasure} onSelect={measure => {
            setSidebarView('actions');
            setSelection({ revision, playerID, measure });
            focusInspector();
          }} />
        </section>}
        {regulations && <section className="core-operations core-panel" aria-label="Regulation tools"
          hidden={sidebarView !== 'regulations'} tabIndex={0}>
          <RegulationPanel G={G} options={otherActions} onInspect={tileId => {
            inspectTile(tileId);
            focusInspector();
          }} />
        </section>}
      </div>
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
