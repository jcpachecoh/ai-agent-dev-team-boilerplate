/**
 * Stub for @restopsiq/email used in e2e tests.
 * Replaces the real email package (which depends on BullMQ + Redis) with a
 * no-op implementation so AppModule can bootstrap without a running Redis.
 *
 * Referenced by moduleNameMapper in jest.e2e.config.js.
 */

export class EmailService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_config?: unknown) {}

  async send(_opts: unknown): Promise<{ jobId: string }> {
    return { jobId: 'stub-job-id' };
  }

  async render(_template: unknown, _layout: unknown): Promise<string> {
    return '<html>stub</html>';
  }
}

// Re-export types used by auth-email.service.ts so TypeScript stays happy.
export type WelcomeProps = Record<string, unknown>;
export type EmailServiceConfig = { redisUrl?: string };
