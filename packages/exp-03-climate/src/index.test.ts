import { MatchConfigSchema } from '@bc/rules';
import { expect, it } from 'vitest';
import { exp03Climate } from './index.js';

it('keeps Climate measures that require Economy out of the standalone deck', () => {
  const module = exp03Climate();
  const deck = module.measureDeck!(MatchConfigSchema.parse({ expansions: { exp03: true } }));
  expect(deck).toHaveLength(10);
  for (const card of ['CLM_M06', 'CLM_M09', 'CLM_M11']) expect(deck).not.toContain(card);
});
