import { describe, expect, it } from 'vitest';

import type { PayrollEmployee } from '../types/payroll.types';
import {
  buildSocialSecurityAffiliations,
  resolveAffiliationStatus,
} from './social-security-affiliations';

const baseEmployee = {
  id: 'emp-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  name: 'Ana Pérez',
  locationId: 'loc-1',
  position: 'Cajera',
  area: 'Servicio',
  department: 'Operaciones',
  contractType: 'INDEFINIDO',
  hireDate: '2024-03-15',
  contractStart: '2024-03-15',
  salaryType: 'ORDINARIO',
  salaryAmount: '2000000',
  hasTransportSubsidy: false,
  isExemptFromTax: false,
  epsName: 'Sura',
  pensionFundName: 'Protección',
  cesantiasFundName: 'Porvenir',
  arlName: 'Sura',
  arlRiskLevel: 'RIESGO_II',
  cajaCompensacion: 'Comfama',
  isActive: true,
  createdAt: '2024-03-15T00:00:00.000Z',
  updatedAt: '2024-03-15T00:00:00.000Z',
} satisfies PayrollEmployee;

describe('resolveAffiliationStatus', () => {
  it('marca activo cuando el empleado está activo y la entidad está configurada', () => {
    expect(resolveAffiliationStatus(true, 'Sura')).toBe('ACTIVE');
  });

  it('marca inactivo cuando la entidad es placeholder', () => {
    expect(resolveAffiliationStatus(true, 'Por definir')).toBe('INACTIVE');
  });

  it('marca inactivo cuando el empleado está inactivo', () => {
    expect(resolveAffiliationStatus(false, 'Sura')).toBe('INACTIVE');
  });
});

describe('buildSocialSecurityAffiliations', () => {
  it('devuelve las 4 afiliaciones con fecha de vinculación', () => {
    const affiliations = buildSocialSecurityAffiliations(baseEmployee);

    expect(affiliations).toHaveLength(4);
    expect(affiliations.map((item) => item.key)).toEqual([
      'health',
      'pension',
      'arl',
      'compensationFund',
    ]);
    expect(affiliations.every((item) => item.linkedAt === '2024-03-15')).toBe(true);
    expect(affiliations.every((item) => item.status === 'ACTIVE')).toBe(true);
  });

  it('incluye nivel ARL como dato adicional', () => {
    const affiliations = buildSocialSecurityAffiliations(baseEmployee);
    const arl = affiliations.find((item) => item.key === 'arl');

    expect(arl?.extraValue).toBe('Riesgo II');
  });
});
