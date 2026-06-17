import { Queue } from 'bullmq';
import { createChildLogger } from '../utils/logging';

const log = createChildLogger('email.service');

export interface EmailJob {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export class EmailService {
  constructor(private readonly queue: Queue | null) {}

  /**
   * Push an email job onto the BullMQ queue.
   * The actual sending is handled by a separate worker (apps/email or similar).
   */
  async queueEmail(to: string, subject: string, body: string, from?: string): Promise<void> {
    if (!this.queue) {
      log.warn({ to, subject }, 'Email skipped — queue unavailable (Redis not configured)');
      return;
    }
    const job: EmailJob = { to, subject, body, from };

    await this.queue.add('send-email', job, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });

    log.info({ to, subject }, 'Email queued');
  }
}
