import { useEffect, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { CoreGame } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';

function HotseatMatch({ onNewMatch }: { onNewMatch: () => void }) {
  const [client] = useState(() => Client({ game: CoreGame, numPlayers: 2, playerID: '0' }));
  const [state, setState] = useState(() => client.getState());
  useEffect(() => {
    const unsubscribe = client.subscribe(setState);
    client.start();
    return () => {
      unsubscribe();
      client.stop();
    };
  }, [client]);

  if (!state) return null;
  const { G, ctx, _stateID } = state;
  const playerID = Object.keys(ctx.activePlayers ?? {})[0] ?? ctx.currentPlayer;
  return <CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID} onNewMatch={onNewMatch}
    submit={option => {
      client.updatePlayerID(option.playerID);
      submitCoreOption(client.moves, option);
    }} />;
}

export default function HotseatCore() {
  const [match, setMatch] = useState(0);
  return <HotseatMatch key={match} onNewMatch={() => setMatch(previous => previous + 1)} />;
}