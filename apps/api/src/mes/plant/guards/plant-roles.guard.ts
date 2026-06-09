import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OperationalRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { MES_ROLES_KEY } from '../../auth/decorators/roles.decorator';

const GLOBAL_ROLE_TO_OPERATIONAL: Record<string, OperationalRole> = {
  OWNER: OperationalRole.OWNER,
  SUPERVISOR: OperationalRole.SUPERVISOR,
  MANAGER: OperationalRole.MANAGER,
  OPERATOR: OperationalRole.OPERATOR,
};

type PlantRequestUser = {
  sub?: string;
  role?: OperationalRole;
};

/**
 * Plant RBAC for MES operator JWT (user.role) and platform email JWT (global User.role).
 * Web-app supervisors authenticate with platform JWT — MesRolesGuard alone returns 403.
 */
@Injectable()
export class PlantRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OperationalRole[]>(MES_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: PlantRequestUser }>();
    if (!user) {
      return false;
    }

    const effectiveRole = await this.resolveEffectiveRole(user);
    if (!effectiveRole) {
      return false;
    }

    return requiredRoles.includes(effectiveRole);
  }

  private async resolveEffectiveRole(user: PlantRequestUser): Promise<OperationalRole | null> {
    if (user.role) {
      return user.role;
    }

    if (!user.sub) {
      return null;
    }

    const globalUser = await this.prisma.user.findFirst({
      where: { id: user.sub, isActive: true, deletedAt: null },
      select: { role: { select: { code: true } } },
    });

    if (!globalUser) {
      return null;
    }

    return GLOBAL_ROLE_TO_OPERATIONAL[globalUser.role.code] ?? null;
  }
}
