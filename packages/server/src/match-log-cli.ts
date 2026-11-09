import { join } from 'node:path';
import { verifyMatchLog } from '@bc/game';
import { CoreSaveStorage } from './core-save-storage.js';
import { readMatchLog } from './match-log-format.js';
import { logsDirectory } from './match-log-path.js';
import { createMatchLogWriter, matchLogFilename } from './match-log-writer.js';

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'export' && args.length === 1) {
    const [matchID] = args;
    const directory = join(logsDirectory, 'export');
    const output = join(directory, matchLogFilename(matchID));
    const dir = process.env.FLATFILE_DIR;
    if (!dir) throw new Error('Set FLATFILE_DIR to the server’s save directory.');
    const storage = new CoreSaveStorage({ dir });
    await storage.connect();
    const exported = await storage.exportMatchLog(matchID);
    await createMatchLogWriter(directory)(matchID, exported);
    console.log(`Exported ${exported.steps.length} actions to ${output}`);
  } else if (command === 'verify' && args.length === 1) {
    const log = verifyMatchLog(await readMatchLog(args[0]));
    const { turn, players, stateHash } = log.steps.at(-1)?.after ?? log.initial;
    console.log(JSON.stringify({ actions: log.steps.length, turn, players, result: log.result, stateHash }, null, 2));
  } else {
    throw new Error('Usage: match:log export <matchID> | match:log verify <input.jsonl or input.json>');
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
