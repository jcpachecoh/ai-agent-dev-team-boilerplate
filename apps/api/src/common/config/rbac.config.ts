/**
 * Central RBAC matrix for API module access.
 * Epic OS-478 | Module OS-376
 */

export const ROLE_CODES = [
  'OWNER',
  'SUPERVISOR',
  'MANAGER',
  'OPERATOR',
  'OPERATIONS_ADMIN',
  'NOMINA',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export enum AppModule {
  INVENTARIOS = 'INVENTARIOS',
  NOMINA = 'NOMINA',
}

export const MODULE_ROLES: Record<AppModule, readonly RoleCode[]> = {
  [AppModule.INVENTARIOS]: ['OWNER', 'SUPERVISOR', 'MANAGER', 'OPERATOR'],
  [AppModule.NOMINA]: ['OWNER', 'SUPERVISOR', 'MANAGER', 'NOMINA'],
};

export const PAYROLL_MODULE_ROLES: readonly RoleCode[] = MODULE_ROLES[AppModule.NOMINA];

export const PAYROLL_WRITE_ROLES: readonly RoleCode[] = ['OWNER', 'SUPERVISOR', 'MANAGER'];

export const INVENTORY_MODULE_ROLES: readonly RoleCode[] = MODULE_ROLES[AppModule.INVENTARIOS];

export const NOMINA_READ_ONLY_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function canAccessModule(roleCode: string | undefined, module: AppModule): boolean {
  if (!roleCode) return false;
  return (MODULE_ROLES[module] as readonly string[]).includes(roleCode);
}
