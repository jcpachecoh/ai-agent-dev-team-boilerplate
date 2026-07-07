/**
 * Global e2e setup — mocks Redis/BullMQ/Redlock before AppModule loads.
 *
 * @restopsiq/email is stubbed at the moduleNameMapper level (jest.e2e.config.js),
 * which removes the packages/email → bullmq chain entirely.
 *
 * The mocks below cover the remaining Redis consumers in apps/api/src:
 *   - LockService        (ioredis + redlock)
 *   - AuthEmailService   (ioredis)
 *   - PlantModule        (bullmq.Queue)
 *   - AlarmNotificationWorker (bullmq.Worker)
 */

// Disable the BullMQ alarm worker — it has its own env guard in onModuleInit.
process.env.PLANT_ALARM_WORKER_ENABLED = 'false';

// ── ioredis ───────────────────────────────────────────────────────────────────
// Must include __esModule + default so bullmq CJS code (`ioredis_1.default`)
// doesn't crash even if the real bullmq Queue is instantiated somewhere.
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue('OK'),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    status: 'ready',
  }));
  return { __esModule: true, default: MockRedis };
});

// ── bullmq ────────────────────────────────────────────────────────────────────
// Used by PlantModule (PLANT_ALARM_QUEUE) and AlarmNotificationWorker.
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    close: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockResolvedValue(undefined),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn().mockReturnThis(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// ── redlock ───────────────────────────────────────────────────────────────────
// Used by LockService, which wraps the ioredis client.
jest.mock('redlock', () => {
  const MockRedlock = jest.fn().mockImplementation(() => ({
    lock: jest.fn().mockResolvedValue({
      unlock: jest.fn().mockResolvedValue(undefined),
    }),
    using: jest
      .fn()
      .mockImplementation(async (_resources: unknown, _ttl: unknown, fn: () => Promise<unknown>) =>
        fn(),
      ),
  }));
  return { __esModule: true, default: MockRedlock };
});
