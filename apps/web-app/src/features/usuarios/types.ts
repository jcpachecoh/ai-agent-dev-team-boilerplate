export type DocumentType = 'CC' | 'CE' | 'PASAPORTE' | 'TI' | 'PEP';

export interface AdminUserRoleRef {
  id: string;
  code: string;
  name: string;
}

export interface AdminUserApi {
  id: string;
  tenantId: string;
  name: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  role: AdminUserRoleRef;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminRoleOptionApi {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface UserFormValues {
  name: string;
  cedula: string;
  documentType: DocumentType;
  email: string;
  roleId: string;
  locationId?: string;
}

export interface UserUpdateFormValues {
  email: string;
  roleId: string;
}
