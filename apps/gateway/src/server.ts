import { ApolloServer, ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { schema } from './schema';
import { formatError } from './utils/errors';
import { graphqlRequestsTotal, graphqlRequestDurationMs } from './utils/monitoring';
import { createChildLogger } from './utils/logging';
import { env } from './config/env';
import { GraphQLContext } from './context/types';

const log = createChildLogger('apollo');

// ─── Logging + metrics plugin ─────────────────────────────────────────────────

const telemetryPlugin: ApolloServerPlugin<GraphQLContext> = {
  async requestDidStart(ctx: GraphQLRequestContext<GraphQLContext>) {
    const operationName = ctx.request.operationName ?? 'anonymous';
    const startTime = Date.now();

    return {
      async willSendResponse(requestContext) {
        const durationMs = Date.now() - startTime;

        let hasErrors = false;
        const body = requestContext.response.body;
        if (body && body.kind === 'single') {
          hasErrors = (body.singleResult.errors?.length ?? 0) > 0;
        }

        const status = hasErrors ? 'error' : 'success';

        graphqlRequestsTotal.labels(operationName, status).inc();
        graphqlRequestDurationMs.labels(operationName).observe(durationMs);

        log.info({ operationName, durationMs, status }, 'GraphQL operation completed');
      },
    };
  },
};

// ─── Server factory ───────────────────────────────────────────────────────────

export function createApolloServer(): ApolloServer<GraphQLContext> {
  return new ApolloServer<GraphQLContext>({
    schema,
    formatError,
    introspection: !env.isProduction,
    plugins: [telemetryPlugin],
    includeStacktraceInErrorResponses: env.isDevelopment,
  });
}
