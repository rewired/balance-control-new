import { useEffect, useState } from 'react';
import type { ExpansionFlags, MatchConfig } from '@bc/rules';
import { expansions } from './expansion-data.js';
import { listOllamaModels } from './ollama-client.js';

export type HotseatPlayer = 'human' | 'search' | `ollama:${string}`;

export interface CoreMatchSettings {
  numPlayers: number;
  setupData: Omit<MatchConfig, 'topology'> & { matchSeed: string };
  players?: HotseatPlayer[];
}

function generateMatchSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function CoreMatchSetup({ title, buttonLabel, onStart, initial, botServer }: {
  title: string;
  buttonLabel: string;
  onStart: (settings: CoreMatchSettings) => void | Promise<void>;
  initial?: CoreMatchSettings;
  botServer?: string;
}) {
  const [numPlayers, setNumPlayers] = useState(initial?.numPlayers ?? 6);
  const defaultSeat: HotseatPlayer = botServer ? 'search' : 'human';
  const [players, setPlayers] = useState<HotseatPlayer[]>(initial?.players ?? []);
  const [models, setModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState('Checking Ollama…');
  const [modelCheck, setModelCheck] = useState(0);
  useEffect(() => {
    if (!botServer) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(6000)]);
    setOllamaStatus('Checking Ollama…');
    void listOllamaModels(botServer, signal).then(found => {
      if (controller.signal.aborted) return;
      setModels(found);
      setOllamaStatus(found.length ? `Ollama ready · ${found.length} ${found.length === 1 ? 'model' : 'models'}` : 'Ollama is running. No local models found.');
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return;
      setModels([]);
      setOllamaStatus(failure instanceof Error ? failure.message : 'Could not check Ollama.');
    });
    return () => controller.abort();
  }, [botServer, modelCheck]);
  const [enabled, setEnabled] = useState<ExpansionFlags>(
    initial?.setupData.expansions ?? { exp01: true, exp02: true, exp03: true },
  );
  const [variants, setVariants] = useState<MatchConfig['variants']>(
    initial?.setupData.variants ?? { tileRecycling: false, firstPlayerHandicap: false },
  );
  const [seed, setSeed] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <form className="core-setup" onSubmit={async event => {
      event.preventDefault();
      setError(undefined);
      setPending(true);
      try {
        const selected = Array.from({ length: numPlayers }, (_, index) => players[index] ?? defaultSeat);
        const requested = selected.filter(player => player.startsWith('ollama:')).map(player => player.slice(7));
        if (botServer && requested.length) {
          const available = await listOllamaModels(botServer);
          const missing = requested.find(model => !available.includes(model));
          if (missing) throw new Error(`Ollama model ${missing} is no longer installed.`);
        }
        const matchSeed = seed.trim() ? seed : generateMatchSeed();
        await onStart({
          numPlayers,
          setupData: { expansions: enabled, addOn56: numPlayers >= 5, matchSeed, variants },
          ...(botServer && { players: selected }),
        });
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : 'Could not start the match.');
      } finally {
        setPending(false);
      }
    }}>
      <h2>{title}</h2>
      <label>
        Players{' '}
        <select value={numPlayers} disabled={pending} onChange={event => setNumPlayers(Number(event.target.value))}>
          {[2, 3, 4, 5, 6].map(count => <option key={count}>{count}</option>)}
        </select>
      </label>
      {botServer && <fieldset disabled={pending}>
        <legend>Player seats</legend>
        <p role="status">{ollamaStatus}</p>
        <button type="button" onClick={() => setModelCheck(check => check + 1)}>Check Ollama</button>
        {Array.from({ length: numPlayers }, (_, index) => {
          const selected = players[index] ?? defaultSeat;
          const unavailable = selected.startsWith('ollama:') && !models.includes(selected.slice(7));
          return <label key={index}>
            Player {index + 1}{' '}
            <select value={selected} onChange={event => {
              const choice = event.target.value as HotseatPlayer;
              setPlayers(previous => Array.from({ length: Math.max(previous.length, index + 1) },
                (_, seat) => seat === index ? choice : previous[seat] ?? defaultSeat));
            }}>
              <option value="human">Human</option>
              <option value="search">Local AI</option>
              {unavailable && <option value={selected}>Ollama · {selected.slice(7)} (unavailable)</option>}
              {models.map(model => <option key={model} value={`ollama:${model}`}>Ollama · {model}</option>)}
            </select>
          </label>;
        })}
      </fieldset>}
      <fieldset disabled={pending}>
        <legend>Expansions</legend>
        <p>CORE is always included. Select any combination of expansions.</p>
        {expansions.map(({ id, label, resource }) => (
          <label key={id}>
            <input type="checkbox" checked={enabled[id]} onChange={event => setEnabled({ ...enabled, [id]: event.target.checked })} />
            {' '}{label} · {resource}
          </label>
        ))}
      </fieldset>
      {numPlayers >= 5 && <p>The 5–6 player add-on is included.</p>}
      <fieldset disabled={pending}>
        <legend>Variants</legend>
        <label>
          <input name="tileRecycling" type="checkbox" checked={variants.tileRecycling}
            onChange={event => setVariants({ ...variants, tileRecycling: event.target.checked })} />{' '}
          Tile recycling
        </label>
        <label>
          <input name="firstPlayerHandicap" type="checkbox" checked={variants.firstPlayerHandicap}
            onChange={event => setVariants({ ...variants, firstPlayerHandicap: event.target.checked })} />{' '}
          First-player handicap
        </label>
      </fieldset>
      <label className="core-seed-field">
        Seed (optional)
        <input type="text" value={seed} onChange={event => setSeed(event.target.value)} disabled={pending}
          placeholder="Generate automatically" autoComplete="off" autoCapitalize="none" spellCheck={false} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? 'Creating match…' : buttonLabel}</button>
    </form>
  );
}
