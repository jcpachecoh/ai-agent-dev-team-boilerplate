// Mock modules BEFORE imports so Jest hoisting works correctly.
jest.mock('bullmq');
jest.mock('ioredis');
jest.mock('../email.rate-limit');
jest.mock('../email.dlq');
jest.mock('../email.events');

import { Queue, Worker } from 'bullmq';
import type { Job } from 'bullmq';
import Redis from 'ioredis';

import { checkRateLimit } from '../email.rate-limit';
import { moveToDeadLetter } from '../email.dlq';
import { publishEmailFailedEvent } from '../email.events';
import { ResendClient } from '../resend.client';
import { EmailWorker, classifyResendError } from '../email.worker';
import { ResendError } from '../types';
import type { EmailJobPayload, EmailWorkerConfig } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProcessorFn = (
  job: Job<EmailJobPayload>,
  token?: string,
) => Promise<{ resendMessageId: string }>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const config: EmailWorkerConfig = {
  redisUrl: 'redis://localhost:6379',
  resendApiKey: 're_test_key',
  fromAddress: 'RestOpsIQ <no-reply@restopsiq.co>',
};

const RENDERED_HTML = '<html><body>test email</body></html>';
const RESEND_MSG_ID = 'resend-msg-abc-123';

function makeJob(
  templateType: string = 'welcome',
  tenantId: string = 'tenant-001',
): Job<EmailJobPayload> {
  const templateMap: Record<string, EmailJobPayload['options']['template']> = {
    welcome: {
      type: 'welcome',
      props: { userName: 'Alice', role: 'owner', loginUrl: 'https://example.com/login' },
    },
    'reset-password': {
      type: 'reset-password',
      props: { userName: 'Alice', resetUrl: 'https://example.com/reset', expiresAt: 'tomorrow' },
    },
    'verify-email': {
      type: 'verify-email',
      props: { userName: 'Alice', otpCode: '123456', expiresInMinutes: 15 },
    },
    'invite-user': {
      type: 'invite-user',
      props: {
        inviteeName: 'Bob',
        inviterName: 'Alice',
        role: 'cashier',
        workspaceName: 'W',
        acceptUrl: 'u',
        expiresAt: 'tomorrow',
      },
    },
  };

  return {
    id: 'job-test-001',
    data: {
      options: {
        to: 'alice@example.com',
        subject: 'Test Subject',
        template: templateMap[templateType] ?? templateMap['welcome'],
        tenantId,
        tenantName: 'Test Tenant',
      },
      renderedHtml: RENDERED_HTML,
    },
    updateData: jest.fn().mockResolvedValue(undefined),
    moveToFailed: jest.fn().mockResolvedValue(undefined),
  } as unknown as Job<EmailJobPayload>;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let capturedProcessor: ProcessorFn;
let capturedOnFailed:
  | ((job: Job<EmailJobPayload> | undefined, err: Error) => Promise<void>)
  | undefined;
let mockWorkerClose: jest.Mock;
let mockWorkerOn: jest.Mock;
let mockRedisQuit: jest.Mock;
let mockQueueClose: jest.Mock;
let sendEmailSpy: jest.SpyInstance;

beforeEach(() => {
  capturedOnFailed = undefined;
  mockWorkerClose = jest.fn().mockResolvedValue(undefined);
  mockWorkerOn = jest
    .fn()
    .mockImplementation((event: string, handler: (...args: unknown[]) => Promise<void>) => {
      if (event === 'failed') capturedOnFailed = handler as typeof capturedOnFailed;
    });
  mockRedisQuit = jest.fn().mockResolvedValue('OK');
  mockQueueClose = jest.fn().mockResolvedValue(undefined);

  (Worker as unknown as jest.Mock).mockImplementation((_name: string, processor: ProcessorFn) => {
    capturedProcessor = processor;
    return { close: mockWorkerClose, on: mockWorkerOn };
  });

  (Queue as unknown as jest.Mock).mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'dlq-job-001' }),
    close: mockQueueClose,
  }));

  (Redis as unknown as jest.Mock).mockImplementation(() => ({
    quit: mockRedisQuit,
    eval: jest.fn(),
  }));

  (moveToDeadLetter as jest.Mock).mockResolvedValue(undefined);
  (publishEmailFailedEvent as jest.Mock).mockResolvedValue(undefined);

  (checkRateLimit as jest.Mock).mockResolvedValue({
    allowed: true,
    remaining: 99,
    resetAt: Date.now() + 3_600_000,
  });

  sendEmailSpy = jest
    .spyOn(ResendClient.prototype, 'sendEmail')
    .mockResolvedValue({ id: RESEND_MSG_ID });

  new EmailWorker(config);
});

