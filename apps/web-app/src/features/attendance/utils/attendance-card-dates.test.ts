import { describe, expect, it } from 'vitest';

import { validateAttendanceDateRange } from './attendance-card-dates';

describe('validateAttendanceDateRange', () => {
  it('acepta un rango dentro de 3 meses', () => {
    const error = validateAttendanceDateRange(new Date('2026-04-01'), new Date('2026-06-30'));
    expect(error).toBeNull();
  });

  it('rechaza un rango mayor a 3 meses', () => {
    const error = validateAttendanceDateRange(new Date('2026-01-01'), new Date('2026-06-30'));
    expect(error).toBe('El rango máximo de consulta es de 3 meses.');
  });

  it('rechaza cuando "desde" es posterior a "hasta"', () => {
    const error = validateAttendanceDateRange(new Date('2026-06-30'), new Date('2026-06-01'));
    expect(error).toBe('La fecha Desde no puede ser posterior a la fecha Hasta.');
  });
});
