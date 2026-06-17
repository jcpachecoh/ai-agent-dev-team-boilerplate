import { ExecutionContext, CallHandler } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
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
    tenantId?: string;
  } = {},
): ExecutionContext {
  const headers: Record<string, string | string[]> = {};
  if (options.xForwardedFor !== undefined) headers['x-forwarded-for'] = options.xForwardedFor;
  if (options.userAgent !== undefined) headers['user-agent'] = options.userAgent;
  if (options.tenantId !== undefined) headers['x-tenant-id'] = options.tenantId;
  const req = {
    method,
    path,
    headers,
    socket: { remoteAddress: options.remoteAddress ?? '127.0.0.1' },
    body: { foo: 'bar' },
    user: options.user,
  };
  return {
    getType: () => 'http',
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

  it('passes through GraphQL requests without logging', (done) => {
    const context = {
      getType: () => 'graphql',
      switchToHttp: () => ({ getRequest: () => undefined }),
    } as unknown as ExecutionContext;
    interceptor.intercept(context, buildHandler({ id: 'x' })).subscribe(() => {
      expect(auditServiceMock.log).not.toHaveBeenCalled();
      done();
    });
  });

  it('passes through GET requests without logging', (done) => {
    const context = buildContext('GET', '/api/supply-items');
    interceptor.intercept(context, buildHandler([])).subscribe(() => {
      expect(auditServiceMock.log).not.toHaveBeenCalled();
      done();
    });
  });

  it('logs CREATE action for POST requests with x-forwarded-for header', async () => {
    const context = buildContext('POST', '/api/supply-items', {
      user: { sub: 'user-1' },
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
      tenantId: 't-1',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: AuditAction.CREATE,
            entityId: 'proj-1',
            actorUserId: 'user-1',
            tenantId: 't-1',
          }),
        );
        resolve();
      }),
    );
  });

  it('logs UPDATE action for PATCH requests', async () => {
    const context = buildContext('PATCH', '/api/supply-items/item-1', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: AuditAction.UPDATE }),
        );
        resolve();
      }),
    );
  });

  it('logs UPDATE action for PUT requests', async () => {
    const context = buildContext('PUT', '/api/supply-items/item-1', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: AuditAction.UPDATE }),
        );
        resolve();
      }),
    );
  });

  it('logs DELETE action for DELETE requests', async () => {
    const context = buildContext('DELETE', '/api/supply-items/item-1', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ action: AuditAction.DELETE }),
        );
        resolve();
      }),
    );
  });

  it('uses socket.remoteAddress when x-forwarded-for header is absent', async () => {
    const context = buildContext('POST', '/api/supply-items', {
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
    const context = buildContext('POST', '/api/supply-items', {
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
    const context = buildContext('POST', '/api/supply-items', {
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
    const context = buildContext('POST', '/api/supply-items', {
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
    const context = buildContext('POST', '/api/supply-items', {
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
          expect.objectContaining({ entityType: 'unknown' }),
        );
        resolve();
      }),
    );
  });

  it('logs without actorUserId when user is not attached to request', async () => {
    const context = buildContext('POST', '/api/supply-items', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'proj-1' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({ actorUserId: undefined }),
        );
        resolve();
      }),
    );
  });

  it('uses first segment after /api/ as entityType and extracts entityId from URL if missing in response', async () => {
    const context = buildContext('PATCH', '/api/supply-items/item-123', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ success: true })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityType: 'supply-items',
            entityId: 'item-123',
          }),
        );
        resolve();
      }),
    );
  });

  it('prefers entityId from response body over URL', async () => {
    const context = buildContext('POST', '/api/supply-items/url-id', {
      xForwardedFor: '10.0.0.1',
      userAgent: 'jest',
    });
    await new Promise<void>((resolve) =>
      interceptor.intercept(context, buildHandler({ id: 'body-id' })).subscribe(async () => {
        await waitForLog();
        expect(auditServiceMock.log).toHaveBeenCalledWith(
          expect.objectContaining({
            entityType: 'supply-items',
            entityId: 'body-id',
          }),
        );
        resolve();
      }),
    );
  });
});
