// Mock modules BEFORE imports so Jest hoisting works correctly.
jest.mock('bullmq');
jest.mock('@react-email/render');

import { Queue } from 'bullmq';
import { renderAsync } from '@react-email/render';

import { EmailService } from '../email.service';
import { ResendClient } from '../resend.client';
import { EmailQueueError } from '../types';
import { EMAIL_JOB_NAME } from '../email.queue';
import type { EmailServiceConfig, SendEmailOptions } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const config: EmailServiceConfig = {
  redisUrl: 'redis://localhost:6379',
  resendApiKey: 're_test_key',
  from: 'RestOpsIQ <no-reply@restopsiq.co>',
};

const welcomeOptions: SendEmailOptions = {
  to: 'alice@example.com',
  subject: 'Welcome',
  tenantId: 'tenant-1',
  tenantName: 'Burger Palace',
  template: {
    type: 'welcome',
    props: {
      userName: 'Alice',
      role: 'owner',
      loginUrl: 'https://app.restopsiq.co/login',
    },
  },
};

const MOCK_JOB_ID = 'job-abc-123';
const MOCK_HTML = '<html><body>rendered email</body></html>';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mockAdd: jest.Mock;
let service: EmailService;

beforeEach(() => {
  // Configure the Queue mock for each test
  mockAdd = jest.fn().mockResolvedValue({ id: MOCK_JOB_ID });
  // Double cast required: typeof Queue and jest.Mock don't overlap structurally.
  (Queue as unknown as jest.Mock).mockImplementation(() => ({ add: mockAdd }));

  // Make renderAsync return a predictable HTML string
  (renderAsync as jest.Mock).mockResolvedValue(MOCK_HTML);

  service = new EmailService(config);
});

// ---------------------------------------------------------------------------
// send()
// ---------------------------------------------------------------------------

