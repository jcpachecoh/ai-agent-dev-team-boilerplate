import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import type {
  AdminRoleDetail,
  AdminRoleListItem,
  CreateRoleData,
  IAdminRolesService,
  PermissionCatalogItem,
  UpdateRoleData,
} from '../interfaces/admin-roles.interfaces';
import { AdminRolesRepository } from '../repository/admin-roles.repository';

const UPPER_SNAKE_CASE = /^[A-Z][A-Z0-9_]*$/;

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

    const hasUsers = await this.repo.hasActiveUsers(roleId);
    if (hasUsers) {
      throw new ConflictException(
        'Role has active users — reassign them to another role before deactivating',
      );
    }

    await this.repo.deactivate(tenantId, roleId);
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

  getPermissionCatalog(): Promise<PermissionCatalogItem[]> {
    return this.repo.findAllPermissions();
  }
}
