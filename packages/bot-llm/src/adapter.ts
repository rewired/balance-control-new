import type { CoreState } from '@bc/rules';
import { buildMoveCatalog, corePoliticalMoves, createExpansionRegistry } from '@bc/rules';
import { LLMChoiceSchema, type LLMChoice } from '@bc/shared';

export interface MoveOption<T = unknown> { id: string; type: string; payload: T }
export interface MoveIntent<T = unknown> { type: string; payload: T }

export interface LLMBackend { complete(prompt: string): Promise<string> }

export function enumerateLegalIntents(G: CoreState, playerID: string): MoveOption[] {
  const mods = createExpansionRegistry(G.cfg.expansions);
  const catalog = buildMoveCatalog(corePoliticalMoves(), mods);
  const out: MoveOption[] = [];
  for (const type of catalog.types) {
    const def = catalog.definitions[type];
    const items = def.enumerate ? def.enumerate(G, playerID) : [def.payloadSchema.parse({}) as unknown];
    items.forEach((payload: unknown, i: number) => {
      out.push({ id: `${type}#${i}`, type, payload });
    });
  }
  return out;
}

export async function chooseOptionWithLLM(options: MoveOption[], stateSummary: string, backend?: LLMBackend): Promise<string> {
  try {
    if (!backend) throw new Error('no-backend');
    const raw = await backend.complete(stateSummary);
    const parsed: LLMChoice = LLMChoiceSchema.parse(JSON.parse(raw));
    if (options.some(o => o.id === parsed.optionId)) return parsed.optionId;
  } catch {
    /* fall through to deterministic fallback */
  }
  // deterministic fallback: first legal option
  return options[0]?.id ?? '';
}

export function validateChoice(optionId: string, options: MoveOption[]): MoveIntent | undefined {
  const found = options.find(o => o.id === optionId);
  if (!found) return undefined;
  return { type: found.type, payload: found.payload };
}