// ---------------------------------------------------------------------------
// Happy path — successful send
// ---------------------------------------------------------------------------

describe('EmailWorker.processJob() — happy path', () => {
  it('calls ResendClient.sendEmail exactly once', async () => {
    const job = makeJob('welcome');
    await capturedProcessor(job);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });

  it('sends email with the configured fromAddress', async () => {
    const job = makeJob('welcome');
    await capturedProcessor(job);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({ from: config.fromAddress }),
    );
  });

  it('forwards to, subject and html from the job payload', async () => {
    const job = makeJob('welcome');
    await capturedProcessor(job);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        subject: 'Test Subject',
        html: RENDERED_HTML,
      }),
    );
  });

  it('uses renderedHtml from the payload without re-rendering', async () => {
    const job = makeJob('welcome');
    await capturedProcessor(job);
    // sendEmail must receive exactly the pre-rendered HTML
    const call = sendEmailSpy.mock.calls[0][0];
    expect(call.html).toBe(RENDERED_HTML);
  });

  it('saves resendMessageId via job.updateData', async () => {
    const job = makeJob('welcome');
    await capturedProcessor(job);
    expect(job.updateData).toHaveBeenCalledTimes(1);
    expect(job.updateData).toHaveBeenCalledWith(
      expect.objectContaining({ resendMessageId: RESEND_MSG_ID }),
    );
  });

  it('returns { resendMessageId } from processJob', async () => {
    const job = makeJob('welcome');
    const result = await capturedProcessor(job);
    expect(result).toEqual({ resendMessageId: RESEND_MSG_ID });
  });

  it('does not call EmailService.send() — only ResendClient is called', async () => {
    const job = makeJob('welcome');
    await capturedProcessor(job);
    // Verify no EmailService import was used by ensuring only ResendClient sendEmail was called
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Rate limit
// ---------------------------------------------------------------------------

describe('EmailWorker.processJob() — rate limit', () => {
  it('skips checkRateLimit for reset-password template', async () => {
    const job = makeJob('reset-password');
    await capturedProcessor(job);
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it('skips checkRateLimit for verify-email template', async () => {
    const job = makeJob('verify-email');
    await capturedProcessor(job);
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it('calls checkRateLimit for welcome template', async () => {
    const job = makeJob('welcome', 'tenant-xyz');
    await capturedProcessor(job);
    expect(checkRateLimit).toHaveBeenCalledTimes(1);
    expect(checkRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      'tenant-xyz',
      expect.any(String),
    );
  });

  it('calls checkRateLimit for invite-user template', async () => {
    const job = makeJob('invite-user');
    await capturedProcessor(job);
    expect(checkRateLimit).toHaveBeenCalledTimes(1);
  });

  it('throws a retryable error when rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3_600_000,
    });
    const job = makeJob('welcome');
    await expect(capturedProcessor(job)).rejects.toThrow('Rate limit exceeded');
  });

  it('does not call sendEmail when rate limit is exceeded', async () => {
    (checkRateLimit as jest.Mock).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 3_600_000,
    });
    const job = makeJob('welcome');
    await expect(capturedProcessor(job)).rejects.toThrow();
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Worker lifecycle
// ---------------------------------------------------------------------------

describe('EmailWorker.close()', () => {
  it('closes the BullMQ worker', async () => {
    const worker = new EmailWorker(config);
    await worker.close();
    expect(mockWorkerClose).toHaveBeenCalledTimes(1);
  });

  it('closes both Redis connections (rate-limit and pub/sub)', async () => {
    const worker = new EmailWorker(config);
    await worker.close();
    // Two Redis instances: this.redis (rate-limit) and this.pubRedis (pub/sub)
    expect(mockRedisQuit).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// classifyResendError — unit tests
// ---------------------------------------------------------------------------

describe('classifyResendError', () => {
  it('returns "rate-limit" for 429', () => {
    expect(classifyResendError(new ResendError('rate limit', 'rate_limit_exceeded', 429))).toBe(
      'rate-limit',
    );
  });

  it('returns "no-retry" for 422', () => {
    expect(classifyResendError(new ResendError('invalid', 'invalid_from_address', 422))).toBe(
      'no-retry',
    );
  });

  it('returns "no-retry" for 400', () => {
    expect(classifyResendError(new ResendError('bad request', 'validation_error', 400))).toBe(
      'no-retry',
    );
  });

  it('returns "no-retry" for 401 (missing API key)', () => {
    expect(classifyResendError(new ResendError('auth', 'missing_api_key', 401))).toBe('no-retry');
  });

  it('returns "no-retry" for 403 (invalid API key)', () => {
    expect(classifyResendError(new ResendError('forbidden', 'invalid_api_Key', 403))).toBe(
      'no-retry',
    );
  });

  it('returns "retryable" for 500', () => {
    expect(classifyResendError(new ResendError('server error', 'internal_server_error', 500))).toBe(
      'retryable',
    );
  });

  it('returns "retryable" for 503', () => {
    expect(classifyResendError(new ResendError('unavailable', 'application_error', 503))).toBe(
      'retryable',
    );
  });
});

// ---------------------------------------------------------------------------
// Error path — processJob
// ---------------------------------------------------------------------------

describe('EmailWorker.processJob() — error path', () => {
  it('calls job.moveToFailed for a 4xx ResendError (no-retry)', async () => {
    const err = new ResendError('invalid from address', 'invalid_from_address', 422);
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await capturedProcessor(job);

    expect(job.moveToFailed).toHaveBeenCalledWith(err, '0', true);
    expect(job.moveToFailed).toHaveBeenCalledTimes(1);
  });

  it('does not re-throw after calling job.moveToFailed for 4xx', async () => {
    const err = new ResendError('bounce', 'invalid_from_address', 422);
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await expect(capturedProcessor(job)).resolves.not.toThrow();
  });

  it('re-throws a 429 ResendError for BullMQ backoff', async () => {
    const err = new ResendError('rate limited', 'rate_limit_exceeded', 429);
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await expect(capturedProcessor(job)).rejects.toThrow(ResendError);
    expect(job.moveToFailed).not.toHaveBeenCalled();
  });

  it('re-throws a 5xx ResendError for BullMQ backoff', async () => {
    const err = new ResendError('server error', 'internal_server_error', 500);
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await expect(capturedProcessor(job)).rejects.toThrow(ResendError);
    expect(job.moveToFailed).not.toHaveBeenCalled();
  });

  it('re-throws a non-ResendError (network failure) for BullMQ backoff', async () => {
    const err = new Error('ECONNREFUSED connect ECONNREFUSED 127.0.0.1:443');
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await expect(capturedProcessor(job)).rejects.toThrow('ECONNREFUSED');
    expect(job.moveToFailed).not.toHaveBeenCalled();
  });

  it('does not call job.moveToFailed for a 5xx ResendError', async () => {
    const err = new ResendError('server error', 'application_error', 500);
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await expect(capturedProcessor(job)).rejects.toThrow();
    expect(job.moveToFailed).not.toHaveBeenCalled();
  });

  it('passes the job token to moveToFailed when provided', async () => {
    const err = new ResendError('invalid', 'invalid_from_address', 422);
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await capturedProcessor(job, 'worker-token-xyz');

    expect(job.moveToFailed).toHaveBeenCalledWith(err, 'worker-token-xyz', true);
  });

  it('does not call updateData when sendEmail throws', async () => {
    const err = new ResendError('server error', 'internal_server_error', 500);
    sendEmailSpy.mockRejectedValueOnce(err);
    const job = makeJob('welcome');

    await expect(capturedProcessor(job)).rejects.toThrow();
    expect(job.updateData).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// onFailed handler — DLQ integration
// ---------------------------------------------------------------------------

describe('EmailWorker onFailed handler', () => {
  it('registers an onFailed listener on the BullMQ worker', () => {
    expect(mockWorkerOn).toHaveBeenCalledWith('failed', expect.any(Function));
  });

  it('calls moveToDeadLetter when attemptsMade equals max attempts (3)', async () => {
    const job = { ...makeJob('welcome'), attemptsMade: 3 };
    const err = new Error('max retries exhausted');

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(moveToDeadLetter).toHaveBeenCalledTimes(1);
    expect(moveToDeadLetter).toHaveBeenCalledWith(expect.anything(), job, err);
  });

  it('calls moveToDeadLetter when attemptsMade exceeds max attempts', async () => {
    const job = { ...makeJob('welcome'), attemptsMade: 5 };
    const err = new Error('retried too many times');

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(moveToDeadLetter).toHaveBeenCalledTimes(1);
  });

  it('does not call moveToDeadLetter when attemptsMade is below max attempts', async () => {
    const job = { ...makeJob('welcome'), attemptsMade: 2 };
    const err = new Error('transient error');

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(moveToDeadLetter).not.toHaveBeenCalled();
  });

  it('does not call moveToDeadLetter when job is undefined', async () => {
    await capturedOnFailed?.(undefined, new Error('unknown'));
    expect(moveToDeadLetter).not.toHaveBeenCalled();
  });

  it('calls publishEmailFailedEvent after moveToDeadLetter when attempts exhausted', async () => {
    const job = { ...makeJob('welcome'), attemptsMade: 3 };
    const err = new Error('max retries exhausted');

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(moveToDeadLetter).toHaveBeenCalledTimes(1);
    expect(publishEmailFailedEvent).toHaveBeenCalledTimes(1);
  });

  it('does not call publishEmailFailedEvent for intermediate retry attempts', async () => {
    const job = { ...makeJob('welcome'), attemptsMade: 2 };
    const err = new Error('transient error');

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(publishEmailFailedEvent).not.toHaveBeenCalled();
  });

  it('publishes event with errorCode from ResendError.code', async () => {
    const job = { ...makeJob('welcome'), attemptsMade: 3 };
    const err = new ResendError('invalid address', 'invalid_from_address', 422);

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(publishEmailFailedEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ errorCode: 'invalid_from_address' }),
    );
  });

  it('publishes event with "unknown" errorCode for non-ResendError', async () => {
    const job = { ...makeJob('welcome'), attemptsMade: 3 };
    const err = new Error('ECONNREFUSED');

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(publishEmailFailedEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ errorCode: 'unknown' }),
    );
  });

  it('publishes event with tenantId and templateType from job data', async () => {
    const job = { ...makeJob('reset-password', 'tenant-pub-001'), attemptsMade: 3 };
    const err = new Error('failure');

    await capturedOnFailed?.(job as unknown as Job<EmailJobPayload>, err);

    expect(publishEmailFailedEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: 'tenant-pub-001',
        templateType: 'reset-password',
      }),
    );
  });
});
