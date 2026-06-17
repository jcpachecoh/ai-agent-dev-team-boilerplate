import pino, { Logger, LoggerOptions } from 'pino';

// Access LOG_LEVEL directly to avoid circular import with env.ts (which imports this)
const LOG_LEVEL = (process.env['LOG_LEVEL'] as pino.Level) ?? 'info';
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

function buildLoggerOptions(): LoggerOptions {
  const base: LoggerOptions = {
    level: LOG_LEVEL,
    base: { service: 'restopsiq-gateway' },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
  };

  if (NODE_ENV !== 'production') {
    return {
      ...base,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    };
  }

  return base;
}

export const logger: Logger = pino(buildLoggerOptions());

export function createChildLogger(name: string): Logger {
  return logger.child({ module: name });
}
