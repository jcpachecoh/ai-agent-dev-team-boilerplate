/**
 * Central RBAC matrix for web-app module access.
 * Epic OS-478 | Module OS-376
 */

export const ROLE_CODES = [
  'OWNER',
  'SUPER_ADMIN',
  'SUPERVISOR',
  'MANAGER',
  'OPERATOR',
  'OPERATIONS_ADMIN',
  'NOMINA',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export enum AppModule {
  DASHBOARD = 'DASHBOARD',
  PROVEEDORES = 'PROVEEDORES',
  INVENTARIOS = 'INVENTARIOS',
  RECETAS = 'RECETAS',
  PRODUCCION = 'PRODUCCION',
  SUPERVISOR = 'SUPERVISOR',
  DESPACHO = 'DESPACHO',
  USUARIOS = 'USUARIOS',
  NOMINA = 'NOMINA',
  EMPRESA = 'EMPRESA',
  CONFIGURACION = 'CONFIGURACION',
}

/** Roles that always mirror OWNER access — any module OWNER can reach, SUPER_ADMIN can too. */
export const SYSTEM_ADMIN_ROLES = ['OWNER', 'SUPER_ADMIN'] as const satisfies readonly RoleCode[];

/** Roles allowed per module (sidebar + route guards). */
export const MODULE_ROLES: Record<AppModule, readonly RoleCode[]> = {
  [AppModule.DASHBOARD]: [
    ...SYSTEM_ADMIN_ROLES,
    'SUPERVISOR',
    'MANAGER',
    'OPERATOR',
    'OPERATIONS_ADMIN',
  ],
  [AppModule.PROVEEDORES]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER'],
  [AppModule.INVENTARIOS]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER'],
  [AppModule.RECETAS]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER'],
  [AppModule.PRODUCCION]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER', 'OPERATIONS_ADMIN'],
  [AppModule.SUPERVISOR]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER'],
  [AppModule.DESPACHO]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER'],
  [AppModule.USUARIOS]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR'],
  [AppModule.NOMINA]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER', 'NOMINA'],
  [AppModule.EMPRESA]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER'],
  [AppModule.CONFIGURACION]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER'],
};

export const NAV_ID_TO_MODULE: Record<string, AppModule> = {
  proveedores: AppModule.PROVEEDORES,
  inventario: AppModule.INVENTARIOS,
  recetas: AppModule.RECETAS,
  produccion: AppModule.PRODUCCION,
  supervisor: AppModule.SUPERVISOR,
  despacho: AppModule.DESPACHO,
  usuarios: AppModule.USUARIOS,
  nomina: AppModule.NOMINA,
  empresa: AppModule.EMPRESA,
  settings: AppModule.CONFIGURACION,
};

/** Nómina sub-routes hidden for read-only NOMINA role (phase 1). */
export const NOMINA_HIDDEN_NAV_CHILD_IDS = new Set(['payroll-salaries']);

export const ROUTE_PREFIX_TO_MODULE: ReadonlyArray<{ prefix: string; module: AppModule }> = [
  { prefix: '/payroll', module: AppModule.NOMINA },
  { prefix: '/inventory', module: AppModule.INVENTARIOS },
  { prefix: '/proveedores', module: AppModule.PROVEEDORES },
  { prefix: '/recetas', module: AppModule.RECETAS },
  { prefix: '/produccion', module: AppModule.PRODUCCION },
  { prefix: '/supervisor', module: AppModule.SUPERVISOR },
  { prefix: '/dispatch', module: AppModule.DESPACHO },
  { prefix: '/users', module: AppModule.USUARIOS },
  { prefix: '/empresa', module: AppModule.EMPRESA },
  { prefix: '/settings', module: AppModule.CONFIGURACION },
  { prefix: '/reports', module: AppModule.SUPERVISOR },
  { prefix: '/dev', module: AppModule.CONFIGURACION },
];

export const NOMINA_READ_ONLY_HTTP_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const;

export const PAYROLL_WRITE_ROLES: readonly RoleCode[] = [
  ...SYSTEM_ADMIN_ROLES,
  'SUPERVISOR',
  'MANAGER',
];

export const NOMINA_DEFAULT_ROUTE = '/payroll/employees';

export function canAccessModule(roleCode: string | null | undefined, module: AppModule): boolean {
  if (!roleCode) return false;
  return (MODULE_ROLES[module] as readonly string[]).includes(roleCode);
}

export function resolveModuleFromPath(pathname: string): AppModule | null {
  if (pathname === '/') return AppModule.DASHBOARD;

  const match = ROUTE_PREFIX_TO_MODULE.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return match?.module ?? null;
}

export function canAccessPath(roleCode: string | null | undefined, pathname: string): boolean {
  const module = resolveModuleFromPath(pathname);
  if (!module) return true;
  return canAccessModule(roleCode, module);
}

export const PRODUCCION_DEFAULT_ROUTE = '/produccion/ordenes';

export const SUPER_ADMIN_DEFAULT_ROUTE = '/users/roles';

export function getDefaultRouteForRole(roleCode: string | null | undefined): string {
  if (roleCode === 'NOMINA') return NOMINA_DEFAULT_ROUTE;
  if (roleCode === 'OPERATIONS_ADMIN') return PRODUCCION_DEFAULT_ROUTE;
  if (roleCode === 'SUPER_ADMIN') return SUPER_ADMIN_DEFAULT_ROUTE;
  return '/';
}

export function isPayrollReadOnlyRole(roleCode: string | null | undefined): boolean {
  return roleCode === 'NOMINA';
}
