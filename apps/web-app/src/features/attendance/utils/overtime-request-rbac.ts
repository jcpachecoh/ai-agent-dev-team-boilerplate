import { SYSTEM_ADMIN_ROLES, type RoleCode } from '@/config/rbac.config';

import { OVERTIME_REQUEST_PERMISSION } from '../types/overtime.types';

/**
 * CTA create admin — **inferencia por `roleCode`**, no por `permissionCodes`.
 *
 * `useMe` / JWT exponen `roleCode` pero no un array de permisos efectivos en esta
 * pantalla. Este helper lista los roles del seed que reciben
 * `attendance.overtime.request` (MANAGER + OWNER/SUPER_ADMIN vía ALL).
 *
 * Riesgo: no es autorización dinámica; un MANAGER sin cargo/sede puede ver el CTA
 * y recibir 403 del BE. La fuente de verdad sigue siendo
 * `OvertimeAdminCreateService.assertRequesterCanCreate`.
 */
export const OVERTIME_REQUEST_EFFECTIVE_ROLES: readonly RoleCode[] = [
  ...SYSTEM_ADMIN_ROLES,
  'MANAGER',
];

export function canRequestAdministrativeOvertime(roleCode: string | null | undefined): boolean {
  if (!roleCode) {
    return false;
  }
  return (OVERTIME_REQUEST_EFFECTIVE_ROLES as readonly string[]).includes(roleCode);
}

export function getOvertimeRequestPermissionCode(): string {
  return OVERTIME_REQUEST_PERMISSION;
}
