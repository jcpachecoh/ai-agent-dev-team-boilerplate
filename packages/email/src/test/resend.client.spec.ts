// Mock the Resend SDK BEFORE imports.
jest.mock('resend');

import { Resend } from 'resend';

import { ResendClient } from '../resend.client';
import { ResendError } from '../types';
import type { ResendSendPayload } from '../resend.client';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const payload: ResendSendPayload = {
  from: 'RestOpsIQ <no-reply@restopsiq.co>',
  to: 'customer@example.com',
  subject: 'Test email',
  html: '<p>Hello</p>',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mockSend: jest.Mock;
let client: ResendClient;

beforeEach(() => {
  mockSend = jest.fn();
  (Resend as jest.Mock).mockImplementation(() => ({
    emails: { send: mockSend },
  }));
  client = new ResendClient('re_test_key_xxx');
});

// ---------------------------------------------------------------------------
// sendEmail() — success
// ---------------------------------------------------------------------------

describe('ResendClient.sendEmail()', () => {
  describe('on success', () => {
    it('returns the email id from Resend', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'resend-id-1' }, error: null });
      const result = await client.sendEmail(payload);
      expect(result).toEqual({ id: 'resend-id-1' });
    });

    it('calls resend.emails.send with the correct payload', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: 'resend-id-2' }, error: null });
      await client.sendEmail(payload);
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // sendEmail() — errors
  // ---------------------------------------------------------------------------

  describe('on SDK error', () => {
    it('throws ResendError when SDK returns an error object', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { name: 'invalid_from_address', message: 'Invalid from address' },
      });
      await expect(client.sendEmail(payload)).rejects.toBeInstanceOf(ResendError);
    });

    it('maps rate_limit_exceeded to statusCode 429', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { name: 'rate_limit_exceeded', message: 'Too many requests' },
      });
      await expect(client.sendEmail(payload)).rejects.toMatchObject({
        statusCode: 429,
        code: 'rate_limit_exceeded',
      });
    });

    it('maps missing_api_key to statusCode 401', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { name: 'missing_api_key', message: 'Missing API key' },
      });
      await expect(client.sendEmail(payload)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('defaults to statusCode 500 for unknown error codes', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { name: 'some_unknown_error', message: 'Something went wrong' },
      });
      await expect(client.sendEmail(payload)).rejects.toMatchObject({
        statusCode: 500,
      });
    });

    it('throws ResendError when data is returned without an id', async () => {
      mockSend.mockResolvedValueOnce({ data: { id: undefined }, error: null });
      await expect(client.sendEmail(payload)).rejects.toBeInstanceOf(ResendError);
    });

    it('includes the error message in the thrown ResendError', async () => {
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { name: 'validation_error', message: 'Invalid email address' },
      });
      const err = await client.sendEmail(payload).catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ResendError);
      expect((err as ResendError).message).toBe('Invalid email address');
    });
  });
});
