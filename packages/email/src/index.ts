// Services
export { EmailService } from './email.service';
export { ResendClient } from './resend.client';
export type { ResendSendPayload } from './resend.client';

// Templates
export { BaseLayout, RESTOPSIQ_LOGO_URL } from './templates/base-layout';
export { WelcomeEmail } from './templates/welcome';
export { ResetPasswordEmail } from './templates/reset-password';
export { VerifyEmailEmail } from './templates/verify-email';
export { InviteUserEmail } from './templates/invite-user';

// Queue constants
export { EMAIL_QUEUE_NAME, EMAIL_JOB_NAME } from './email.queue';

// Worker
export { EmailWorker, classifyResendError } from './email.worker';
export type { RetryClass } from './email.worker';

// Worker config
export {
  EMAIL_WORKER_CONFIG,
  EMAIL_JOB_OPTIONS,
  JOB_PRIORITY,
  URGENT_TEMPLATE_TYPES,
} from './email.worker.config';

// Rate limiter
export { checkRateLimit } from './email.rate-limit';

// DLQ
export { moveToDeadLetter } from './email.dlq';

// Events
export { publishEmailFailedEvent } from './email.events';

// Types
export type {
  EmailAttachment,
  WelcomeProps,
  ResetPasswordProps,
  VerifyEmailProps,
  InviteUserProps,
  DianInvoiceProps,
  StockAlertProps,
  ShiftSummaryProps,
  EmailTemplate,
  SendEmailOptions,
  EmailJobPayload,
  EmailServiceConfig,
  EmailWorkerConfig,
  EmailFailedEvent,
  TenantRateLimitResult,
  BaseLayoutProps,
} from './types';

// Errors (classes — not type-only)
export { ResendError, EmailQueueError } from './types';
