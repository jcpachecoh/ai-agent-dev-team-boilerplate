import client, { Registry, Counter, Histogram } from 'prom-client';
import { createChildLogger } from './logging';

const log = createChildLogger('monitoring');

// Create a dedicated registry (avoids conflicts with default registry in tests)
export const metricsRegistry = new Registry();

// Collect default metrics (CPU, memory, GC, etc.)
client.collectDefaultMetrics({ register: metricsRegistry });

export const graphqlRequestsTotal = new Counter({
  name: 'graphql_requests_total',
  help: 'Total number of GraphQL requests',
  labelNames: ['operation', 'status'] as const,
  registers: [metricsRegistry],
});

export const graphqlRequestDurationMs = new Histogram({
  name: 'graphql_request_duration_ms',
  help: 'Duration of GraphQL requests in milliseconds',
  labelNames: ['operation'] as const,
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [metricsRegistry],
});

export const authAttemptsTotal = new Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status'] as const,
  registers: [metricsRegistry],
});
