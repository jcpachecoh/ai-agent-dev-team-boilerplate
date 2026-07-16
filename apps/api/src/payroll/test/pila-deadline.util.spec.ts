import {
  calculatePilaDueDate,
  extractLastTwoNitDigits,
  getPilaDeadlineStatus,
  getPilaDueBusinessDay,
  isPilaBusinessDay,
  PILA_ALERT_THRESHOLD_DAYS,
  PILA_NIT_BUSINESS_DAY_RANGES,
  resolveNthBusinessDayOfMonth,
  resolvePilaPaymentMonth,
} from '../utils/pila-deadline.util';

describe('pila-deadline.util', () => {
  describe('NIT last two digits (sin DV)', () => {
    it('extrae dos últimos dígitos sin DV', () => {
      expect(extractLastTwoNitDigits('900000000')).toBe('00');
      expect(extractLastTwoNitDigits('900123456')).toBe('56');
      expect(extractLastTwoNitDigits('12')).toBe('12');
    });

    it('rechaza NIT demasiado corto', () => {
      expect(extractLastTwoNitDigits('1')).toBeNull();
      expect(extractLastTwoNitDigits('')).toBeNull();
    });

    it('mapea cada rango NIT → día hábil', () => {
      for (const range of PILA_NIT_BUSINESS_DAY_RANGES) {
        expect(getPilaDueBusinessDay(range.min)).toBe(range.businessDay);
        expect(getPilaDueBusinessDay(range.max)).toBe(range.businessDay);
      }
      expect(getPilaDueBusinessDay('00')).toBe(2);
      expect(getPilaDueBusinessDay('99')).toBe(16);
    });
  });

  describe('período vs mes de pago', () => {
    it('avanza un mes y maneja diciembre→enero', () => {
      expect(resolvePilaPaymentMonth('2026-07')).toBe('2026-08');
      expect(resolvePilaPaymentMonth('2026-12')).toBe('2027-01');
    });
  });

  describe('días hábiles', () => {
    it('excluye fin de semana', () => {
      // 2026-08-01 Saturday, 2026-08-02 Sunday
      expect(isPilaBusinessDay(new Date(Date.UTC(2026, 7, 1)))).toBe(false);
      expect(isPilaBusinessDay(new Date(Date.UTC(2026, 7, 2)))).toBe(false);
      // 2026-08-03 Monday
      expect(isPilaBusinessDay(new Date(Date.UTC(2026, 7, 3)))).toBe(true);
    });

    it('excluye festivo nacional (2026-08-17 Asunción movible)', () => {
      expect(isPilaBusinessDay(new Date(Date.UTC(2026, 7, 17)))).toBe(false);
    });

    it('resuelve 2º día hábil de agosto 2026 (lun 3, mar 4)', () => {
      const d = resolveNthBusinessDayOfMonth(2026, 8, 2);
      expect(d.toISOString().slice(0, 10)).toBe('2026-08-04');
    });

    it('resuelve 16º día hábil de agosto 2026', () => {
      const d = resolveNthBusinessDayOfMonth(2026, 8, 16);
      // Aug 2026: 3–7, 10–14, 18–21, 24–26 (17 festivo) → 16º = 26
      expect(d.toISOString().slice(0, 10)).toBe('2026-08-26');
    });
  });

  describe('calculatePilaDueDate', () => {
    it('usa dos últimos dígitos y mes de pago', () => {
      const result = calculatePilaDueDate('2026-07', '900000000'); // ends 00 → 2nd BD of Aug
      expect(result.paymentMonth).toBe('2026-08');
      expect(result.businessDayNumber).toBe(2);
      expect(result.lastTwoNitDigits).toBe('00');
      expect(result.dueDate).toBe('2026-08-04');
    });

    it('cambio de año diciembre→enero', () => {
      const result = calculatePilaDueDate('2026-12', '900000099'); // 99 → 16th BD of Jan 2027
      expect(result.paymentMonth).toBe('2027-01');
      expect(result.businessDayNumber).toBe(16);
    });
  });

  describe('getPilaDeadlineStatus', () => {
    it('CONFIG_INCOMPLETE sin NIT — sin fecha falsa', () => {
      const result = getPilaDeadlineStatus({
        period: '2026-07',
        nit: null,
        isPaid: false,
        todayYmd: '2026-08-01',
      });
      expect(result.status).toBe('CONFIG_INCOMPLETE');
      expect(result.dueDate).toBeNull();
      expect(result.shouldAlert).toBe(false);
    });

    it('NOT_DUE fuera del umbral', () => {
      const result = getPilaDeadlineStatus({
        period: '2026-07',
        nit: '900000000',
        isPaid: false,
        todayYmd: '2026-07-20', // due 2026-08-04 → >5 days
      });
      expect(result.dueDate).toBe('2026-08-04');
      expect(result.daysRemaining).toBeGreaterThan(PILA_ALERT_THRESHOLD_DAYS);
      expect(result.status).toBe('NOT_DUE');
      expect(result.shouldAlert).toBe(false);
    });

    it('UPCOMING dentro del umbral', () => {
      const result = getPilaDeadlineStatus({
        period: '2026-07',
        nit: '900000000',
        isPaid: false,
        todayYmd: '2026-07-31', // 4 days before Aug 4
      });
      expect(result.status).toBe('UPCOMING');
      expect(result.shouldAlert).toBe(true);
    });

    it('DUE_TODAY', () => {
      const result = getPilaDeadlineStatus({
        period: '2026-07',
        nit: '900000000',
        isPaid: false,
        todayYmd: '2026-08-04',
      });
      expect(result.status).toBe('DUE_TODAY');
      expect(result.daysRemaining).toBe(0);
      expect(result.shouldAlert).toBe(true);
    });

    it('OVERDUE', () => {
      const result = getPilaDeadlineStatus({
        period: '2026-07',
        nit: '900000000',
        isPaid: false,
        todayYmd: '2026-08-05',
      });
      expect(result.status).toBe('OVERDUE');
      expect(result.shouldAlert).toBe(true);
    });

    it('PAID prevalece — no alerta de deuda', () => {
      const result = getPilaDeadlineStatus({
        period: '2026-07',
        nit: '900000000',
        isPaid: true,
        todayYmd: '2026-08-10',
      });
      expect(result.status).toBe('PAID');
      expect(result.shouldAlert).toBe(false);
    });
  });
});
