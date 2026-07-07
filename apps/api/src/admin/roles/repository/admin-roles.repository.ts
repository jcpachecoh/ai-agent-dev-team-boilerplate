import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import type {
  AdminRoleDetail,
  AdminRoleListItem,
  CreatePermissionData,
  CreateRoleData,
  IAdminRolesRepository,
  PermissionCatalogItem,
  UpdatePermissionData,
  UpdateRoleData,
} from '../interfaces/admin-roles.interfaces';

const PERMISSION_SELECT = {
  select: { id: true, code: true, name: true, module: true, resource: true, action: true },
} as const;

@Injectable()
export class AdminRolesRepository implements IAdminRolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, includeInactive = false): Promise<AdminRoleListItem[]> {
    const rows = await this.prisma.role.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: { select: { users: true, rolePermissions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((r) => toListItem(r));
  }

  async findById(tenantId: string, roleId: string): Promise<AdminRoleDetail | null> {
    const row = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        _count: { select: { users: true, rolePermissions: true } },
        rolePermissions: {
          include: { permission: PERMISSION_SELECT },
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      ...toListItem(row),
      permissions: row.rolePermissions.map((rp) => rp.permission),
    };
  }

  async findByCode(tenantId: string, code: string): Promise<{ id: string } | null> {
    return this.prisma.role.findFirst({
      where: { tenantId, code },
      select: { id: true },
    });
  }

  async hasActiveUsers(roleId: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { roleId, isActive: true, deletedAt: null },
    });
    return count > 0;
  }

  async create(tenantId: string, data: CreateRoleData): Promise<AdminRoleListItem> {
    const row = await this.prisma.role.create({
      data: {
        tenantId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
      },
      include: {
        _count: { select: { users: true, rolePermissions: true } },
      },
    });

    return toListItem(row);
  }

  async update(tenantId: string, roleId: string, data: UpdateRoleData): Promise<AdminRoleListItem> {
    const row = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        _count: { select: { users: true, rolePermissions: true } },
      },
    });

    return toListItem(row);
  }

  async deactivate(tenantId: string, roleId: string): Promise<void> {
    await this.prisma.role.update({
      where: { id: roleId },
      data: { isActive: false },
    });
  }

  async duplicateRole(
    tenantId: string,
    sourceRoleId: string,
    data: CreateRoleData,
  ): Promise<AdminRoleListItem> {
    const sourcePerms = await this.prisma.rolePermission.findMany({
      where: { roleId: sourceRoleId },
      select: { permissionId: true },
    });

    const newRole = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          tenantId,
          code: data.code,
          name: data.name,
          description: data.description,
          isActive: true,
        },
      });

      if (sourcePerms.length > 0) {
        await tx.rolePermission.createMany({
          data: sourcePerms.map(({ permissionId }) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
      }

      return role;
    });

    return {
      id: newRole.id,
      tenantId: newRole.tenantId,
      code: newRole.code,
      name: newRole.name,
      description: newRole.description,
      isActive: newRole.isActive,
      createdAt: newRole.createdAt,
      userCount: 0,
      permissionCount: sourcePerms.length,
    };
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);
  }

  async findAllPermissions(includeInactive = false): Promise<PermissionCatalogItem[]> {
    return this.prisma.permission.findMany({
      where: includeInactive ? {} : { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        module: true,
        resource: true,
        action: true,
        isActive: true,
      },
      orderBy: [{ module: 'asc' }, { resource: 'asc' }, { action: 'asc' }],
    });
  }

  async findPermissionById(id: string): Promise<PermissionCatalogItem | null> {
    return this.prisma.permission.findFirst({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        module: true,
        resource: true,
        action: true,
        isActive: true,
      },
    });
  }

  async findPermissionByCode(code: string): Promise<{ id: string } | null> {
    return this.prisma.permission.findFirst({
      where: { code },
      select: { id: true },
    });
  }

  async isPermissionInUse(id: string): Promise<boolean> {
    const count = await this.prisma.rolePermission.count({ where: { permissionId: id } });
    return count > 0;
  }

  async createPermission(data: CreatePermissionData): Promise<PermissionCatalogItem> {
    return this.prisma.permission.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        module: data.module,
        resource: data.resource,
        action: data.action,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        module: true,
        resource: true,
        action: true,
        isActive: true,
      },
    });
  }

  async updatePermission(id: string, data: UpdatePermissionData): Promise<PermissionCatalogItem> {
    return this.prisma.permission.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.module !== undefined && { module: data.module }),
        ...(data.resource !== undefined && { resource: data.resource }),
        ...(data.action !== undefined && { action: data.action }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        module: true,
        resource: true,
        action: true,
        isActive: true,
      },
    });
  }

  async deactivatePermission(id: string): Promise<void> {
    await this.prisma.permission.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findPermissionsByIds(ids: string[]): Promise<{ id: string }[]> {
    return this.prisma.permission.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  }
}

function toListItem(row: {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: { users: number; rolePermissions: number };
}): AdminRoleListItem {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    name: row.name,
    description: row.description,
    isActive: row.isActive,
    userCount: row._count.users,
    permissionCount: row._count.rolePermissions,
    createdAt: row.createdAt,
  };
}
