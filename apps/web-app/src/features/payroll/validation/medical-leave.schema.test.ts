import { describe, expect, it } from 'vitest';

import { medicalLeaveFormSchema } from './medical-leave.schema';

describe('medicalLeaveFormSchema', () => {
  it('acepta un rango de fechas válido', () => {
    const result = medicalLeaveFormSchema.safeParse({
      employeeId: 'emp-1',
      origin: 'COMUN',
      startDate: '2026-03-01',
      endDate: '2026-03-05',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza cuando la fecha fin es anterior a la fecha inicio', () => {
    const result = medicalLeaveFormSchema.safeParse({
      employeeId: 'emp-1',
      origin: 'COMUN',
      startDate: '2026-03-10',
      endDate: '2026-03-01',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'La fecha fin debe ser posterior o igual a la fecha inicio',
      );
    }
  });

  it('requiere empleado y ambas fechas', () => {
    const result = medicalLeaveFormSchema.safeParse({
      employeeId: '',
      origin: 'COMUN',
      startDate: '',
      endDate: '',
    });

    expect(result.success).toBe(false);
  });
});
