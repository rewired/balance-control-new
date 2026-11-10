import { createResourceRegistry } from '@bc/rules';
import { expect, it } from 'vitest';
import { exp02Security } from './index.js';

it('supplies Security material and the Regulation rules', () => {
  const module = exp02Security();
  const resources = createResourceRegistry();
  module.registerResources(resources);
  expect(resources.list()).toEqual(['SEC']);
  expect(Object.keys(module.actions ?? {})).toEqual(['regulationOperation', 'activateAuthorityApparatus', 'challengeInfluence']);
  expect(module.hooks?.hotspotDecision).toBeTypeOf('function');
});
