import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { MatchLog } from '@bc/game';

export function matchLogFilename(matchID: string) {
  if (!/^[\w-]{1,128}$/.test(matchID)) throw new Error('Invalid match ID');
  return `${matchID}.match-log.json`;
}

export function createMatchLogWriter(directory: string) {
  const pending = new Map<string, Promise<void>>();
  return async (matchID: string, log: MatchLog, ignoreOlder = false) => {
    const path = join(directory, matchLogFilename(matchID));
    const content = JSON.stringify(log, null, 2) + '\n';
    const revision = log.steps.length;
    const save = (pending.get(path) ?? Promise.resolve()).catch(() => {}).then(async () => {
      await mkdir(directory, { recursive: true });
      if (ignoreOlder) {
        const previous = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
          if (error.code !== 'ENOENT') throw error;
          return undefined;
        });
        if (previous && (JSON.parse(previous) as MatchLog).steps.length >= revision) return;
      }
      const temporary = `${path}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, content, { flag: 'wx' });
        await rename(temporary, path);
      } finally {
        await rm(temporary, { force: true });
      }
    });
    pending.set(path, save);
    try {
      await save;
    } finally {
      if (pending.get(path) === save) pending.delete(path);
    }
  };
}
