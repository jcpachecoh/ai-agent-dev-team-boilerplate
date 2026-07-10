import { describe, expect, it } from 'vitest';

import { employeePositionFormSchema } from './employeePosition.schema';

const validValues = {
  title: 'Analista de Nómina',
  area: 'Administración',
  baseSalaryRange: '4500000',
  isActive: true,
  supervisorPositionIds: [],
};

describe('employeePositionFormSchema', () => {
  it('accepts a position without supervisors', () => {
    const result = employeePositionFormSchema.safeParse(validValues);

    expect(result.success).toBe(true);
  });

  it('accepts one or more supervisorPositionIds', () => {
    const result = employeePositionFormSchema.safeParse({
      ...validValues,
      supervisorPositionIds: ['pos-1', 'pos-2'],
    });

    expect(result.success).toBe(true);
  });

  it('rejects a non-array supervisorPositionIds', () => {
    const result = employeePositionFormSchema.safeParse({
      ...validValues,
      supervisorPositionIds: 'pos-1',
    });

    expect(result.success).toBe(false);
  });

  it('still requires the base fields when supervisors are provided', () => {
    const result = employeePositionFormSchema.safeParse({
      ...validValues,
      title: '',
    });

    expect(result.success).toBe(false);
  });
});
