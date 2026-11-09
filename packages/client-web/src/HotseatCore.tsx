import { useEffect, useRef, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { createBCGame, createComputerPosition, createMatchLog } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';
import CoreMatchSetup, { type CoreMatchSettings } from './CoreMatchSetup.js';
import type { ComputerMoveRequest, ComputerMoveResponse } from './computer.worker.js';

function HotseatMatch({ settings, onNewMatch, server }: { settings: CoreMatchSettings; onNewMatch: () => void; server: string }) {
  const [game] = useState(() => createBCGame(settings.setupData));
  const [computerPlayers] = useState(() => new Set(settings.players?.flatMap((player, index) => player === 'human' ? [] : [String(index)])));
  const [client] = useState(() => Client({
    game, numPlayers: settings.numPlayers, playerID: '0', debug: false,
  }));
  // The local reducer can mutate nested boardgame.io counters in the original context.
  const [initialState] = useState(() => structuredClone(client.getInitialState()));
  const [state, setState] = useState(() => client.getState());
  const [exportError, setExportError] = useState<string>();
  const [computerError, setComputerError] = useState<string>();
  const [retry, setRetry] = useState(0);
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
      setComputerError(data.error ?? 'The computer could not complete its move.');
    };
    const onError = (error: ErrorEvent) => {
      console.error('Computer move failed', error.message, error.filename, error.lineno);
      computerWorker.current?.terminate();
      computerWorker.current = undefined;
      setComputerError('The computer could not complete its move.');
    };
    try {
      const worker = computerWorker.current ??= new Worker(new URL('./computer.worker.ts', import.meta.url), { type: 'module' });
      worker.addEventListener('message', onMove);
      worker.addEventListener('error', onError);
      const seat = settings.players?.[Number(playerID)];
      const ollama = seat?.startsWith('ollama:') ? { server, model: seat.slice(7) } : undefined;
      worker.postMessage({ position: createComputerPosition(current), playerID, ollama } satisfies ComputerMoveRequest);
      return () => {
        worker.removeEventListener('message', onMove);
        worker.removeEventListener('error', onError);
      };
    } catch (error) {
      console.error('Computer player could not start', error);
      setComputerError('The computer could not start.');
    }
  }, [client, computerPlayers, revision, retry, server, settings.players]);

  if (!state) return null;
  const { G, ctx, _stateID } = state;
  const playerID = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const isComputerTurn = computerPlayers.has(playerID);
  const downloadLog = () => {
    setExportError(undefined);
    try {
      const seats = Object.fromEntries(settings.players?.map((seat, index) => [String(index), seat]) ?? []);
      const log = createMatchLog(initialState, client.store.getState(), client.log ?? [], { mode: 'hotseat', seats });
      const url = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2) + '\n'], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hotseat.match-log.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error('Match log export failed', error);
      setExportError('The match log could not be exported.');
    }
  };
  return <>
    <div>
      {!ctx.gameover && <button type="button" onClick={onNewMatch}>Back to match setup</button>}
      <button type="button" onClick={downloadLog}>Download match log</button>
    </div>
    {exportError && <p role="alert">{exportError}</p>}
    {computerError && <div role="alert">
      {computerError}{' '}
      <button type="button" onClick={() => { setComputerError(undefined); setRetry(attempt => attempt + 1); }}>Retry move</button>
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

export default function HotseatCore({ server }: { server: string }) {
  const [settings, setSettings] = useState<CoreMatchSettings>();
  const [playing, setPlaying] = useState(false);
  return playing && settings
    ? <HotseatMatch settings={settings} server={server} onNewMatch={() => setPlaying(false)} />
    : <CoreMatchSetup title="New hotseat match" buttonLabel="Start match" initial={settings} botServer={server} onStart={configuration => {
      setSettings(configuration);
      setPlaying(true);
    }} />;
}
