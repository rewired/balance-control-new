import type { StorageAPI } from 'boardgame.io';
import { migrateCoreMatchState } from '@bc/game';
import { FlatFile } from '#boardgame-server';

export class CoreSaveStorage extends FlatFile {
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
