import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export interface EmailAttachment {
  filename: string;
  content: ArrayBuffer | string;
  contentType?: string;
}

// ---------------------------------------------------------------------------
// Template props — minimal stubs, expanded in later tickets
// ---------------------------------------------------------------------------

export interface WelcomeProps {
  firstName: string;
  tenantName: string;
  loginUrl: string;
}

export interface ResetPasswordProps {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface VerifyEmailProps {
  firstName: string;
  otp: string;
  expiresInMinutes: number;
}

export interface InviteUserProps {
  inviterName: string;
  tenantName: string;
  inviteUrl: string;
  role: string;
}

export interface DianInvoiceProps {
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  invoiceUrl: string;
}

export interface StockAlertProps {
  ingredientName: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
}

export interface ShiftSummaryProps {
  shiftDate: string;
  openedBy: string;
  closedBy: string;
  reportUrl: string;
}

// ---------------------------------------------------------------------------
// Discriminated union over all template types
// ---------------------------------------------------------------------------

export type EmailTemplate =
  | { type: 'welcome'; props: WelcomeProps }
  | { type: 'reset-password'; props: ResetPasswordProps }
  | { type: 'verify-email'; props: VerifyEmailProps }
  | { type: 'invite-user'; props: InviteUserProps }
  | { type: 'dian-invoice'; props: DianInvoiceProps }
  | { type: 'stock-alert'; props: StockAlertProps }
  | { type: 'shift-summary'; props: ShiftSummaryProps };

// ---------------------------------------------------------------------------
// EmailService API
// ---------------------------------------------------------------------------

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  tenantId: string;
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
  attachments?: EmailAttachment[];
}

export interface EmailJobPayload {
  options: SendEmailOptions;
  renderedHtml: string;
}

export interface EmailServiceConfig {
  redisUrl: string;
  resendApiKey: string;
  from: string;
}

// ---------------------------------------------------------------------------
// BaseLayout
// ---------------------------------------------------------------------------

export interface BaseLayoutProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string;
  previewText: string;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Typed errors
// ---------------------------------------------------------------------------

export class ResendError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'ResendError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class EmailQueueError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'EmailQueueError';
  }
}
