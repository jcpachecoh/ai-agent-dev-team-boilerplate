import pinoHttp from 'pino-http';
import { logger } from '../utils/logging';

/**
 * Structured request/response logging middleware using pino-http.
 * Attaches a child logger to req.log for use in downstream middleware.
 */
export const loggingMiddleware = pinoHttp({
  logger,
  // Customise the log level per status code range
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Don't log health checks to reduce noise
  autoLogging: {
    ignore(req) {
      return req.url === '/health' || req.url === '/metrics';
    },
  },
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        userAgent: req.headers?.['user-agent'],
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
