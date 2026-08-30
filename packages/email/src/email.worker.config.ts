export const EMAIL_WORKER_CONFIG = {
  queueName: 'email-queue',
  concurrency: 10,
  dlqName: 'email-dlq',
  rateLimitWindowSeconds: 3600,
  rateLimitMaxPerTenant: 100,
} as const;

export const EMAIL_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5_000 },
  removeOnComplete: { age: 86_400 * 3 },
  removeOnFail: false,
} as const;

export const JOB_PRIORITY = {
  URGENT: 1,
  NORMAL: 10,
} as const;

export const URGENT_TEMPLATE_TYPES = new Set<string>([
  'reset-password',
  'verify-email',
  'account-confirmation',
]);
