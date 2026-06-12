import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from './config/redis';
import { env } from './config/env';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { metricsMiddleware } from './utils/monitoring';
import { RateLimitError } from './utils/errors';
import { createChildLogger } from './utils/logging';

const log = createChildLogger('app');

// ─── Rate limiter ────────────────────────────────────────────────────────────

const rateLimiter = redis
  ? new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: 'rl_gateway',
      points: env.RATE_LIMIT_MAX_REQUESTS,
      duration: Math.ceil(env.RATE_LIMIT_WINDOW / 1000),
      blockDuration: 30,
    })
  : new RateLimiterMemory({
      keyPrefix: 'rl_gateway',
      points: env.RATE_LIMIT_MAX_REQUESTS,
      duration: Math.ceil(env.RATE_LIMIT_WINDOW / 1000),
      blockDuration: 30,
    });

function isLocalDevRequest(req: Request): boolean {
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    '';
  return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
}

async function applyRateLimit(
  req: Request,
  res: Response,
  next: express.NextFunction,
): Promise<void> {
  if (env.isDevelopment && (env.rateLimitDisabled || isLocalDevRequest(req))) {
    next();
    return;
  }

  const key =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown';

  try {
    await rateLimiter.consume(key);
    next();
  } catch {
    log.warn({ ip: key }, 'Rate limit exceeded');
    res.status(429).json({
      error: {
        message: new RateLimitError().message,
        code: 'RATE_LIMITED',
        status: 429,
      },
    });
  }
}

// ─── App factory ─────────────────────────────────────────────────────────────

export function createApp(): Application {
  const app = express();

  // Security headers — relax CSP for GraphQL Playground in dev
  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
      crossOriginEmbedderPolicy: env.isProduction,
    }),
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser / same-origin requests (no Origin header)
        if (!origin) return callback(null, true);

        const allowed = env.ALLOWED_ORIGINS.some((pattern) => {
          if (pattern === '*') return true;
          if (pattern === origin) return true;
          // Wildcard subdomain: https://*.example.com or http://*.example.com
          if (/^https?:\/\/\*\./.test(pattern)) {
            const scheme = pattern.startsWith('https') ? 'https' : 'http';
            const baseDomain = pattern.replace(/^https?:\/\/\*\./, '');
            return (
              origin.startsWith(`${scheme}://`) &&
              (origin === `${scheme}://${baseDomain}` || origin.endsWith(`.${baseDomain}`))
            );
          }
          return false;
        });

        // Return null, false (not an Error) so Express emits 403, not 500
        return callback(null, allowed);
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }),
  );

  // Structured request logging
  app.use(loggingMiddleware);

  // Body parsing
  app.use(express.json({ limit: '2mb' }));

  // Rate limiting (applied after body parsing so req.ip is available)
  app.use(applyRateLimit);

  // ─── Health check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: '@restopsiq/gateway',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  // ─── Prometheus metrics ────────────────────────────────────────────────────
  app.get('/metrics', metricsMiddleware);

  // ─── Global error handler ──────────────────────────────────────────────────
  // Must be registered after all routes; Apollo middleware is added in index.ts
  app.use(errorMiddleware);

  return app;
}
