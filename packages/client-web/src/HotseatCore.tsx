import { useEffect, useRef, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { createBCGame, createComputerPosition } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';
import CoreMatchSetup, { type CoreMatchSettings } from './CoreMatchSetup.js';
import type { ComputerMoveRequest, ComputerMoveResponse } from './computer.worker.js';

function HotseatMatch({ settings, onNewMatch }: { settings: CoreMatchSettings; onNewMatch: () => void }) {
  const [game] = useState(() => createBCGame(settings.setupData));
  const [computerPlayers] = useState(() => {
    const count = settings.computerPlayers ?? 0;
    return new Set(Array.from({ length: count }, (_, index) => String(settings.numPlayers - count + index)));
  });
  const [client] = useState(() => Client({
    game, numPlayers: settings.numPlayers, playerID: '0', debug: false,
  }));
  const [state, setState] = useState(() => client.getState());
  const [computerError, setComputerError] = useState(false);
  const computerWorker = useRef<Worker>();
  useEffect(() => {
    const unsubscribe = client.subscribe(setState);
    client.start();
    return () => {
      unsubscribe();
      client.stop();
      computerWorker.current?.terminate();
      computerWorker.current = undefined;
    };
  }, [client]);

  const revision = state?._stateID;
  useEffect(() => {
    if (revision === undefined || computerPlayers.size === 0) return;
    const current = client.store.getState();
    const playerID = Object.keys(current.ctx.activePlayers ?? {})[0] ?? current.ctx.currentPlayer;
    if (current.ctx.gameover !== undefined || !computerPlayers.has(playerID)) return;
    const onMove = ({ data }: MessageEvent<ComputerMoveResponse>) => {
      if (data.revision !== revision || client.store.getState()._stateID !== revision) return;
      if (data.option) {
        client.updatePlayerID(playerID);
        submitCoreOption(client.moves, data.option);
        if (client.store.getState()._stateID !== revision) return;
      }
      setComputerError(true);
    };
    const onError = (error: ErrorEvent) => {
      console.error('Computer move failed', error.message, error.filename, error.lineno);
      setComputerError(true);
    };
    try {
      const worker = computerWorker.current ??= new Worker(new URL('./computer.worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', onMove);
      worker.addEventListener('error', onError);
      worker.postMessage({ position: createComputerPosition(current), playerID } satisfies ComputerMoveRequest);
      return () => {
        worker.removeEventListener('message', onMove);
        worker.removeEventListener('error', onError);
      };
    } catch (error) {
      console.error('Computer player could not start', error);
      setComputerError(true);
    }
  }, [client, computerPlayers, revision]);

  if (!state) return null;
  const { G, ctx, _stateID } = state;
  const playerID = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const isComputerTurn = computerPlayers.has(playerID);
  return <>
    {computerError && <div role="alert">
      The computer could not complete its move. <button type="button" onClick={onNewMatch}>Back to match setup</button>
    </div>}
    <CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID} isActive={!isComputerTurn}
      computerPlayers={computerPlayers} onNewMatch={onNewMatch}
      submit={option => {
        if (isComputerTurn || client.store.getState()._stateID !== _stateID) return;
        client.updatePlayerID(option.playerID);
        submitCoreOption(client.moves, option);
      }} />
  </>;
}

export default function HotseatCore() {
  const [settings, setSettings] = useState<CoreMatchSettings>();
  const [playing, setPlaying] = useState(false);
  return playing && settings
    ? <HotseatMatch settings={settings} onNewMatch={() => setPlaying(false)} />
    : <CoreMatchSetup title="New hotseat match" buttonLabel="Start match" initial={settings} allowComputerPlayers onStart={configuration => {
      setSettings(configuration);
      setPlaying(true);
    }} />;
}
