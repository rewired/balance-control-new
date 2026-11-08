export * from './types.js';
export * from './schemas.js';
export * from './setup.js';

export * from './topology/hex.js';
export * from './topology/index.js';
export * from './placement.js';

export * from './majority.js';
export * from './hotspot.js';
export * from './production.js';

export * from './resources.js';
export * from './expansion-registry.js';

// Canonical effect resolver (AGENTS §3.5)
export * from './effects.js';

export * from './moves.js';
export * from './config.js';
export { budgetDeficitIds, isPoliticalEffect } from './payment.js';
export { regulationOperations } from './regulations.js';

export { z } from 'zod';
export type { ZodTypeAny } from 'zod';
