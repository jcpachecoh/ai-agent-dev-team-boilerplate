import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import { makeServer as makeWsServer } from 'graphql-ws';
import { expressMiddleware } from '@as-integrations/express5';
import { env } from './config/env';
import { createApp } from './app';
import { createApolloServer } from './server';
import { createContext } from './context/createContext';
import { schema } from './schema';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
import { createChildLogger } from './utils/logging';
import type { Request } from 'express';

const log = createChildLogger('main');

async function bootstrap(): Promise<void> {
  // 1. Build Express app
  const app = createApp();

  // 2. Create HTTP server (needed for WebSocket upgrade)
  const httpServer = http.createServer(app);

  // 3. Create and start Apollo Server
  const apolloServer = createApolloServer();
  await apolloServer.start();

  // 4. Attach Apollo middleware at /graphql
  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: ({ req }) => createContext({ req: req as unknown as Request }),
    }),
  );

  // 5. WebSocket server for GraphQL subscriptions
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

  const wsHandler = makeWsServer({
    schema,
    context: async (ctx) => {
      // ctx.connectionParams may carry an auth token for WS connections
      const token = ctx.connectionParams?.['Authorization'] as string | undefined;
      const fakeReq = {
        headers: { authorization: token ?? '' },
        socket: { remoteAddress: 'ws' },
      } as unknown as Request;
      return createContext({ req: fakeReq });
    },
  });

  wsServer.on('connection', (socket, request) => {
    const cleanup = wsHandler.opened(
      {
        protocol: socket.protocol,
        send: (data) =>
          new Promise((resolve, reject) =>
            socket.send(data, (err) => (err ? reject(err) : resolve())),
          ),
        close: (code, reason) => socket.close(code, String(reason)),
        onMessage: (cb) =>
          socket.on('message', (event) => {
            cb(event.toString());
          }),
      },
      { socket, request },
    );
    socket.on('close', () => cleanup());
  });

  // 6. Listen
  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, resolve);
  });

  if (env.graphqlAuthDisabled) {
    log.warn(
      { tenantId: env.graphqlDevTenantId },
      'GRAPHQL_AUTH_DISABLED=true — JWT not required (development only)',
    );
  }
  if (env.rateLimitDisabled) {
    log.warn('RATE_LIMIT_DISABLED=true — rate limiting off (development only)');
  }

  log.info(
    { port: env.PORT, env: env.NODE_ENV },
    `🚀 Gateway ready at http://localhost:${env.PORT}/graphql`,
  );

  // 7. Graceful shutdown
  const shutdown = async (signal: string) => {
    log.info({ signal }, 'Shutdown signal received');

    httpServer.close(() => log.info('HTTP server closed'));
    wsServer.close(() => log.info('WebSocket server closed'));

    await apolloServer.stop();
    await prisma.$disconnect();
    redis.disconnect();

    log.info('Graceful shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
