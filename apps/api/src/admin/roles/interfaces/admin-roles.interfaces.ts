export interface PermissionRef {
  id: string;
  code: string;
  name: string;
  module: string | null;
  resource: string | null;
  action: string | null;
}

export interface PermissionCatalogItem extends PermissionRef {
  description: string | null;
  isActive: boolean;
}

export interface AdminRoleListItem {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: Date;
}

export interface AdminRoleDetail extends AdminRoleListItem {
  permissions: PermissionRef[];
}

export interface CreateRoleData {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreatePermissionData {
  code: string;
  name: string;
  description?: string;
  module?: string;
  resource?: string;
  action?: string;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
  module?: string;
  resource?: string;
  action?: string;
  isActive?: boolean;
}

export interface IAdminRolesRepository {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminRoleListItem[]>;
  findById(tenantId: string, roleId: string): Promise<AdminRoleDetail | null>;
  findByCode(tenantId: string, code: string): Promise<{ id: string } | null>;
  hasActiveUsers(roleId: string): Promise<boolean>;
  create(tenantId: string, data: CreateRoleData): Promise<AdminRoleListItem>;
  update(tenantId: string, roleId: string, data: UpdateRoleData): Promise<AdminRoleListItem>;
  deactivate(tenantId: string, roleId: string): Promise<void>;
  duplicateRole(
    tenantId: string,
    sourceRoleId: string,
    data: CreateRoleData,
  ): Promise<AdminRoleListItem>;
  setRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;
  findAllPermissions(includeInactive?: boolean): Promise<PermissionCatalogItem[]>;
  findPermissionById(id: string): Promise<PermissionCatalogItem | null>;
  findPermissionByCode(code: string): Promise<{ id: string } | null>;
  isPermissionInUse(id: string): Promise<boolean>;
  createPermission(data: CreatePermissionData): Promise<PermissionCatalogItem>;
  updatePermission(id: string, data: UpdatePermissionData): Promise<PermissionCatalogItem>;
  deactivatePermission(id: string): Promise<void>;
  findPermissionsByIds(ids: string[]): Promise<{ id: string }[]>;
}

export interface IAdminRolesService {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminRoleListItem[]>;
  findById(tenantId: string, roleId: string): Promise<AdminRoleDetail>;
  createRole(tenantId: string, data: CreateRoleData): Promise<AdminRoleListItem>;
  updateRole(tenantId: string, roleId: string, data: UpdateRoleData): Promise<AdminRoleListItem>;
  deactivateRole(tenantId: string, roleId: string): Promise<void>;
  duplicateRole(
    tenantId: string,
    sourceRoleId: string,
    data: CreateRoleData,
  ): Promise<AdminRoleListItem>;
  assignRolePermissions(tenantId: string, roleId: string, permissionIds: string[]): Promise<void>;
  getPermissionCatalog(includeInactive?: boolean): Promise<PermissionCatalogItem[]>;
  createPermission(data: CreatePermissionData): Promise<PermissionCatalogItem>;
  updatePermission(id: string, data: UpdatePermissionData): Promise<PermissionCatalogItem>;
  deactivatePermission(id: string): Promise<void>;
}
