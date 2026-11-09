import type { Server } from '#boardgame-server';
import koaBody from 'koa-body';
import { parseHotseatMatchLog } from '@bc/game';
import { createMatchLogWriter } from './match-log-writer.js';

export function addHotseatLogRoute(router: ReturnType<typeof Server>['router'], origins: readonly string[], directory: string) {
  const save = createMatchLogWriter(directory);
  router.put('/match-logs/hotseat/:matchID', async (ctx, next) => {
    const remote = ctx.req.socket.remoteAddress ?? '';
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote) || !origins.includes(ctx.get('Origin'))) {
      ctx.throw(403, 'Hotseat logging is only available to the local game client.');
    }
    await next();
  }, koaBody({ jsonLimit: '2mb', text: false, urlencoded: false }), async ctx => {
    const { matchID } = ctx.params;
    if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(matchID)) return ctx.throw(400, 'Invalid match ID.');
    const log = parseHotseatMatchLog(ctx.request.body, matchID);
    if (!log) return ctx.throw(400, 'Invalid hotseat match log.');
    await save(matchID, log, true);
    ctx.status = 204;
  });
}
