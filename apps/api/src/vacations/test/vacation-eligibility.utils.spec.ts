import { EmployeeContractType } from '@prisma/client';

import { isEmployeeEligibleForVacations } from '../utils/vacation-eligibility.utils';

describe('vacation-eligibility.utils', () => {
  it('allows labor contract types to request vacations', () => {
    expect(isEmployeeEligibleForVacations(EmployeeContractType.INDEFINIDO)).toBe(true);
    expect(isEmployeeEligibleForVacations(EmployeeContractType.FIJO)).toBe(true);
    expect(isEmployeeEligibleForVacations(EmployeeContractType.OBRA)).toBe(true);
    expect(isEmployeeEligibleForVacations(EmployeeContractType.APRENDIZAJE)).toBe(true);
  });

  it('blocks prestación de servicios from vacation eligibility', () => {
    expect(isEmployeeEligibleForVacations(EmployeeContractType.PRESTACION)).toBe(false);
  });
});
