import React, { useMemo, useState } from 'react';
import { Client as BGClient, Lobby } from 'boardgame.io/react';
import { CounterGame, CoreGame } from '@bc/game';
import CounterBoard from './Board';
import CoreBoard from './BoardCore';

type Env = { VITE_SERVER_URL?: string };
const env = (import.meta as unknown as { env: Env }).env;
const serverURL = env?.VITE_SERVER_URL ?? 'http://localhost:8000';

const LocalClientCounter = BGClient({ game: CounterGame, board: CounterBoard });
const LocalClientCore = BGClient({ game: CoreGame, board: CoreBoard });

export function App() {
  const [mode, setMode] = useState<'Hotseat — Counter/Core' | 'network'>(() => (location.hash.includes('network') ? 'network' : 'Hotseat — Counter/Core'));
  const gameComponents = useMemo(() => [{ game: CounterGame, board: CounterBoard }, { game: CoreGame, board: CoreBoard }], []);
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>BALANCE // CONTROL — Hello Game</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode('Hotseat — Counter/Core'); location.hash = '#Hotseat — Counter/Core'; }}>Hotseat — Counter/Core</button>
        <button onClick={() => { setMode('network'); location.hash = '#network'; }}>Network</button>
      </div>

      {mode === 'Hotseat — Counter/Core' ? (
        <div>
          <h2>Hotseat — Counter/Core</h2>
          <div style={{display:'flex', gap:16}}><div><h3>Counter</h3><LocalClientCounter /></div><div><h3>Core</h3><LocalClientCore /></div></div>
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



