import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './service/audit.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Maps HTTP method to audit action
const METHOD_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<
      Request & {
        user?: { sub: string };
        headers: Record<string, string | string[] | undefined>;
      }
    >();

    if (!WRITE_METHODS.has(req.method)) return next.handle();

    const action = METHOD_ACTION[req.method] ?? AuditAction.VIEW;
    const actorUserId = req.user?.sub;
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'SYSTEM';
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? '';
    const userAgent = req.headers['user-agent'] ?? '';

    // Extract entityType from the URL: /api/{entityType}/{id}
    const segments = req.path
      .replace(/^\/api\//, '')
      .split('/')
      .filter(Boolean);

    // The first segment after /api/ is typically the entity type (e.g., 'supply-items', 'users')
    const entityType = segments[0] ?? 'unknown';

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const entityId =
          ((responseBody as Record<string, unknown>)?.id as string | undefined) ??
          (segments.length > 1 ? segments[segments.length - 1] : 'unknown');
        void this.auditService.log({
          tenantId,
          action,
          entityType,
          entityId,
          actorUserId,
          newValue: req.body as Record<string, unknown>,
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
          userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
        });
      }),
    );
  }
}
