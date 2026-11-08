import { useState } from 'react';
import type { ExpansionFlags } from '@bc/rules';
import { expansions } from './expansion-data.js';

export interface CoreMatchSettings {
  numPlayers: number;
  setupData: { expansions: ExpansionFlags; addOn56: boolean };
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <form className="core-setup" onSubmit={async event => {
      event.preventDefault();
      setError(undefined);
      setPending(true);
      try {
        await onStart({ numPlayers, setupData: { expansions: enabled, addOn56: numPlayers >= 5 } });
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
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={pending}>{pending ? 'Creating match…' : buttonLabel}</button>
    </form>
  );
}
