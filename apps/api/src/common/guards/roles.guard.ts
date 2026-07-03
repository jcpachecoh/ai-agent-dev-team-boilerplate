import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RoleCode } from '../config/rbac.config';
import {
  PERMISSION_DENIED_CODE,
  PERMISSION_DENIED_MESSAGE,
  PermissionDeniedException,
} from '../exceptions/permission-denied.exception';

type RequestWithUser = {
  user?: JwtPayload;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isPublic(context)) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<RoleCode[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = this.getRequest(context);
    const user = request?.user;

    if (!user?.sub || !user?.tenantId) {
      this.throwUnauthenticated(context);
    }

    const headerTenantId = this.getOptionalHeaderTenantId(request);
    if (headerTenantId && headerTenantId !== user.tenantId) {
      this.throwPermissionDenied(context);
    }

    if (!requiredRoles.includes(user.roleCode as RoleCode)) {
      this.throwPermissionDenied(context);
    }

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  private getRequest(context: ExecutionContext): RequestWithUser | undefined {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext().req as RequestWithUser;
    }

    return context.switchToHttp().getRequest<RequestWithUser>();
  }

  private getOptionalHeaderTenantId(request?: RequestWithUser): string | undefined {
    const tenantId = request?.headers?.['x-tenant-id'];
    if (typeof tenantId === 'string' && tenantId.trim()) {
      return tenantId.trim();
    }
    return undefined;
  }

  private throwUnauthenticated(context: ExecutionContext): never {
    if (context.getType<string>() === 'graphql') {
      throw new GraphQLError('Unauthorized', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    throw new UnauthorizedException();
  }

  private throwPermissionDenied(context: ExecutionContext): never {
    if (context.getType<string>() === 'graphql') {
      throw new GraphQLError(PERMISSION_DENIED_MESSAGE, {
        extensions: { code: PERMISSION_DENIED_CODE },
      });
    }
    throw new PermissionDeniedException();
  }
}
