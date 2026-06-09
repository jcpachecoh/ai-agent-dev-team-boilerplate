import type { Queue, Job } from 'bullmq';

import { ResendError } from './types';
import type { EmailJobPayload } from './types';

export const DLQ_JOB_NAME = 'dead-letter' as const;

export interface DlqMeta {
  jobId: string;
  failedAt: string;
  errorCode: string;
  errorMessage: string;
}

export interface DlqJobData extends EmailJobPayload {
  dlqMeta: DlqMeta;
}

export async function moveToDeadLetter(
  dlqQueue: Queue,
  job: Job<EmailJobPayload>,
  error: Error,
): Promise<void> {
  const dlqMeta: DlqMeta = {
    jobId: job.id ?? 'unknown',
    failedAt: new Date().toISOString(),
    errorCode: error instanceof ResendError ? error.code : (error.name ?? 'unknown'),
    errorMessage: error.message,
  };

  try {
    await dlqQueue.add(DLQ_JOB_NAME, { ...job.data, dlqMeta } as DlqJobData, {
      removeOnFail: { age: 7 * 86_400 },
    });
  } catch (dlqError) {
    console.error('[EmailWorker] Failed to move job to DLQ', {
      jobId: job.id,
      originalError: error.message,
      dlqError,
    });
  }
}
