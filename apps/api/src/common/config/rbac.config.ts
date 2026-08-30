/**
 * Central RBAC matrix for API module access.
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
  INVENTARIOS = 'INVENTARIOS',
  NOMINA = 'NOMINA',
  PRODUCCION = 'PRODUCCION',
}

/** Roles that always mirror OWNER access — any module OWNER can reach, SUPER_ADMIN can too. */
export const SYSTEM_ADMIN_ROLES = ['OWNER', 'SUPER_ADMIN'] as const satisfies readonly RoleCode[];

export const MODULE_ROLES: Record<AppModule, readonly RoleCode[]> = {
  [AppModule.INVENTARIOS]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER', 'OPERATOR'],
  [AppModule.NOMINA]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER', 'NOMINA'],
  [AppModule.PRODUCCION]: [...SYSTEM_ADMIN_ROLES, 'SUPERVISOR', 'MANAGER', 'OPERATIONS_ADMIN'],
};

export const PAYROLL_MODULE_ROLES: readonly RoleCode[] = MODULE_ROLES[AppModule.NOMINA];

export const PAYROLL_WRITE_ROLES: readonly RoleCode[] = [
  ...SYSTEM_ADMIN_ROLES,
  'SUPERVISOR',
  'MANAGER',
];

/**
 * Roles cuyo acceso de lectura debe acotarse a las sedes asignadas en `UserLocation`
 * (mismo patrón que `TURNO_ASSIGNMENTS_LOCATION_SCOPED_ROLES`). `SYSTEM_ADMIN_ROLES`
 * y `NOMINA` ven todas las sedes del tenant.
 */
export const LOCATION_SCOPED_ROLES: readonly RoleCode[] = ['SUPERVISOR', 'MANAGER'];

export const INVENTORY_MODULE_ROLES: readonly RoleCode[] = MODULE_ROLES[AppModule.INVENTARIOS];

export const PRODUCCION_MODULE_ROLES: readonly RoleCode[] = MODULE_ROLES[AppModule.PRODUCCION];

export const NOMINA_READ_ONLY_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function canAccessModule(roleCode: string | undefined, module: AppModule): boolean {
  if (!roleCode) return false;
  return (MODULE_ROLES[module] as readonly string[]).includes(roleCode);
}
