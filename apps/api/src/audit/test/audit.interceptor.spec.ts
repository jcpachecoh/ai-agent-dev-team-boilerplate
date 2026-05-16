import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditInterceptor } from '../audit.interceptor';
import { AuditService } from '../service/audit.service';

const auditServiceMock = { log: jest.fn() };

function buildContext(
  method: string,
  path: string,
  options: {
    user?: { sub: string };
    xForwardedFor?: string | string[];
    userAgent?: string | string[];
    remoteAddress?: string;
  } = {},
): ExecutionContext {
  const headers: Record<string, string | string[]> = {};
  if (options.xForwardedFor !== undefined) headers['x-forwarded-for'] = options.xForwardedFor;
  if (options.userAgent !== undefined) headers['user-agent'] = options.userAgent;
  const req = {
    method,
    path,
    headers,
    socket: { remoteAddress: options.remoteAddress ?? '127.0.0.1' },
    body: { foo: 'bar' },
    user: options.user,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function buildHandler(response: unknown): CallHandler {
  return { handle: () => of(response) };
}

function waitForLog(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    interceptor = new AuditInterceptor(auditServiceMock as unknown as AuditService);
    jest.clearAllMocks();
    auditServiceMock.log.mockResolvedValue(undefined);
  });

  it('passes through GET requests without logging', (done) => {
    const context = buildContext('GET', '/api/testlab/projects');
    interceptor.intercept(context, buildHandler([])).subscribe(() => {
      expect(auditServiceMock.log).not.toHaveBeenCalled();
      done();
    });
  });

  it('logs CREATE action for POST requests with x-forwarded-for header', async () => {
    const context = buildContext('POST', '/api/testlab/projects', {
      user: { sub: 'user-1' },
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'CREATE', entityId: 'proj-1', userId: 'user-1' }),
        );
        resolve();
      }),
    );
  });

  it('logs UPDATE action for PATCH requests', async () => {
    const context = buildContext('PATCH', '/api/testlab/projects/proj-1', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'UPDATE' }),
        );
        resolve();
      }),
    );
  });

  it('logs UPDATE action for PUT requests', async () => {
    const context = buildContext('PUT', '/api/testlab/projects/proj-1', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'UPDATE' }),
        );
        resolve();
      }),
    );
  });

  it('logs DELETE action for DELETE requests', async () => {
    const context = buildContext('DELETE', '/api/testlab/projects/proj-1', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: 'DELETE' }),
        );
        resolve();
      }),
    );
  });

  it('uses socket.remoteAddress when x-forwarded-for header is absent', async () => {
    const context = buildContext('POST', '/api/testlab/projects', {
      remoteAddress: '192.168.1.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ ipAddress: '192.168.1.1' }),
        );
        resolve();
      }),
    );
  });

  it('uses empty string when user-agent header is absent', async () => {
    const context = buildContext('POST', '/api/testlab/projects', {
      xForwardedFor: '10.0.0.1',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ userAgent: '' }),
        );
        resolve();
      }),
    );
  });

  it('extracts first element when x-forwarded-for is an array', async () => {
    const context = buildContext('POST', '/api/testlab/projects', {
      xForwardedFor: ['10.0.0.1', '10.0.0.2'],
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ ipAddress: '10.0.0.1' }),
        );
        resolve();
      }),
    );
  });

  it('extracts first element when user-agent is an array', async () => {
    const context = buildContext('POST', '/api/testlab/projects', {
      xForwardedFor: '10.0.0.1',
      userAgent: ['bot/1.0', 'bot/2.0'],
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ userAgent: 'bot/1.0' }),
        );
        resolve();
      }),
    );
  });

  it('uses unknown entityId when response has no id', async () => {
    const context = buildContext('POST', '/api/testlab/projects', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({})).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ entityId: 'unknown' }),
        );
        resolve();
      }),
    );
  });

  it('uses unknown entity when path has no segments after /api/', async () => {
    const context = buildContext('POST', '/api/', { xForwardedFor: '10.0.0.1', userAgent: 'jest' });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'x' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ entity: 'unknown' }),
        );
        resolve();
      }),
    );
  });

  it('logs without userId when user is not attached to request', async () => {
    const context = buildContext('POST', '/api/testlab/projects', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ userId: undefined }),
        );
        resolve();
      }),
    );
  });
});
