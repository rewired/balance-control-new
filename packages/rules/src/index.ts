export * from './types.js';
export * from './schemas.js';
export * from './setup.js';

export * from './topology/hex.js';
export * from './topology/index.js';
export { computeMajority, getControl, isFullySurrounded, type MajorityBreakdown, type MajorityResult } from './rule-services.js';

export * from './resources.js';
export * from './expansion-registry.js';

// Canonical effect resolver (AGENTS §3.5)
export * from './effects.js';

export * from './moves.js';
export * from './config.js';
export { isPoliticalEffect, paymentPlans, type PlannedPayment } from './payment.js';

export { z } from 'zod';
export type { ZodTypeAny } from 'zod';
