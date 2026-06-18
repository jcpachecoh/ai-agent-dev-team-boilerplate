import { describe, expect, it } from 'vitest';

import {
  AppModule,
  canAccessModule,
  canAccessPath,
  getDefaultRouteForRole,
  isPayrollReadOnlyRole,
  NOMINA_DEFAULT_ROUTE,
} from './rbac.config';

describe('rbac.config', () => {
  it('allows NOMINA on payroll module', () => {
    expect(canAccessModule('NOMINA', AppModule.NOMINA)).toBe(true);
  });

  it('denies NOMINA on inventory module', () => {
    expect(canAccessModule('NOMINA', AppModule.INVENTARIOS)).toBe(false);
  });

  it('allows MANAGER on inventory module', () => {
    expect(canAccessModule('MANAGER', AppModule.INVENTARIOS)).toBe(true);
  });

  it('denies NOMINA on inventory paths', () => {
    expect(canAccessPath('NOMINA', '/inventory/products')).toBe(false);
  });

  it('allows NOMINA on payroll paths', () => {
    expect(canAccessPath('NOMINA', '/payroll/employees')).toBe(true);
  });

  it('returns payroll employees as default route for NOMINA', () => {
    expect(getDefaultRouteForRole('NOMINA')).toBe(NOMINA_DEFAULT_ROUTE);
    expect(getDefaultRouteForRole('MANAGER')).toBe('/');
  });

  it('marks NOMINA as payroll read-only', () => {
    expect(isPayrollReadOnlyRole('NOMINA')).toBe(true);
    expect(isPayrollReadOnlyRole('MANAGER')).toBe(false);
  });
});
