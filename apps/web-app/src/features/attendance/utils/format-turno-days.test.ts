import { describe, expect, it } from 'vitest';

import { formatTurnoDaysOfWeek } from './format-turno-days';

describe('formatTurnoDaysOfWeek', () => {
  it('formatea días laborales en orden Lun–Dom', () => {
    expect(formatTurnoDaysOfWeek([1, 2, 3, 4, 5])).toBe('Lun · Mar · Mié · Jue · Vie');
  });

  it('incluye fin de semana cuando aplica', () => {
    expect(formatTurnoDaysOfWeek([0, 6])).toBe('Sáb · Dom');
  });

  it('retorna guión cuando no hay días', () => {
    expect(formatTurnoDaysOfWeek([])).toBe('—');
  });
});
