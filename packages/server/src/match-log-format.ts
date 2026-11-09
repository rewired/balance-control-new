import { readFile } from 'node:fs/promises';
import type { MatchLog } from '@bc/game';

export function serializeMatchLogJsonl({ steps, ...header }: MatchLog): string {
  return [JSON.stringify({ ...header, stepCount: steps.length }), ...steps.map(step => JSON.stringify(step))].join('\n') + '\n';
}

export function parseMatchLogJsonl(content: string) {
  const [first, ...lines] = content.replace(/\r?\n$/, '').split(/\r?\n/);
  const header: unknown = JSON.parse(first);
  if (!header || typeof header !== 'object' || !('stepCount' in header) || 'steps' in header) {
    throw new Error('Invalid JSONL match log header');
  }
  const { stepCount, ...metadata } = header;
  if (stepCount !== lines.length) throw new Error('JSONL match log action count differs from its header');
  return { ...metadata, steps: lines.map(line => JSON.parse(line) as unknown) };
}

export async function readMatchLog(path: string): Promise<unknown> {
  const content = await readFile(path, 'utf8');
  return path.toLowerCase().endsWith('.jsonl') ? parseMatchLogJsonl(content) : JSON.parse(content);
}
