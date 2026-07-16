import { SYSTEM_ADMIN_ROLES } from '../common/config/rbac.config';

// CONN-06 — asignación diaria de sede real para empleados con Centro de Costos Rotante.
export const DAILY_COST_CENTER_READ_PERMISSION = 'attendance.daily-cost-center.read';
export const DAILY_COST_CENTER_WRITE_PERMISSION = 'attendance.daily-cost-center.write';

/** SUPERVISOR/MANAGER quedan acotados a sus sedes (UserLocation) en el service; NOMINA es tenant-wide. */
export const DAILY_COST_CENTER_READ_ROLES = [
  ...SYSTEM_ADMIN_ROLES,
  'SUPERVISOR',
  'MANAGER',
  'NOMINA',
] as const;
export const DAILY_COST_CENTER_WRITE_ROLES = [
  ...SYSTEM_ADMIN_ROLES,
  'SUPERVISOR',
  'MANAGER',
  'NOMINA',
] as const;

/** Roles cuyo acceso queda acotado a las sedes asignadas vía UserLocation (D2/D7 no aplica al scoping). */
export const DAILY_COST_CENTER_LOCATION_SCOPED_ROLES = ['SUPERVISOR', 'MANAGER'] as const;
