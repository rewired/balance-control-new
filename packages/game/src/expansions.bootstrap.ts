import { exp01Economy } from '@bc/exp-01-economy';
import { registerExpansion } from '@bc/rules';
import { exp02Security } from './expansions/security.js';
import { exp03Climate } from './expansions/climate.js';

const modules = [exp01Economy(), exp02Security(), exp03Climate()];
for (const module of modules) registerExpansion(module);

export const BOOTSTRAPPED_MODULE_IDS = modules.map(module => module.id);
