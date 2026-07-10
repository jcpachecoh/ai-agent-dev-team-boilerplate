import { describe, expect, it } from 'vitest';

import { formatOvertimeApprovalIndicator } from '../types/overtime.types';

describe('formatOvertimeApprovalIndicator', () => {
  it('muestra pendiente con minutos', () => {
    expect(formatOvertimeApprovalIndicator('PENDIENTE_ADMIN', 45)).toBe('Pendiente (45 min)');
  });

  it('muestra aprobada', () => {
    expect(formatOvertimeApprovalIndicator('APROBADA')).toBe('Aprobada');
  });
});
