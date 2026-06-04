import { Resend } from 'resend';
import type { CreateEmailOptions } from 'resend';

import { ResendError } from './types';
import type { EmailAttachment } from './types';

// Derived from Resend SDK's RESEND_ERROR_CODES_BY_KEY (not publicly exported)
const RESEND_STATUS_MAP: Record<string, number> = {
  missing_required_field: 422,
  invalid_access: 422,
  invalid_parameter: 422,
  invalid_region: 422,
  rate_limit_exceeded: 429,
  missing_api_key: 401,
  invalid_api_Key: 403,
  invalid_from_address: 403,
  validation_error: 403,
  not_found: 404,
  method_not_allowed: 405,
  application_error: 500,
  internal_server_error: 500,
};

export interface ResendSendPayload {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

/**
 * Thin wrapper over the Resend SDK. Translates the SDK's `{ data, error }`
 * response tuple into a typed ResendError so the future email worker can
 * make intelligent retry decisions (e.g. skip retry on 4xx, retry on 5xx).
 *
 * This client is intentionally NOT called from EmailService.send().
 * It is used exclusively by the email worker (implemented in a later ticket).
 */
export class ResendClient {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendEmail(payload: ResendSendPayload): Promise<{ id: string }> {
    const emailOptions = {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments: payload.attachments,
    } as CreateEmailOptions;

    const { data, error } = await this.client.emails.send(emailOptions);

    if (error) {
      console.error('[ResendClient] Email delivery failed', {
        to: payload.to,
        subject: payload.subject,
        code: error.name,
        message: error.message,
      });

      throw new ResendError(error.message, error.name, RESEND_STATUS_MAP[error.name] ?? 500);
    }

    if (!data?.id) {
      throw new ResendError(
        'Resend returned a success response without an email ID',
        'application_error',
        500,
      );
    }

    return { id: data.id };
  }
}
