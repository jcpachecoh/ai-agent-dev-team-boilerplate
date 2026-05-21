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
// Template props
// ---------------------------------------------------------------------------

export interface WelcomeProps {
  userName: string;
  role: 'owner' | 'manager' | 'cashier' | 'accountant';
  loginUrl: string;
  temporaryPassword?: string;
}

export interface ResetPasswordProps {
  userName: string;
  resetUrl: string;
  expiresAt: string;
  ipAddress?: string;
}

export interface VerifyEmailProps {
  userName: string;
  otpCode: string;
  expiresInMinutes: number;
}

export interface InviteUserProps {
  inviteeName: string;
  inviterName: string;
  role: string;
  workspaceName: string;
  acceptUrl: string;
  expiresAt: string;
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
