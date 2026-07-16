import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import {
  PERMISSION_DENIED_CODE,
  PERMISSION_DENIED_MESSAGE,
  PermissionDeniedException,
} from '../exceptions/permission-denied.exception';
import { PermissionsService } from '../../permissions/service/permissions.service';

type RequestWithUser = {
  user?: JwtPayload;
  headers?: Record<string, string | string[] | undefined>;
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[] | undefined>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const user = this.getRequest(context)?.user;
    if (!user?.sub || !user?.tenantId) {
      this.throwUnauthenticated(context);
    }

    if (user.tokenType === 'KIOSK_MARKING') {
      this.throwPermissionDenied(context);
    }

    //TODO Update permission guard to check tenantId in header against tenantId in token, if header is present
    const headerTenantId = this.getOptionalHeaderTenantId(context);
    if (headerTenantId && headerTenantId !== user.tenantId) {
      this.throwPermissionDenied(context);
    }

    for (const permissionCode of requiredPermissions) {
      let allowed = false;
      try {
        allowed = await this.permissionsService.hasPermission(
          user.sub,
          user.tenantId,
          permissionCode,
        );
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.throwPermissionDenied(context);
        }
        throw error;
      }
      if (!allowed) {
        this.throwPermissionDenied(context);
      }
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
      return GqlExecutionContext.create(context).getContext().req;
    }

    return context.switchToHttp().getRequest<RequestWithUser>();
  }

  private getOptionalHeaderTenantId(context: ExecutionContext): string | undefined {
    const tenantId = this.getRequest(context)?.headers?.['x-tenant-id'];
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
