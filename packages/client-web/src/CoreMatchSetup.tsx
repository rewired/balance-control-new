import { useState } from 'react';
import type { ExpansionFlags, MatchConfig } from '@bc/rules';
import { expansions } from './expansion-data.js';

export interface CoreMatchSettings {
  numPlayers: number;
  setupData: Omit<MatchConfig, 'topology'> & { matchSeed: string };
}

function generateMatchSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export default function CoreMatchSetup({ title, buttonLabel, onStart, initial }: {
  title: string;
  buttonLabel: string;
  onStart: (settings: CoreMatchSettings) => void | Promise<void>;
  initial?: CoreMatchSettings;
}) {
  const [numPlayers, setNumPlayers] = useState(initial?.numPlayers ?? 2);
  const [enabled, setEnabled] = useState<ExpansionFlags>(
    initial?.setupData.expansions ?? { exp01: false, exp02: false, exp03: false },
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
        const matchSeed = seed.trim() ? seed : generateMatchSeed();
        await onStart({
          numPlayers,
          setupData: { expansions: enabled, addOn56: numPlayers >= 5, matchSeed, variants },
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
