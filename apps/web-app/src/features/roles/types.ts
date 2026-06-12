export type PermissionCatalogItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string | null;
  resource: string | null;
  action: string | null;
};

export type AdminRolePermission = {
  id: string;
  code: string;
  name: string;
  module: string | null;
  resource: string | null;
  action: string | null;
};

export type AdminRole = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: string;
};

export type AdminRoleDetail = AdminRole & {
  permissions: AdminRolePermission[];
};

export type CreateRoleFormValues = {
  code: string;
  name: string;
  description?: string;
};

export type UpdateRoleFormValues = {
  name?: string;
  description?: string;
  isActive?: boolean;
};
