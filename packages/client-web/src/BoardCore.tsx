import { useState } from 'react';
import type { Ctx } from 'boardgame.io';
import type { BoardProps } from 'boardgame.io/react';
import { engineMoveOptions, type EngineMoveOption } from '@bc/game';
import type { CoreState } from '@bc/rules';

type Moves = Record<string, (...args: unknown[]) => void>;

export function submitCoreOption(moves: Moves, option: EngineMoveOption): void {
  moves[option.moveType](...option.parameters);
}

function OptionPicker({ options, submit }: { options: EngineMoveOption[]; submit: (option: EngineMoveOption) => void }) {
  const [selected, setSelected] = useState(0);
  return (
    <form onSubmit={event => {
      event.preventDefault();
      const option = options[selected];
      if (option) submit(option);
    }}>
      <label>
        Action{' '}
        <select value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {options.map(({ moveType, parameters }, index) => (
            <option key={index} value={index}>{moveType} {JSON.stringify(parameters)}</option>
          ))}
        </select>
      </label>{' '}
      <button type="submit" disabled={!options[selected]}>Confirm</button>
    </form>
  );
}

interface CoreViewProps {
  G: CoreState;
  ctx: Ctx;
  revision: number;
  playerID?: string | null;
  submit: (option: EngineMoveOption) => void;
}

export function CoreView({ G, ctx, revision, playerID, submit }: CoreViewProps) {
  const activePlayer = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const stage = ctx.activePlayers?.[activePlayer];
  const options = playerID == null ? [] : engineMoveOptions(G, ctx, playerID);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div><strong>{ctx.gameover === undefined ? `Core ${stage ?? ''}` : 'Game over'}</strong></div>
      <div>Turn {ctx.turn}, player {ctx.currentPlayer}</div>
      {stage && activePlayer !== ctx.currentPlayer && <div>Decision by player {activePlayer}</div>}
      {G.exp.core.tiles.drawResolution && <div>Drawn <code>{G.exp.core.tiles.drawResolution.tileId}</code></div>}
      {options.length > 0 && (
        <OptionPicker key={revision} options={options} submit={submit} />
      )}
    </div>
  );
}

export default function CoreBoard({ G, ctx, _stateID, playerID, isActive, moves }: BoardProps<CoreState>) {
  return <CoreView G={G} ctx={ctx} revision={_stateID} playerID={isActive ? playerID : null}
    submit={option => submitCoreOption(moves, option)} />;
}
