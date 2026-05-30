import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  IPermissionsRepository,
  PermissionResolutionUser,
  UserPermissionOverride,
} from '../interfaces/permissions.interfaces';

@Injectable()
export class PermissionsRepository implements IPermissionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserForPermissionResolution(
    userId: string,
    tenantId: string,
  ): Promise<PermissionResolutionUser | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        tenantId: true,
        roleId: true,
        isActive: true,
        deletedAt: true,
      },
    });
  }

  async findPermissionCodesByRoleId(roleId: string): Promise<string[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { isActive: true },
    });
    if (!role?.isActive) {
      return [];
    }

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: {
        roleId,
        permission: { isActive: true },
      },
      select: {
        permission: {
          select: { code: true },
        },
      },
    });

    return rolePermissions.map((row) => row.permission.code);
  }

  async findUserPermissionOverrides(userId: string): Promise<UserPermissionOverride[]> {
    const overrides = await this.prisma.userPermission.findMany({
      where: {
        userId,
        permission: { isActive: true },
      },
      select: {
        effect: true,
        permission: {
          select: { code: true },
        },
      },
    });

    return overrides.map((row) => ({
      code: row.permission.code,
      effect: row.effect,
    }));
  }
}
