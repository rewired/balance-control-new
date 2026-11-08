import { useState } from 'react';
import { Client as BGClient, Lobby } from 'boardgame.io/react';
import { CounterGame, CoreGame } from '@bc/game';
import CounterBoard from './Board.js';
import CoreBoard from './BoardCore.js';
import HotseatCore from './HotseatCore.js';

type Env = { VITE_SERVER_URL?: string };
const env = (import.meta as unknown as { env: Env }).env;
const serverURL = env?.VITE_SERVER_URL ?? 'http://localhost:8000';

const LocalClientCounter = BGClient({ game: CounterGame, board: CounterBoard });
const gameComponents = [{ game: CounterGame, board: CounterBoard }, { game: CoreGame, board: CoreBoard }];

export function App() {
  const [mode, setMode] = useState<'hotseat' | 'network'>(() => location.hash.includes('network') ? 'network' : 'hotseat');
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1>BALANCE // CONTROL</h1>
      <nav aria-label="Play modes" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button type="button" aria-pressed={mode === 'hotseat'} onClick={() => {
          setMode('hotseat');
          location.hash = '#hotseat';
        }}>CORE hotseat</button>
        <button type="button" aria-pressed={mode === 'network'} onClick={() => {
          setMode('network');
          location.hash = '#network';
        }}>Network</button>
      </nav>

      {mode === 'hotseat' ? (
        <>
          <HotseatCore />
          <details style={{ marginTop: 16 }}>
            <summary>Counter demo</summary>
            <LocalClientCounter />
          </details>
        </>
      ) : (
        <>
          <h2>Network lobby</h2>
          <p>Server: {serverURL}</p>
          <Lobby gameServer={serverURL} lobbyServer={serverURL} gameComponents={gameComponents} />
        </>
      )}
    </main>
  );
}