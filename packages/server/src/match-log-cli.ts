import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { verifyMatchLog } from '@bc/game';
import { CoreSaveStorage } from './core-save-storage.js';
import { matchLogDirectory } from './match-log-path.js';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'export' && args.length === 2) {
    const [matchID, requested] = args;
    const output = join(await matchLogDirectory(dirname(requested)), basename(requested));
    const dir = process.env.FLATFILE_DIR;
    if (!dir) throw new Error('Set FLATFILE_DIR to the server’s save directory.');
    const storage = new CoreSaveStorage({ dir });
    await storage.connect();
    const exported = await storage.exportMatchLog(matchID);
    await writeFile(output, JSON.stringify(exported, null, 2) + '\n', { flag: 'wx' });
    console.log(`Exported ${exported.steps.length} actions to ${output}`);
  } else if (command === 'verify' && args.length === 1) {
    const log = verifyMatchLog(JSON.parse(await readFile(args[0], 'utf8')));
    const { turn, players, stateHash } = log.steps.at(-1)?.after ?? log.initial;
    console.log(JSON.stringify({ actions: log.steps.length, turn, players, result: log.result, stateHash }, null, 2));
  } else {
    throw new Error('Usage: match:log export <matchID> <output.json> | match:log verify <input.json>');
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
