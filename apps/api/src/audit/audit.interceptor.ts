import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Maps HTTP method to audit action
const METHOD_ACTION: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { sub: string } }>();

    if (!WRITE_METHODS.has(req.method)) return next.handle();

    const action = METHOD_ACTION[req.method] /* istanbul ignore next */ ?? req.method;
    const userId = req.user?.sub;
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? '';
    const userAgent = req.headers['user-agent'] ?? '';

    // Extract entity + entityId from the URL: /api/testlab/{entity}/{id}
    const segments = req.path
      .replace(/^\/api\//, '')
      .split('/')
      .filter(Boolean);
    const entity = segments[segments.length - 1] ?? 'unknown';

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const entityId =
          ((responseBody as Record<string, unknown>)?.id as string | undefined) ?? 'unknown';
        void this.auditService.log({
          action,
          entity,
          entityId,
          userId,
          payload: req.body as Record<string, unknown>,
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
          userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
        });
      }),
    );
  }
}
