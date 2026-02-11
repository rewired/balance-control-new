import React, { useMemo, useState } from 'react';
import { Client as BGClient, Lobby } from 'boardgame.io/react';
import { CounterGame } from '@bc/game';
import CounterBoard from './Board';

type Env = { VITE_SERVER_URL?: string };
const env = (import.meta as unknown as { env: Env }).env;
const serverURL = env?.VITE_SERVER_URL ?? 'http://localhost:8000';

const LocalClient = BGClient({ game: CounterGame, board: CounterBoard });

export function App() {
  const [mode, setMode] = useState<'hotseat' | 'network'>(() => (location.hash.includes('network') ? 'network' : 'hotseat'));
  const gameComponents = useMemo(() => [{ game: CounterGame, board: CounterBoard }], []);
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>BALANCE // CONTROL — Hello Game</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode('hotseat'); location.hash = '#hotseat'; }}>Hotseat</button>
        <button onClick={() => { setMode('network'); location.hash = '#network'; }}>Network</button>
      </div>

      {mode === 'hotseat' ? (
        <div>
          <h2>Hotseat</h2>
          <LocalClient />
        </div>
      ) : (
        <div>
          <h2>Network (Lobby)</h2>
          <p style={{ color: '#555' }}>Server: {serverURL}</p>
          <Lobby
            gameServer={serverURL}
            lobbyServer={serverURL}
            gameComponents={gameComponents}
          />
        </div>
      )}
    </div>
  );
}
