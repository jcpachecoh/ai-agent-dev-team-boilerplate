import type { Job } from 'bullmq';

import { moveToDeadLetter, DLQ_JOB_NAME } from '../email.dlq';
import { publishEmailFailedEvent } from '../email.events';
import { ResendError } from '../types';
import type { EmailFailedEvent, EmailJobPayload } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeJob(overrides: Partial<Job<EmailJobPayload>> = {}): Job<EmailJobPayload> {
  return {
    id: 'dlq-test-job-001',
    data: {
      options: {
        to: 'alice@example.com',
        subject: 'Test Subject',
        template: {
          type: 'welcome',
          props: { userName: 'Alice', role: 'owner', loginUrl: 'https://example.com/login' },
        },
        tenantId: 'tenant-001',
        tenantName: 'Test Tenant',
      },
      renderedHtml: '<html><body>test</body></html>',
    },
    attemptsMade: 3,
    ...overrides,
  } as unknown as Job<EmailJobPayload>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('moveToDeadLetter', () => {
  let mockAdd: jest.Mock;
  let mockDlqQueue: { add: jest.Mock };

  beforeEach(() => {
    mockAdd = jest.fn().mockResolvedValue({ id: 'dlq-enqueued-001' });
    mockDlqQueue = { add: mockAdd };
  });

  it('calls dlqQueue.add exactly once', async () => {
    const job = makeJob();
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it('uses the job name "dead-letter"', async () => {
    const job = makeJob();
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    expect(mockAdd).toHaveBeenCalledWith(DLQ_JOB_NAME, expect.any(Object), expect.any(Object));
    expect(DLQ_JOB_NAME).toBe('dead-letter');
  });

  it('includes the original job options in the DLQ payload', async () => {
    const job = makeJob();
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    const [, data] = mockAdd.mock.calls[0];
    expect(data.options).toEqual(job.data.options);
  });

  it('includes the original renderedHtml in the DLQ payload', async () => {
    const job = makeJob();
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    const [, data] = mockAdd.mock.calls[0];
    expect(data.renderedHtml).toBe(job.data.renderedHtml);
  });

  it('includes dlqMeta.jobId matching the original job id', async () => {
    const job = makeJob();
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    const [, data] = mockAdd.mock.calls[0];
    expect(data.dlqMeta.jobId).toBe('dlq-test-job-001');
  });

  it('includes dlqMeta.failedAt as a valid ISO 8601 timestamp', async () => {
    const job = makeJob();
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    const [, data] = mockAdd.mock.calls[0];
    expect(new Date(data.dlqMeta.failedAt).toISOString()).toBe(data.dlqMeta.failedAt);
  });

  it('includes dlqMeta.errorMessage from the error', async () => {
    const job = makeJob();
    const err = new Error('something went wrong during delivery');
    await moveToDeadLetter(mockDlqQueue as any, job, err);
    const [, data] = mockAdd.mock.calls[0];
    expect(data.dlqMeta.errorMessage).toBe('something went wrong during delivery');
  });

  it('uses error.code for dlqMeta.errorCode when error is a ResendError', async () => {
    const job = makeJob();
    const err = new ResendError('invalid address', 'invalid_from_address', 422);
    await moveToDeadLetter(mockDlqQueue as any, job, err);
    const [, data] = mockAdd.mock.calls[0];
    expect(data.dlqMeta.errorCode).toBe('invalid_from_address');
  });

  it('falls back to error.name for dlqMeta.errorCode when error is not a ResendError', async () => {
    const job = makeJob();
    const err = new Error('network failure');
    await moveToDeadLetter(mockDlqQueue as any, job, err);
    const [, data] = mockAdd.mock.calls[0];
    expect(data.dlqMeta.errorCode).toBe('Error');
  });

  it('sets removeOnFail.age to 7 days in the job options', async () => {
    const job = makeJob();
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    const [, , opts] = mockAdd.mock.calls[0];
    expect(opts.removeOnFail).toEqual({ age: 7 * 86_400 });
  });

  it('swallows DLQ queue errors and does not throw', async () => {
    mockAdd.mockRejectedValueOnce(new Error('DLQ queue unavailable'));
    const job = makeJob();
    await expect(
      moveToDeadLetter(mockDlqQueue as any, job, new Error('original')),
    ).resolves.not.toThrow();
  });

  it('falls back to "unknown" for jobId when job.id is undefined', async () => {
    const job = makeJob({ id: undefined } as any);
    await moveToDeadLetter(mockDlqQueue as any, job, new Error('failure'));
    const [, data] = mockAdd.mock.calls[0];
    expect(data.dlqMeta.jobId).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// publishEmailFailedEvent
// ---------------------------------------------------------------------------

describe('publishEmailFailedEvent', () => {
  const baseEvent: EmailFailedEvent = {
    jobId: 'job-evt-001',
    tenantId: 'tenant-evt-001',
    templateType: 'welcome',
    errorCode: 'invalid_from_address',
    errorMessage: 'The from address is invalid.',
    attempts: 3,
    timestamp: new Date().toISOString(),
  };

  let mockPublish: jest.Mock;
  let mockRedis: { publish: jest.Mock };

  beforeEach(() => {
    mockPublish = jest.fn().mockResolvedValue(1);
    mockRedis = { publish: mockPublish };
  });

  it('calls redis.publish with channel "email:failed"', async () => {
    await publishEmailFailedEvent(mockRedis as any, baseEvent);
    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(mockPublish).toHaveBeenCalledWith('email:failed', expect.any(String));
  });

  it('publishes a valid JSON string', async () => {
    await publishEmailFailedEvent(mockRedis as any, baseEvent);
    const [, payload] = mockPublish.mock.calls[0];
    expect(() => JSON.parse(payload)).not.toThrow();
  });

  it('published payload contains all required fields', async () => {
    await publishEmailFailedEvent(mockRedis as any, baseEvent);
    const [, payload] = mockPublish.mock.calls[0];
    const parsed = JSON.parse(payload);
    expect(parsed).toMatchObject({
      jobId: baseEvent.jobId,
      tenantId: baseEvent.tenantId,
      templateType: baseEvent.templateType,
      errorCode: baseEvent.errorCode,
      errorMessage: baseEvent.errorMessage,
      attempts: baseEvent.attempts,
      timestamp: baseEvent.timestamp,
    });
  });

  it('timestamp field is a valid ISO 8601 string', async () => {
    await publishEmailFailedEvent(mockRedis as any, baseEvent);
    const [, payload] = mockPublish.mock.calls[0];
    const parsed = JSON.parse(payload);
    expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
  });

  it('swallows redis.publish errors and does not throw', async () => {
    mockPublish.mockRejectedValueOnce(new Error('Redis connection lost'));
    await expect(publishEmailFailedEvent(mockRedis as any, baseEvent)).resolves.not.toThrow();
  });
});
