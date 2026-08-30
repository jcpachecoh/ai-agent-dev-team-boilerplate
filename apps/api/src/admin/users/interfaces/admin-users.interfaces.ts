import type { DocumentType, PermissionEffect } from '@prisma/client';

export interface AdminUserRole {
  id: string;
  code: string;
  name: string;
}

export interface AdminUserListItem {
  id: string;
  tenantId: string;
  name: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  role: AdminUserRole;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface AdminUserDetail extends AdminUserListItem {
  loginAttempts: number;
  lockedUntil: Date | null;
  passwordChangedAt: Date | null;
  createdBy: string | null;
}

export interface CreateAdminUserData {
  name: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId: string;
  passwordHash: string;
  createdBy: string;
  locationId?: string;
  /** Set when roleCode === 'OPERATOR' to auto-create linked OperationalUser in the same transaction */
  operationalUser?: {
    cedulaHash: string;
    pinHash: string;
  };
}

export interface UpdateAdminUserData {
  email?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface UserPermissionOverrideInput {
  permissionId: string;
  effect: PermissionEffect;
}

export interface IAdminUsersRepository {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminUserListItem[]>;
  findById(tenantId: string, userId: string): Promise<AdminUserDetail | null>;
  findByEmail(tenantId: string, email: string): Promise<{ id: string } | null>;
  findByCedula(tenantId: string, cedula: string): Promise<{ id: string } | null>;
  findRoleCode(roleId: string): Promise<string | null>;
  create(tenantId: string, data: CreateAdminUserData): Promise<AdminUserListItem>;
  createWithEmployeeDetails(
    tenantId: string,
    data: CreateAdminUserData,
  ): Promise<AdminUserListItem>;
  update(tenantId: string, userId: string, data: UpdateAdminUserData): Promise<AdminUserListItem>;
  deactivate(tenantId: string, userId: string): Promise<void>;
  setUserPermissionOverrides(
    userId: string,
    overrides: UserPermissionOverrideInput[],
  ): Promise<void>;
}

export interface IAdminUsersService {
  findAll(tenantId: string, includeInactive?: boolean): Promise<AdminUserListItem[]>;
  findById(tenantId: string, userId: string): Promise<AdminUserDetail>;
  createUser(
    tenantId: string,
    data: Omit<CreateAdminUserData, 'passwordHash' | 'createdBy'> & { password?: string },
    requesterId: string,
  ): Promise<AdminUserListItem>;
  updateUser(
    tenantId: string,
    userId: string,
    data: UpdateAdminUserData,
    requesterId: string,
  ): Promise<AdminUserListItem>;
  deactivateUser(tenantId: string, userId: string, requesterId: string): Promise<void>;
  assignUserPermissions(
    tenantId: string,
    userId: string,
    overrides: UserPermissionOverrideInput[],
  ): Promise<void>;
}
