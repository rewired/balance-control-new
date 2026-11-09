import type { StorageAPI } from 'boardgame.io';
import { createMatchLog, migrateCoreMatchState } from '@bc/game';
import { FlatFile } from '#boardgame-server';

export class CoreSaveStorage extends FlatFile {
  async exportMatchLog(matchID: string) {
    const { state, initialState, log, metadata } = await this.fetch(matchID, {
      state: true, initialState: true, log: true, metadata: true,
    });
    if (!state || !initialState || metadata?.gameName !== 'core') throw new Error(`CORE match not found: ${matchID}`);
    return createMatchLog(initialState, state, log ?? [], { mode: 'network', matchID });
  }

  override async fetch<O extends StorageAPI.FetchOpts>(matchID: string, opts: O): Promise<StorageAPI.FetchResult<O>> {
    const result = await super.fetch(matchID, opts);
    const { state, initialState } = result as Partial<StorageAPI.FetchFields>;
    return {
      ...result,
      ...(state && { state: migrateCoreMatchState(state) }),
      ...(initialState && { initialState: migrateCoreMatchState(initialState) }),
    };
  }
}
