import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../utils/logging';

const log = createChildLogger('error.middleware');

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Express error-handling middleware (must have 4 arguments).
 * Formats errors consistently and hides internals in production.
 */
export function errorMiddleware(
  err: ErrorWithStatus,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const status = err.status ?? err.statusCode ?? 500;
  const isProduction = process.env['NODE_ENV'] === 'production';

  if (status >= 500) {
    log.error({ err, status }, 'Unhandled error');
  } else {
    log.warn({ err, status }, 'Client error');
  }

  const message =
    isProduction && status >= 500 ? 'Internal server error' : (err.message ?? 'Unknown error');

  res.status(status).json({
    error: {
      message,
      status,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
