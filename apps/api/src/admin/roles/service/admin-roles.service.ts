import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import type {
  AdminRoleDetail,
  AdminRoleListItem,
  CreatePermissionData,
  CreateRoleData,
  IAdminRolesService,
  PermissionCatalogItem,
  UpdatePermissionData,
  UpdateRoleData,
} from '../interfaces/admin-roles.interfaces';
import { AdminRolesRepository } from '../repository/admin-roles.repository';

const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9_]*$/;

const PROTECTED_ROLE_CODES = ['OWNER', 'SUPER_ADMIN'] as const;

const PROTECTED_PERMISSION_CODES = [
  'admin.roles.read',
  'admin.roles.manage',
  'admin.roles.permissions.assign',
  'admin.users.read',
  'admin.users.update',
  'admin.users.create',
  'admin.users.deactivate',
] as const;

@Injectable()
export class AdminRolesService implements IAdminRolesService {
  private readonly logger = new Logger(AdminRolesService.name);

  constructor(private readonly repo: AdminRolesRepository) {}

  findAll(tenantId: string, includeInactive = false): Promise<AdminRoleListItem[]> {
    return this.repo.findAll(tenantId, includeInactive);
  }

  async findById(tenantId: string, roleId: string): Promise<AdminRoleDetail> {
    const role = await this.repo.findById(tenantId, roleId);
    if (!role) {
      throw new NotFoundException(`Role "${roleId}" not found`);
    }
    return role;
  }

  async createRole(tenantId: string, data: CreateRoleData): Promise<AdminRoleListItem> {
    if (!UPPER_SNAKE_CASE.test(data.code)) {
      throw new ConflictException('Role code must be UPPER_SNAKE_CASE (e.g. MY_ROLE)');
    }

    const existing = await this.repo.findByCode(tenantId, data.code);
    if (existing) {
      throw new ConflictException(`Role code "${data.code}" already exists in tenant`);
    }

    return this.repo.create(tenantId, data);
  }

  async updateRole(
    tenantId: string,
    roleId: string,
    data: UpdateRoleData,
  ): Promise<AdminRoleListItem> {
    const existing = await this.repo.findById(tenantId, roleId);
    if (!existing) {
      throw new NotFoundException(`Role "${roleId}" not found`);
    }

    return this.repo.update(tenantId, roleId, data);
  }

  async deactivateRole(tenantId: string, roleId: string): Promise<void> {
    const existing = await this.repo.findById(tenantId, roleId);
    if (!existing) {
      throw new NotFoundException(`Role "${roleId}" not found`);
    }

    if ((PROTECTED_ROLE_CODES as readonly string[]).includes(existing.code)) {
      throw new ConflictException(
        `El rol "${existing.code}" es un rol sistema y no puede desactivarse`,
      );
    }

    const hasUsers = await this.repo.hasActiveUsers(roleId);
    if (hasUsers) {
      throw new ConflictException(
        'Role has active users — reassign them to another role before deactivating',
      );
    }

    await this.repo.deactivate(tenantId, roleId);
  }

  async duplicateRole(
    tenantId: string,
    sourceRoleId: string,
    data: CreateRoleData,
  ): Promise<AdminRoleListItem> {
    const source = await this.repo.findById(tenantId, sourceRoleId);
    if (!source) {
      throw new NotFoundException(`Role "${sourceRoleId}" not found`);
    }

    if (!UPPER_SNAKE_CASE.test(data.code)) {
      throw new ConflictException('Role code must be UPPER_SNAKE_CASE (e.g. MY_ROLE)');
    }

    const existing = await this.repo.findByCode(tenantId, data.code);
    if (existing) {
      throw new ConflictException(`Role code "${data.code}" already exists in tenant`);
    }

    return this.repo.duplicateRole(tenantId, sourceRoleId, data);
  }

  async assignRolePermissions(
    tenantId: string,
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const existing = await this.repo.findById(tenantId, roleId);
    if (!existing) {
      throw new NotFoundException(`Role "${roleId}" not found`);
    }

    if (permissionIds.length > 0) {
      const found = await this.repo.findPermissionsByIds(permissionIds);
      if (found.length !== permissionIds.length) {
        const foundIds = new Set(found.map((p) => p.id));
        const missing = permissionIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(`Permission(s) not found: ${missing.join(', ')}`);
      }
    }

    await this.repo.setRolePermissions(roleId, permissionIds);
    this.logger.log(
      `[admin-roles] Permissions updated — roleId="${roleId}" count=${permissionIds.length}`,
    );
  }

  getPermissionCatalog(includeInactive = false): Promise<PermissionCatalogItem[]> {
    return this.repo.findAllPermissions(includeInactive);
  }

  async createPermission(data: CreatePermissionData): Promise<PermissionCatalogItem> {
    const existing = await this.repo.findPermissionByCode(data.code);
    if (existing) {
      throw new ConflictException(`Permission code "${data.code}" already exists`);
    }
    return this.repo.createPermission(data);
  }

  async updatePermission(id: string, data: UpdatePermissionData): Promise<PermissionCatalogItem> {
    const existing = await this.repo.findPermissionById(id);
    if (!existing) {
      throw new NotFoundException(`Permission "${id}" not found`);
    }
    return this.repo.updatePermission(id, data);
  }

  async deactivatePermission(id: string): Promise<void> {
    const existing = await this.repo.findPermissionById(id);
    if (!existing) {
      throw new NotFoundException(`Permission "${id}" not found`);
    }

    if ((PROTECTED_PERMISSION_CODES as readonly string[]).includes(existing.code)) {
      throw new ConflictException(
        `El permiso "${existing.code}" es crítico y no puede desactivarse`,
      );
    }

    await this.repo.deactivatePermission(id);
  }
}
