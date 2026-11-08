import { useEffect, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { CoreGame } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';

export default function HotseatCore() {
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
  const playerID = Object.keys(ctx.activePlayers ?? {})[0];
  return <CoreView G={G} ctx={ctx} revision={_stateID} playerID={playerID}
    submit={option => {
      client.updatePlayerID(option.playerID);
      submitCoreOption(client.moves, option);
    }} />;
}
