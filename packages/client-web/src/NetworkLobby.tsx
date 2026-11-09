import { useState, type ComponentProps } from 'react';
import { LobbyClient } from 'boardgame.io/client';
import { Lobby } from 'boardgame.io/react';
import { CoreGame, CounterGame } from '@bc/game';
import { MatchSetupDataSchema } from '@bc/rules';
import CounterBoard from './Board.js';
import CoreBoard from './BoardCore.js';
import CoreMatchSetup from './CoreMatchSetup.js';
import { expansions } from './expansion-data.js';

const gameComponents = [{ game: CounterGame, board: CounterBoard }, { game: CoreGame, board: CoreBoard }];
type LobbyViewProps = Parameters<NonNullable<ComponentProps<typeof Lobby>['renderer']>>[0];

function LobbyView({ server, lobby }: { server: string; lobby: LobbyViewProps }) {
  const [name, setName] = useState(lobby.playerName === 'Visitor' ? '' : lobby.playerName);
  const [created, setCreated] = useState<string>();
  const {
    phase, playerName, matches, runningMatch, errorMsg, handleEnterLobby, handleExitLobby, handleRefreshMatches,
    handleCreateMatch, handleJoinMatch, handleLeaveMatch, handleStartMatch, handleExitMatch,
  } = lobby;

  if (runningMatch && phase === 'play') {
    const { app: Match, matchID, playerID, credentials } = runningMatch;
    return <>
      <button type="button" onClick={handleExitMatch}>Back to lobby</button>
      <Match matchID={matchID} playerID={playerID} credentials={credentials} />
    </>;
  }

  if (phase === 'enter') return (
    <form className="core-setup" onSubmit={event => {
      event.preventDefault();
      if (name.trim()) handleEnterLobby(name.trim());
    }}>
      <label>Player name <input value={name} onChange={event => setName(event.target.value)} required /></label>
      <button type="submit" disabled={!name.trim()}>Enter lobby</button>
    </form>
  );

  return (
    <div className="network-lobby">
      <p>Signed in as {playerName} <button type="button" onClick={() => void handleExitLobby()}>Leave lobby</button></p>
      <CoreMatchSetup title="New network match" buttonLabel="Create match" onStart={async settings => {
        setCreated(undefined);
        const match = await new LobbyClient({ server }).createMatch(CoreGame.name!, settings);
        setCreated(match.matchID);
        await handleRefreshMatches();
      }} />
      {created && <p role="status">Match {created} created. Join it from the list below.</p>}
      <section aria-label="Network matches">
        <h3>Matches</h3>
        {!matches.length && <p>No matches yet.</p>}
        <ul className="network-matches">
          {[...new Map(matches.map(match => [match.matchID, match])).values()].map(match => {
            const { gameName, matchID, players } = match;
            const seat = players.find(player => player.name === playerName);
            const free = players.find(player => !player.name);
            const parsed = MatchSetupDataSchema.safeParse(match.setupData ?? {});
            const modules = parsed.success ? expansions.filter(item => parsed.data.expansions[item.id]) : [];
            const canPlay = gameName !== CoreGame.name || parsed.success;
            const start = () => handleStartMatch(gameName, {
              matchID, numPlayers: players.length, ...(seat && { playerID: String(seat.id) }),
            });
            return (
              <li key={matchID}>
                <div><strong>{gameName === CoreGame.name ? ['CORE', ...modules.map(item => item.label)].join(' + ') : gameName}</strong>
                  <div>Match {matchID} · {players.map(player => player.name || 'Open seat').join(', ')}</div></div>
                <div className="network-match-actions">
                  {seat && <button type="button" onClick={() => void handleLeaveMatch(gameName, matchID)}>Leave</button>}
                  {!canPlay && <span>This match uses unsupported settings.</span>}
                  {canPlay && free && !seat && <button type="button" onClick={() => void handleJoinMatch(gameName, matchID, String(free.id))}>Join</button>}
                  {canPlay && !free && <button type="button" onClick={start}>{seat ? 'Play' : 'Spectate'}</button>}
                </div>
              </li>
            );
          })}
        </ul>
        {errorMsg && <p role="alert">{errorMsg}</p>}
      </section>
      <button type="button" onClick={() => void handleCreateMatch(CounterGame.name!, 2)}>Create counter demo</button>
    </div>
  );
}

export default function NetworkLobby({ server }: { server: string }) {
  return (
    <>
      <h2>Network lobby</h2>
      <Lobby gameServer={server} lobbyServer={server} gameComponents={gameComponents}
        renderer={lobby => <LobbyView server={server} lobby={lobby} />} />
    </>
  );
}
