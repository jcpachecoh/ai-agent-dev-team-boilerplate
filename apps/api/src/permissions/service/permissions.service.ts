import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionEffect } from '@prisma/client';
import type {
  IPermissionsService,
  PermissionResolutionUser,
} from '../interfaces/permissions.interfaces';
import { PermissionsRepository } from '../repository/permissions.repository';

@Injectable()
export class PermissionsService implements IPermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  async resolveEffectivePermissions(
    userId: string,
    tenantId: string,
  ): Promise<ReadonlySet<string>> {
    const user = await this.permissionsRepository.findUserForPermissionResolution(userId, tenantId);
    this.assertResolvableUser(user, tenantId);

    const [rolePermissionCodes, overrides] = await Promise.all([
      this.permissionsRepository.findPermissionCodesByRoleId(user!.roleId),
      this.permissionsRepository.findUserPermissionOverrides(userId),
    ]);

    const allowCodes = overrides
      .filter((override) => override.effect === PermissionEffect.ALLOW)
      .map((override) => override.code);
    const denyCodes = new Set(
      overrides
        .filter((override) => override.effect === PermissionEffect.DENY)
        .map((override) => override.code),
    );

    const effective = new Set<string>();
    for (const code of [...rolePermissionCodes, ...allowCodes]) {
      if (!denyCodes.has(code)) {
        effective.add(code);
      }
    }

    return effective;
  }

  async hasPermission(userId: string, tenantId: string, permissionCode: string): Promise<boolean> {
    const effective = await this.resolveEffectivePermissions(userId, tenantId);
    return effective.has(permissionCode);
  }

  private assertResolvableUser(
    user: PermissionResolutionUser | null,
    tenantId: string,
  ): asserts user is PermissionResolutionUser {
    if (!user || user.tenantId !== tenantId || !user.isActive || user.deletedAt) {
      throw new NotFoundException('User not found');
    }
  }
}
