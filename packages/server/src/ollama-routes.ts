import type { Server } from '#boardgame-server';
import koaBody from 'koa-body';
import { OllamaMoveRequestSchema } from '@bc/shared';
import { listOllamaModels, localOllamaOrigin, makeOllamaBackend, ollamaHost } from './ollama.js';

export function addOllamaRoutes(router: ReturnType<typeof Server>['router'], origins: readonly string[]) {
  const localOnly: ReturnType<typeof router.routes> = async (ctx, next) => {
    const remote = ctx.req.socket.remoteAddress ?? '';
    const origin = ctx.get('Origin');
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote) || (origin && !origins.includes(origin))) {
      ctx.throw(403, 'Ollama play is only available to the local game client.');
    }
    await next();
  };

  router.get('/bots/ollama/models', localOnly, async ctx => {
    try {
      ctx.body = { models: await listOllamaModels(localOllamaOrigin(ollamaHost)) };
    } catch {
      ctx.status = 503;
      ctx.body = { error: 'Ollama is not reachable. Start it and check again.' };
    }
  });

  router.post('/bots/ollama/move', localOnly, koaBody({ jsonLimit: '128kb', text: false, urlencoded: false }), async ctx => {
    const parsed = OllamaMoveRequestSchema.safeParse(ctx.request.body);
    if (!parsed.success) return ctx.throw(400, 'Invalid Ollama move request.');
    const { model, prompt, optionCount, expanded } = parsed.data;
    const controller = new AbortController();
    const cancel = () => controller.abort();
    ctx.res.once('close', cancel);
    try {
      const host = localOllamaOrigin(ollamaHost);
      if (!(await listOllamaModels(host)).includes(model)) {
        ctx.status = 404;
        ctx.body = { error: `Ollama model ${model} is not installed.` };
        return;
      }
      const backend = makeOllamaBackend(host, model, expanded ? 16384 : 8192, process.env.OLLAMA_THINK === '1', controller.signal);
      ctx.body = { response: await backend.complete(prompt, optionCount) };
    } catch {
      ctx.status = 503;
      ctx.body = { error: `Ollama could not run ${model}. Check Ollama and retry the move.` };
    } finally {
      ctx.res.off('close', cancel);
    }
  });
}
