import { Queue, Worker } from 'bullmq';
import type { Job } from 'bullmq';
import Redis from 'ioredis';

import { ResendClient } from './resend.client';
import { checkRateLimit } from './email.rate-limit';
import { moveToDeadLetter } from './email.dlq';
import { publishEmailFailedEvent } from './email.events';
import {
  EMAIL_JOB_OPTIONS,
  EMAIL_WORKER_CONFIG,
  URGENT_TEMPLATE_TYPES,
} from './email.worker.config';
import { ResendError } from './types';
import type { EmailJobPayload, EmailWorkerConfig } from './types';

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

export type RetryClass = 'no-retry' | 'rate-limit' | 'retryable';

export function classifyResendError(err: ResendError): RetryClass {
  if (err.statusCode === 429) return 'rate-limit';
  if (err.statusCode >= 400 && err.statusCode < 500) return 'no-retry';
  return 'retryable';
}

export class EmailWorker {
  private readonly worker: Worker<EmailJobPayload>;
  private readonly resendClient: ResendClient;
  private readonly redis: Redis;
  private readonly pubRedis: Redis;
  private readonly dlqQueue: Queue;
  private readonly fromAddress: string;

  constructor(config: EmailWorkerConfig) {
    this.fromAddress = config.fromName
      ? `${config.fromName} <${config.fromAddress}>`
      : config.fromAddress;
    this.resendClient = new ResendClient(config.resendApiKey);
    // maxRetriesPerRequest: null is required by BullMQ when using a shared ioredis instance
    this.redis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });
    this.pubRedis = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

    this.dlqQueue = new Queue(EMAIL_WORKER_CONFIG.dlqName, {
      connection: { url: config.redisUrl },
    });

    this.worker = new Worker<EmailJobPayload>(
      EMAIL_WORKER_CONFIG.queueName,
      (job, token) => this.processJob(job, token),
      {
        concurrency: EMAIL_WORKER_CONFIG.concurrency,
        connection: this.redis,
      },
    );

    this.worker.on('failed', async (job, err) => {
      if (!job) return;
      if (job.attemptsMade >= EMAIL_JOB_OPTIONS.attempts) {
        await moveToDeadLetter(this.dlqQueue, job, err);
        await publishEmailFailedEvent(this.pubRedis, {
          jobId: job.id ?? 'unknown',
          tenantId: job.data.options.tenantId,
          templateType: job.data.options.template.type,
          errorCode: err instanceof ResendError ? err.code : 'unknown',
          errorMessage: err.message,
          attempts: job.attemptsMade,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  private async processJob(
    job: Job<EmailJobPayload>,
    token?: string,
  ): Promise<{ resendMessageId: string }> {
    const { options, renderedHtml } = job.data;
    const { tenantId, to, subject, attachments } = options;
    const templateType = options.template.type;
    const jobId = job.id ?? crypto.randomUUID();

    if (!URGENT_TEMPLATE_TYPES.has(templateType)) {
      const rateLimit = await checkRateLimit(this.redis, tenantId, jobId);
      if (!rateLimit.allowed) {
        throw new Error(
          `Rate limit exceeded for tenant "${tenantId}". Retry after ${rateLimit.resetAt}.`,
        );
      }
    }

    try {
      const result = await this.resendClient.sendEmail({
        from: this.fromAddress,
        to,
        subject,
        html: renderedHtml,
        attachments,
      });

      await job.updateData({ ...job.data, resendMessageId: result.id });

      return { resendMessageId: result.id };
    } catch (err) {
      if (err instanceof ResendError) {
        const cls = classifyResendError(err);

        if (cls === 'no-retry') {
          await job.moveToFailed(err, token ?? '0', true);
          return { resendMessageId: '' };
        }

        // 'rate-limit' or 'retryable' — re-throw for BullMQ backoff
        throw err;
      }

      // Non-ResendError (network, unexpected) — always retryable
      throw err;
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.dlqQueue.close();
    await this.redis.quit();
    await this.pubRedis.quit();
  }
}
