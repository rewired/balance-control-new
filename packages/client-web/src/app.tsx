import { useState } from 'react';
import { Client as BGClient } from 'boardgame.io/react';
import { CounterGame } from '@bc/game';
import CounterBoard from './Board.js';
import HotseatCore from './HotseatCore.js';
import NetworkLobby from './NetworkLobby.js';

type Env = { VITE_SERVER_URL?: string };
const env = (import.meta as unknown as { env: Env }).env;
const serverURL = env?.VITE_SERVER_URL ?? 'http://localhost:8000';

const LocalClientCounter = BGClient({ game: CounterGame, board: CounterBoard, debug: false });

export function App() {
  const [mode, setMode] = useState<'hotseat' | 'network'>(() => location.hash.includes('network') ? 'network' : 'hotseat');
  return (
    <main className="core-shell">
      <header className="core-masthead">
        <div className="core-brand"><span className="core-brand-mark" aria-hidden="true">{'//'}</span><h1>BALANCE // CONTROL</h1></div>
        <nav className="core-mode" aria-label="Play modes">
          <button type="button" aria-pressed={mode === 'hotseat'} onClick={() => {
            setMode('hotseat');
            location.hash = '#hotseat';
          }}>Hotseat</button>
          <button type="button" aria-pressed={mode === 'network'} onClick={() => {
            setMode('network');
            location.hash = '#network';
          }}>Network</button>
        </nav>
      </header>

      {mode === 'hotseat' ? (
        <>
          <HotseatCore />
          <details className="core-demo">
            <summary>Counter demo</summary>
            <LocalClientCounter />
          </details>
        </>
      ) : <NetworkLobby server={serverURL} />}
    </main>
  );
}
