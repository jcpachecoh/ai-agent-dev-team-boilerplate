import {
  daysUntilCesantiasDeadline,
  resolveCesantiasDeadline,
  resolveCesantiasDeadlineDate,
  resolveCesantiasDeadlineStatus,
  resolveCesantiasTargetYear,
} from '../utils/cesantias-deadline.util';

describe('cesantias-deadline.util', (): void => {
  describe('resolveCesantiasTargetYear', (): void => {
    it('es siempre el año calendario anterior, sin importar si ya pasó el 14 de febrero', (): void => {
      expect(resolveCesantiasTargetYear(new Date('2026-01-10T00:00:00.000Z'))).toBe(2025);
      expect(resolveCesantiasTargetYear(new Date('2026-02-14T00:00:00.000Z'))).toBe(2025);
      expect(resolveCesantiasTargetYear(new Date('2026-11-30T00:00:00.000Z'))).toBe(2025);
      expect(resolveCesantiasTargetYear(new Date('2027-01-01T00:00:00.000Z'))).toBe(2026);
    });
  });

  describe('resolveCesantiasDeadlineDate', (): void => {
    it('cae en plazoDia/plazoMes del año SIGUIENTE al año objetivo', (): void => {
      const deadline = resolveCesantiasDeadlineDate(2025, 14, 2);
      expect(deadline.toISOString()).toBe('2026-02-14T00:00:00.000Z');
    });
  });

  describe('daysUntilCesantiasDeadline', (): void => {
    it('cuenta días calendario completos, ignorando la hora del día', (): void => {
      const deadline = new Date('2026-02-14T00:00:00.000Z');
      expect(daysUntilCesantiasDeadline(new Date('2026-01-30T23:59:00.000Z'), deadline)).toBe(15);
      expect(daysUntilCesantiasDeadline(new Date('2026-02-14T08:00:00.000Z'), deadline)).toBe(0);
      expect(daysUntilCesantiasDeadline(new Date('2026-02-20T00:00:00.000Z'), deadline)).toBe(-6);
    });
  });

  describe('resolveCesantiasDeadlineStatus', (): void => {
    it('COMPLETADA cuando no hay pendientes, sin importar los días restantes', (): void => {
      expect(resolveCesantiasDeadlineStatus(0, -30)).toBe('COMPLETADA');
      expect(resolveCesantiasDeadlineStatus(0, 100)).toBe('COMPLETADA');
    });

    it('VENCIDA cuando hay pendientes y los días restantes son negativos', (): void => {
      expect(resolveCesantiasDeadlineStatus(3, -1)).toBe('VENCIDA');
    });

    it('VENCE_HOY cuando faltan exactamente 0 días y hay pendientes', (): void => {
      expect(resolveCesantiasDeadlineStatus(3, 0)).toBe('VENCE_HOY');
    });

    it('PROXIMA_A_VENCER cuando faltan entre 1 y 15 días (umbral inclusive)', (): void => {
      expect(resolveCesantiasDeadlineStatus(3, 1)).toBe('PROXIMA_A_VENCER');
      expect(resolveCesantiasDeadlineStatus(3, 15)).toBe('PROXIMA_A_VENCER');
    });

    it('PENDIENTE cuando faltan más de 15 días y hay pendientes', (): void => {
      expect(resolveCesantiasDeadlineStatus(3, 16)).toBe('PENDIENTE');
      expect(resolveCesantiasDeadlineStatus(3, 200)).toBe('PENDIENTE');
    });
  });

  describe('resolveCesantiasDeadline (integración de las 4 funciones)', (): void => {
    it('arma el resultado completo — caso próximo a vencer', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-02-01T00:00:00.000Z'), 14, 2, 5);
      expect(result).toEqual({
        targetYear: 2025,
        deadlineDate: new Date('2026-02-14T00:00:00.000Z'),
        daysUntilDeadline: 13,
        status: 'PROXIMA_A_VENCER',
      });
    });

    it('arma el resultado completo — caso vencida', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-03-01T00:00:00.000Z'), 14, 2, 2);
      expect(result.status).toBe('VENCIDA');
      expect(result.daysUntilDeadline).toBeLessThan(0);
    });

    it('arma el resultado completo — caso completada, incluso pasada la fecha límite', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-06-01T00:00:00.000Z'), 14, 2, 0);
      expect(result.status).toBe('COMPLETADA');
    });
  });

  /**
   * OS-588 (fase 4, revisión previa a commit) — fechas específicas pedidas explícitamente:
   * 31 de enero, entre el 1 y el 13 de febrero, 14 de febrero (día límite) y 15 de febrero
   * (un día después). Todas con pendingCount > 0 — el interés del bloque es la transición
   * de estado según la fecha, no el conteo de pendientes (ver el siguiente describe para
   * eso).
   */
  describe('fechas específicas alrededor del 14 de febrero (plazoDia=14, plazoMes=2)', (): void => {
    it('31 de enero — 14 días antes del límite → PROXIMA_A_VENCER', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-01-31T00:00:00.000Z'), 14, 2, 1);
      expect(result.daysUntilDeadline).toBe(14);
      expect(result.status).toBe('PROXIMA_A_VENCER');
    });

    it('1 de febrero — 13 días antes → PROXIMA_A_VENCER', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-02-01T00:00:00.000Z'), 14, 2, 1);
      expect(result.daysUntilDeadline).toBe(13);
      expect(result.status).toBe('PROXIMA_A_VENCER');
    });

    it('13 de febrero — 1 día antes → PROXIMA_A_VENCER', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-02-13T00:00:00.000Z'), 14, 2, 1);
      expect(result.daysUntilDeadline).toBe(1);
      expect(result.status).toBe('PROXIMA_A_VENCER');
    });

    it('14 de febrero — el día del límite → VENCE_HOY, no VENCIDA', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-02-14T00:00:00.000Z'), 14, 2, 1);
      expect(result.daysUntilDeadline).toBe(0);
      expect(result.status).toBe('VENCE_HOY');
    });

    it('15 de febrero — un día después del límite → VENCIDA', (): void => {
      const result = resolveCesantiasDeadline(new Date('2026-02-15T00:00:00.000Z'), 14, 2, 1);
      expect(result.daysUntilDeadline).toBe(-1);
      expect(result.status).toBe('VENCIDA');
    });
  });
});
