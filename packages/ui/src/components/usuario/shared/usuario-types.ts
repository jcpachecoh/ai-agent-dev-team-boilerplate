export type UsuarioTheme = 'light' | 'dark';
export type UsuarioSize = 'sm' | 'md';

export type UsuarioRoleVariant = 'owner' | 'supervisor' | 'manager' | 'default';

export interface UsuarioTableRowData {
  id: string;
  name: string;
  email: string;
  cedula: string;
  documentType: string;
  roleName: string;
  roleCode?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
}
