import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import type { JwtPayload } from '../../../auth/interfaces/auth.interfaces';
import { KioskMarkingSessionRepository } from '../repository/kiosk-marking-session.repository';

type RequestWithUser = {
  user?: JwtPayload;
  headers?: Record<string, string | string[] | undefined>;
};

/**
 * Allowlist guard for shared-tablet kiosk marking operations.
 * Requires JwtAuthGuard first; rejects non-KIOSK_MARKING tokens and revoked/expired sessions.
 */
@Injectable()
export class KioskMarkingGuard implements CanActivate {
  constructor(private readonly sessionRepository: KioskMarkingSessionRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const user = request?.user;

    if (!user?.sub || !user?.tenantId) {
      this.throwUnauthenticated(context);
    }

    if (user.tokenType !== 'KIOSK_MARKING' || !user.sessionId || !user.locationId) {
      this.throwForbidden(context, 'Token de modo marcación kiosko requerido');
    }

    const session = await this.sessionRepository.findById(user.sessionId, user.tenantId);
    if (!session) {
      this.throwUnauthenticated(context, 'Sesión de modo marcación no encontrada');
    }
    if (session.revokedAt) {
      this.throwUnauthenticated(context, 'Sesión de modo marcación revocada');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      this.throwUnauthenticated(context, 'Sesión de modo marcación expirada');
    }
    if (session.locationId !== user.locationId) {
      this.throwForbidden(context, 'Sede del token no coincide con la sesión');
    }
    if (session.activatedByUserId !== user.sub) {
      this.throwForbidden(context, 'Token no corresponde al activador de la sesión');
    }

    return true;
  }

  private getRequest(context: ExecutionContext): RequestWithUser | undefined {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext().req as RequestWithUser;
    }
    return context.switchToHttp().getRequest<RequestWithUser>();
  }

  private throwUnauthenticated(context: ExecutionContext, message = 'Unauthorized'): never {
    if (context.getType<string>() === 'graphql') {
      throw new GraphQLError(message, {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    throw new UnauthorizedException(message);
  }

  private throwForbidden(context: ExecutionContext, message: string): never {
    if (context.getType<string>() === 'graphql') {
      throw new GraphQLError(message, {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    throw new UnauthorizedException(message);
  }
}
