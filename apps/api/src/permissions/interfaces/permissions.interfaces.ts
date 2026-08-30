import type { PermissionEffect } from '@prisma/client';

export interface PermissionResolutionUser {
  id: string;
  tenantId: string;
  roleId: string;
  isActive: boolean;
  deletedAt: Date | null;
}

export interface UserPermissionOverride {
  code: string;
  effect: PermissionEffect;
}

export interface IPermissionsRepository {
  findUserForPermissionResolution(
    userId: string,
    tenantId: string,
  ): Promise<PermissionResolutionUser | null>;
  findPermissionCodesByRoleId(roleId: string): Promise<string[]>;
  findUserPermissionOverrides(userId: string): Promise<UserPermissionOverride[]>;
}

export interface IPermissionsService {
  resolveEffectivePermissions(userId: string, tenantId: string): Promise<ReadonlySet<string>>;
  hasPermission(userId: string, tenantId: string, permissionCode: string): Promise<boolean>;
}
