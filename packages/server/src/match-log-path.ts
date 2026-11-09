import { existsSync } from 'node:fs';
import { realpath } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

function assertOutsideGit(directory: string) {
  for (let dir = directory; ; dir = dirname(dir)) {
    if (existsSync(join(dir, '.git'))) throw new Error('Choose a match log or save directory outside the Git checkout.');
    if (dir === dirname(dir)) return;
  }
}

export async function matchLogDirectory(directory: string): Promise<string> {
  const requested = resolve(directory);
  assertOutsideGit(requested);
  // A future directory can be under a junction or symlink. Resolve its existing parent before writing.
  for (let dir = requested; ; dir = dirname(dir)) {
    try {
      const canonical = resolve(await realpath(dir), relative(dir, requested));
      assertOutsideGit(canonical);
      return canonical;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT' || dir === dirname(dir)) throw error;
    }
  }
}
