/**
 * OS-606 / CONN-04b — permiso de creación de solicitudes administrativas.
 *
 * Rol operativo de sede: ROLE code `MANAGER` (nombre seed "Manager").
 * En demo palos-de-lena el Administrador de sede es `mes-manager@…` con cargo
 * `pos-pdl-001` (ADMINISTRADOR). El service sigue exigiendo ese cargo + UserLocation
 * aunque OWNER/SUPER_ADMIN tengan el permiso vía ALL_PERMISSION_CODES.
 *
 * P4 pendiente: no otorgar a NOMINA. SUPERVISOR tampoco.
 */

export const OS606_SEDE_ADMIN_ROLE_CODE = 'MANAGER' as const;

export const OS606_OVERTIME_REQUEST_PERMISSION_SEED = {
  id: 'cccccccc-0000-0000-0000-000000000082',
  code: 'attendance.overtime.request',
  name: 'Solicitar extensión de jornada administrativa',
  description:
    'Crear solicitudes administrativas de extensión de jornada (CONN-04b). No implica aprobación.',
  module: 'attendance',
  resource: 'overtime',
  action: 'request',
} as const;

export const OS606_OVERTIME_REQUEST_CODES = [OS606_OVERTIME_REQUEST_PERMISSION_SEED.code] as const;

/** Roles con asignación explícita en ROLE_PERMISSION_MATRIX (no ALL). */
export const OS606_OVERTIME_REQUEST_ASSIGNED_ROLE_CODES = [OS606_SEDE_ADMIN_ROLE_CODE] as const;

/** Roles que no deben recibir el permiso create (P4 / alcance sede). */
export const OS606_OVERTIME_REQUEST_EXCLUDED_ROLE_CODES = [
  'NOMINA',
  'SUPERVISOR',
  'OPERATOR',
  'OPERATIONS_ADMIN',
] as const;

/** Roles con ALL_PERMISSION_CODES — tienen el permiso, sujetos a cargo/sede en service. */
export const OS606_OVERTIME_REQUEST_ALL_ROLE_CODES = ['OWNER', 'SUPER_ADMIN'] as const;
