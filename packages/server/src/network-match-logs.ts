import type { Server } from '#boardgame-server';
import { createMatchLog, createMatchLogRecorder, type MatchLogSource } from '@bc/game';
import { CoreSaveStorage } from './core-save-storage.js';
import { createMatchLogWriter } from './match-log-writer.js';

export function logNetworkMatches(db: ReturnType<typeof Server>['db'], directory: string) {
  const save = createMatchLogWriter(directory);
  const recorders = new Map<string, ReturnType<typeof createMatchLogRecorder>>();
  const setState = db.setState.bind(db);
  const wipe = db.wipe.bind(db);
  const flatFile = db instanceof CoreSaveStorage;

  // boardgame.io calls setState at creation and after dispatch, with an empty delta for rejected moves.
  Object.assign(db, {
    setState(matchID: string, state: Parameters<typeof setState>[1], delta: Parameters<typeof setState>[2]) {
      const persisted = setState(matchID, state, delta);
      if (!state.G?.exp?.core || (state._stateID > 0 && !delta?.length)) return persisted;
      const reportFailure = (error: unknown) => console.error(`Could not save network match log ${matchID}`, error);
      const source: MatchLogSource = { mode: 'network', matchID, ...(!flatFile && { networkStorage: 'memory' }) };
      const record = () => {
        const recorder = state._stateID === 0 ? createMatchLogRecorder(state, source) : recorders.get(matchID);
        if (!recorder) return undefined;
        const log = recorder.record(state, delta ?? []);
        recorders.set(matchID, recorder);
        return log;
      };
      if (!flatFile) {
        try {
          const log = record();
          if (log) void save(matchID, log).catch(reportFailure);
        } catch (error) {
          reportFailure(error);
        }
        return persisted;
      }
      return Promise.resolve(persisted).then(async () => {
        try {
          let log = record();
          if (!log) {
            // A pre-existing saved match has no live recorder until its first new move.
            const saved = await db.fetch(matchID, { initialState: true, state: true, log: true });
            log = createMatchLog(saved.initialState, saved.state, saved.log ?? [], source);
            recorders.set(matchID, createMatchLogRecorder(saved.state, source, log));
          }
          await save(matchID, log);
        } catch (error) {
          reportFailure(error);
        }
      });
    },
    wipe(matchID: string) {
      recorders.delete(matchID);
      return wipe(matchID);
    },
  });
}
