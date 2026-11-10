import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { createBCGame, createComputerPosition, createMatchLogRecorder, type EngineMoveOption } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';
import CoreMatchSetup, { type CoreMatchSettings } from './CoreMatchSetup.js';
import StartScreen from './StartScreen.js';
import type { ComputerMoveRequest, ComputerMoveResponse } from './computer.worker.js';

function HotseatMatch({ settings, onNewMatch, server }: { settings: CoreMatchSettings; onNewMatch: () => void; server: string }) {
  const [game] = useState(() => createBCGame(settings.setupData));
  const [computerPlayers] = useState(() => new Set(settings.players?.flatMap((player, index) => player === 'human' ? [] : [String(index)])));
  const [client] = useState(() => Client({
    game, numPlayers: settings.numPlayers, playerID: '0', debug: false,
  }));
  const [matchID] = useState(() => crypto.randomUUID());
  const [recorder] = useState(() => createMatchLogRecorder(client.store.getState(), {
    mode: 'hotseat', matchID,
    seats: Object.fromEntries(settings.players?.map((seat, index) => [String(index), seat]) ?? []),
  }));
  const [state, setState] = useState(() => client.getState());
  const [saveError, setSaveError] = useState(false);
  const [computerError, setComputerError] = useState<string>();
  const [retry, setRetry] = useState(0);
  const computerWorker = useRef<Worker>();
  const lastSave = useRef(0);
  const saveLog = useCallback(async () => {
    const request = ++lastSave.current;
    try {
      const response = await fetch(`${server.replace(/\/$/, '')}/match-logs/hotseat/${matchID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recorder.log),
      });
      if (!response.ok) throw new Error(`Match log save failed with HTTP ${response.status}`);
      if (request === lastSave.current) setSaveError(false);
    } catch (error) {
      console.error('Match log save failed', error);
      if (request === lastSave.current) setSaveError(true);
    }
  }, [matchID, recorder, server]);

  useEffect(() => { void saveLog(); }, [saveLog]);
  const submit = useCallback((option: EngineMoveOption) => {
    client.updatePlayerID(option.playerID);
    submitCoreOption(client.moves, option);
    const next = client.store.getState();
    if (next._stateID === recorder.log.steps.length) return;
    recorder.record(next, next.deltalog ?? []);
    void saveLog();
  }, [client, recorder, saveLog]);

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
        submit(data.option);
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
  }, [client, computerPlayers, revision, retry, server, settings.players, submit]);

  if (!state) return null;
  const { G, ctx, _stateID } = state;
  const playerID = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  const isComputerTurn = computerPlayers.has(playerID);
  return <>
    {saveError && <p role="alert">
      Could not save the match log.{' '}
      <button type="button" onClick={() => void saveLog()}>Retry saving</button>
    </p>}
    {computerError && <div role="alert">
      {computerError}{' '}
      <button type="button" onClick={() => { setComputerError(undefined); setRetry(attempt => attempt + 1); }}>Retry move</button>
    </div>}
    <CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID} isActive={!isComputerTurn}
      computerPlayers={computerPlayers} onNewMatch={onNewMatch}
      submit={option => {
        if (isComputerTurn || client.store.getState()._stateID !== _stateID) return;
        submit(option);
      }} />
  </>;
}

export default function HotseatCore({ server }: { server: string }) {
  const [settings, setSettings] = useState<CoreMatchSettings>();
  const [playing, setPlaying] = useState(false);
  return playing && settings
    ? <HotseatMatch settings={settings} server={server} onNewMatch={() => setPlaying(false)} />
    : <StartScreen>
      <CoreMatchSetup title="New hotseat match" buttonLabel="Start match" initial={settings} botServer={server} onStart={configuration => {
        setSettings(configuration);
        setPlaying(true);
      }} />
    </StartScreen>;
}
