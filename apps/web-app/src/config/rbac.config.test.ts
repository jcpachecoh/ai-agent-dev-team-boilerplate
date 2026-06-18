import { describe, expect, it } from 'vitest';

import {
  AppModule,
  canAccessModule,
  canAccessPath,
  getDefaultRouteForRole,
  isPayrollReadOnlyRole,
  NOMINA_DEFAULT_ROUTE,
  PRODUCCION_DEFAULT_ROUTE,
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

  describe('OPERATIONS_ADMIN', () => {
    it('allows OPERATIONS_ADMIN on produccion module', () => {
      expect(canAccessModule('OPERATIONS_ADMIN', AppModule.PRODUCCION)).toBe(true);
    });

    it('denies OPERATIONS_ADMIN on nomina module', () => {
      expect(canAccessModule('OPERATIONS_ADMIN', AppModule.NOMINA)).toBe(false);
    });

    it('denies OPERATIONS_ADMIN on inventarios module', () => {
      expect(canAccessModule('OPERATIONS_ADMIN', AppModule.INVENTARIOS)).toBe(false);
    });

    it('denies OPERATIONS_ADMIN on proveedores module', () => {
      expect(canAccessModule('OPERATIONS_ADMIN', AppModule.PROVEEDORES)).toBe(false);
    });

    it('allows OPERATIONS_ADMIN on produccion paths', () => {
      expect(canAccessPath('OPERATIONS_ADMIN', '/produccion/ordenes')).toBe(true);
    });

    it('denies OPERATIONS_ADMIN on payroll paths', () => {
      expect(canAccessPath('OPERATIONS_ADMIN', '/payroll/employees')).toBe(false);
    });

    it('denies OPERATIONS_ADMIN on inventory paths', () => {
      expect(canAccessPath('OPERATIONS_ADMIN', '/inventory/products')).toBe(false);
    });

    it('returns produccion/ordenes as default route for OPERATIONS_ADMIN', () => {
      expect(getDefaultRouteForRole('OPERATIONS_ADMIN')).toBe(PRODUCCION_DEFAULT_ROUTE);
    });
  });
});
