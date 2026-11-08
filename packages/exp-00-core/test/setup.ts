import { registerExpansion } from '@bc/rules';
import { createCoreExpansion } from '../src/index.js';

registerExpansion(createCoreExpansion());
