import { useEffect, useState } from 'react';
import { Client } from 'boardgame.io/client';
import { createBCGame } from '@bc/game';
import { CoreView, submitCoreOption } from './BoardCore.js';
import CoreMatchSetup, { type CoreMatchSettings } from './CoreMatchSetup.js';

function HotseatMatch({ settings, onNewMatch }: { settings: CoreMatchSettings; onNewMatch: () => void }) {
  const [client] = useState(() => Client({
    game: createBCGame(settings.setupData), numPlayers: settings.numPlayers, playerID: '0', debug: false,
  }));
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
  const [settings, setSettings] = useState<CoreMatchSettings>();
  const [playing, setPlaying] = useState(false);
  return playing && settings
    ? <HotseatMatch settings={settings} onNewMatch={() => setPlaying(false)} />
    : <CoreMatchSetup title="New hotseat match" buttonLabel="Start match" initial={settings} onStart={configuration => {
      setSettings(configuration);
      setPlaying(true);
    }} />;
}
