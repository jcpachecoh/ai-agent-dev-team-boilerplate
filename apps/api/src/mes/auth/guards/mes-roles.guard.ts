import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { OperationalRole } from '@prisma/client';
import { MES_ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class MesRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OperationalRole[]>(MES_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: { role?: OperationalRole } }>();

    if (!user?.role) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
