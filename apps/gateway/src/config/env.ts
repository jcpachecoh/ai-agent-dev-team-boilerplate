import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  REDIS_ENABLED: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((v) => v === 'true' || v === '1'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  RESEND_API_KEY: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(1000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PROMETHEUS_PORT: z.coerce.number().default(9090),
  GRAPHQL_DEV_TENANT_ID: z.string().default('palos-de-lena'),
});

const parsed = envSchema.safeParse(process.env);

const graphqlAuthDisabledEnv =
  process.env.GRAPHQL_AUTH_DISABLED === 'true' || process.env.GRAPHQL_AUTH_DISABLED === '1';

const rateLimitDisabledEnv =
  process.env.RATE_LIMIT_DISABLED === 'true' || process.env.RATE_LIMIT_DISABLED === '1';

if (parsed.success && graphqlAuthDisabledEnv && parsed.data.NODE_ENV === 'production') {
  throw new Error('GRAPHQL_AUTH_DISABLED cannot be enabled when NODE_ENV=production');
}

if (parsed.success && rateLimitDisabledEnv && parsed.data.NODE_ENV === 'production') {
  throw new Error('RATE_LIMIT_DISABLED cannot be enabled when NODE_ENV=production');
}

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed. Check your .env file.');
}

const raw = parsed.data;

export const env = {
  PORT: raw.PORT,
  NODE_ENV: raw.NODE_ENV,
  DATABASE_URL: raw.DATABASE_URL,
  REDIS_URL: raw.REDIS_URL ?? null,
  redisEnabled: raw.REDIS_ENABLED && !!raw.REDIS_URL,
  JWT_SECRET: raw.JWT_SECRET,
  JWT_EXPIRES_IN: raw.JWT_EXPIRES_IN,
  RESEND_API_KEY: raw.RESEND_API_KEY,
  ALLOWED_ORIGINS: raw.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  RATE_LIMIT_WINDOW: raw.RATE_LIMIT_WINDOW,
  RATE_LIMIT_MAX_REQUESTS: raw.RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL: raw.LOG_LEVEL,
  PROMETHEUS_PORT: raw.PROMETHEUS_PORT,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  graphqlAuthDisabled: raw.NODE_ENV === 'development' && graphqlAuthDisabledEnv,
  graphqlDevTenantId: raw.GRAPHQL_DEV_TENANT_ID,
  rateLimitDisabled: raw.NODE_ENV === 'development' && rateLimitDisabledEnv,
};

export type Env = typeof env;
