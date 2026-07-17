import { describe, expect, it } from 'vitest';

import {
  canRequestAdministrativeOvertime,
  getOvertimeRequestPermissionCode,
} from './overtime-request-rbac';

describe('overtime-request-rbac', () => {
  it('expone el código de permiso efectivo attendance.overtime.request', () => {
    expect(getOvertimeRequestPermissionCode()).toBe('attendance.overtime.request');
  });

  it('permite crear con roles que tienen el permiso efectivo', () => {
    expect(canRequestAdministrativeOvertime('MANAGER')).toBe(true);
    expect(canRequestAdministrativeOvertime('OWNER')).toBe(true);
    expect(canRequestAdministrativeOvertime('SUPER_ADMIN')).toBe(true);
  });

  it('niega create con solo lectura (NOMINA) u otros roles', () => {
    expect(canRequestAdministrativeOvertime('NOMINA')).toBe(false);
    expect(canRequestAdministrativeOvertime('SUPERVISOR')).toBe(false);
    expect(canRequestAdministrativeOvertime(null)).toBe(false);
    expect(canRequestAdministrativeOvertime(undefined)).toBe(false);
  });
});