describe('EmailService.send()', () => {
  it('returns the BullMQ job id', async () => {
    const result = await service.send(welcomeOptions);
    expect(result).toEqual({ jobId: MOCK_JOB_ID });
  });

  it('calls queue.add() exactly once', async () => {
    await service.send(welcomeOptions);
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it('enqueues job with EMAIL_JOB_NAME as the job name', async () => {
    await service.send(welcomeOptions);
    expect(mockAdd).toHaveBeenCalledWith(EMAIL_JOB_NAME, expect.any(Object), expect.any(Object));
  });

  it('includes renderedHtml in the job payload', async () => {
    await service.send(welcomeOptions);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ renderedHtml: MOCK_HTML }),
      expect.any(Object),
    );
  });

  it('includes the original options in the job payload', async () => {
    await service.send(welcomeOptions);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        options: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
      expect.any(Object),
    );
  });

  it('does NOT call ResendClient.sendEmail', async () => {
    const spy = jest.spyOn(ResendClient.prototype, 'sendEmail');
    await service.send(welcomeOptions);
    expect(spy).not.toHaveBeenCalled();
  });

  it('throws EmailQueueError when queue.add rejects', async () => {
    mockAdd.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(service.send(welcomeOptions)).rejects.toBeInstanceOf(EmailQueueError);
  });

  it('does not throw ResendError when queue.add fails', async () => {
    const { ResendError } = await import('../types');
    mockAdd.mockRejectedValueOnce(new Error('Redis down'));
    await expect(service.send(welcomeOptions)).rejects.not.toBeInstanceOf(ResendError);
  });

  it('falls back to a uuid-like jobId when job.id is undefined', async () => {
    mockAdd.mockResolvedValueOnce({ id: undefined });
    const result = await service.send(welcomeOptions);
    expect(typeof result.jobId).toBe('string');
    expect(result.jobId.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// send() — priority
// ---------------------------------------------------------------------------

describe('EmailService.send() — priority', () => {
  async function sendTemplate(
    templateType: string,
    priorityOverride?: 'normal' | 'urgent',
  ): Promise<void> {
    const templateMap: Record<string, SendEmailOptions['template']> = {
      welcome: { type: 'welcome', props: { userName: 'A', role: 'owner', loginUrl: 'u' } },
      'reset-password': {
        type: 'reset-password',
        props: { userName: 'A', resetUrl: 'u', expiresAt: 'tomorrow' },
      },
      'verify-email': {
        type: 'verify-email',
        props: { userName: 'A', otpCode: '123456', expiresInMinutes: 15 },
      },
      'invite-user': {
        type: 'invite-user',
        props: {
          inviteeName: 'B',
          inviterName: 'C',
          workspaceName: 'W',
          acceptUrl: 'u',
          role: 'manager',
          expiresAt: 'en 48h',
        },
      },
    };

    const options: SendEmailOptions = {
      ...welcomeOptions,
      template: templateMap[templateType],
      ...(priorityOverride ? { priority: priorityOverride } : {}),
    };

    await service.send(options);
  }

  it('enqueues reset-password with priority 1 (URGENT)', async () => {
    await sendTemplate('reset-password');
    expect(mockAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ priority: 1 }),
    );
  });

  it('enqueues verify-email with priority 1 (URGENT)', async () => {
    await sendTemplate('verify-email');
    expect(mockAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ priority: 1 }),
    );
  });

  it('enqueues welcome with priority 10 (NORMAL)', async () => {
    await sendTemplate('welcome');
    expect(mockAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ priority: 10 }),
    );
  });

  it('enqueues invite-user with priority 10 (NORMAL)', async () => {
    await sendTemplate('invite-user');
    expect(mockAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ priority: 10 }),
    );
  });

  it('enqueues welcome with priority 1 when options.priority === "urgent"', async () => {
    await sendTemplate('welcome', 'urgent');
    expect(mockAdd).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({ priority: 1 }),
    );
  });

  it('still returns { jobId } with priority set', async () => {
    const result = await service.send({
      ...welcomeOptions,
      template: {
        type: 'reset-password',
        props: { userName: 'A', resetUrl: 'u', expiresAt: 'tomorrow' },
      },
    });
    expect(result).toEqual({ jobId: MOCK_JOB_ID });
  });

  it('still does not call Resend when priority is URGENT', async () => {
    const spy = jest.spyOn(ResendClient.prototype, 'sendEmail');
    await sendTemplate('reset-password');
    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// render()
// ---------------------------------------------------------------------------

describe('EmailService.render()', () => {
  it('returns the HTML string from renderAsync', async () => {
    const html = await service.render(welcomeOptions.template, welcomeOptions);
    expect(html).toBe(MOCK_HTML);
  });

  it('calls renderAsync exactly once', async () => {
    await service.render(welcomeOptions.template, welcomeOptions);
    expect(renderAsync).toHaveBeenCalledTimes(1);
  });

  it('produces a string for each template type', async () => {
    const types: Array<SendEmailOptions['template']> = [
      { type: 'welcome', props: { userName: 'A', role: 'owner', loginUrl: 'u' } },
      { type: 'reset-password', props: { userName: 'A', resetUrl: 'u', expiresAt: 'mañana' } },
      { type: 'verify-email', props: { userName: 'A', otpCode: '123456', expiresInMinutes: 15 } },
      {
        type: 'invite-user',
        props: {
          inviteeName: 'B',
          inviterName: 'C',
          workspaceName: 'T',
          acceptUrl: 'u',
          role: 'manager',
          expiresAt: 'en 48 horas',
        },
      },
      {
        type: 'dian-invoice',
        props: { invoiceNumber: 'FE-1', customerName: 'C', totalAmount: 100, invoiceUrl: 'u' },
      },
      {
        type: 'stock-alert',
        props: { ingredientName: 'Salt', currentStock: 1, minimumStock: 5, unit: 'kg' },
      },
      {
        type: 'shift-summary',
        props: { shiftDate: '2026-05-20', openedBy: 'Alice', closedBy: 'Bob', reportUrl: 'u' },
      },
    ];

    for (const template of types) {
      jest.clearAllMocks();
      (renderAsync as jest.Mock).mockResolvedValue(MOCK_HTML);
      const html = await service.render(template, { ...welcomeOptions, template });
      expect(typeof html).toBe('string');
    }
  });
});
