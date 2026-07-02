import { describe, expect, it } from 'vitest';

import {
  formatPaymentPeriod,
  formatPayrollCurrency,
  mapPaymentStatusToBadge,
  parseWithholdingRatePercent,
} from './financial-profile-display';

describe('financial-profile-display', () => {
  it('formatea montos en COP', () => {
    expect(formatPayrollCurrency(12150000)).toContain('12');
  });

  it('formatea periodo de pago', () => {
    expect(formatPaymentPeriod(2026, 6)).toBe('Junio 2026');
  });

  it('mapea estado de pago a badge', () => {
    expect(mapPaymentStatusToBadge('PAID')).toBe('COMPLETED');
    expect(mapPaymentStatusToBadge('PENDING')).toBe('PENDING');
  });

  it('parsea porcentaje de retención', () => {
    expect(parseWithholdingRatePercent('11')).toBe(0.11);
    expect(parseWithholdingRatePercent('101')).toBeUndefined();
  });
});
