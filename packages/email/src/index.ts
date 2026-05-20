// Services
export { EmailService } from './email.service';
export { ResendClient } from './resend.client';
export type { ResendSendPayload } from './resend.client';

// Templates
export { BaseLayout, RESTOPSIQ_LOGO_URL } from './templates/base-layout';

// Queue constants
export { EMAIL_QUEUE_NAME, EMAIL_JOB_NAME } from './email.queue';

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
  BaseLayoutProps,
} from './types';

// Errors (classes — not type-only)
export { ResendError, EmailQueueError } from './types';
