import { Queue } from 'bullmq';
import { renderAsync } from '@react-email/render';

import { EMAIL_JOB_NAME, EMAIL_QUEUE_NAME } from './email.queue';
import { renderTemplateElement } from './templates/template-registry';
import { EmailQueueError } from './types';
import type { EmailJobPayload, EmailServiceConfig, EmailTemplate, SendEmailOptions } from './types';

/**
 * Framework-agnostic email service. Never calls Resend directly — all sends
 * are enqueued into BullMQ for the email worker to process asynchronously.
 *
 * Instantiation in NestJS: wrap this class in a NestJS provider and pass
 * EmailServiceConfig from ConfigService.
 */
export class EmailService {
  private readonly queue: Queue<EmailJobPayload>;

  constructor(config: EmailServiceConfig) {
    this.queue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
      connection: { url: config.redisUrl },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential' as const, delay: 1_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });
  }

  /**
   * Renders a template to HTML without sending. Useful for tests and the
   * React Email preview server.
   */
  async render(
    template: EmailTemplate,
    layoutProps: Omit<SendEmailOptions, 'to' | 'subject'>,
  ): Promise<string> {
    const element = renderTemplateElement(template, {
      tenantName: layoutProps.tenantName,
      tenantLogoUrl: layoutProps.tenantLogoUrl,
      primaryColor: layoutProps.primaryColor,
    });

    return renderAsync(element);
  }

  /**
   * Enqueues an email job. Returns the BullMQ job ID immediately — Resend
   * is never contacted here. Provider errors surface in the worker.
   */
  async send(options: SendEmailOptions): Promise<{ jobId: string }> {
    const renderedHtml = await this.render(options.template, options);

    const payload: EmailJobPayload = { options, renderedHtml };

    try {
      const job = await this.queue.add(EMAIL_JOB_NAME, payload);
      return { jobId: job.id ?? crypto.randomUUID() };
    } catch (error) {
      throw new EmailQueueError(
        `Failed to enqueue email job for tenant "${options.tenantId}"`,
        error,
      );
    }
  }
}
