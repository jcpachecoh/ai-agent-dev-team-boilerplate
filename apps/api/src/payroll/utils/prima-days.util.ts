import type { PrimaHalf } from '@prisma/client';

/**
 * OS-591 (fase 1) — ventanas de semestre calendario para prima de servicios (CST art. 306):
 * PRIMER_SEMESTRE = [1-ene, 1-jul) — pago máximo 30 de junio.
 * SEGUNDO_SEMESTRE = [1-jul, 1-ene siguiente) — pago máximo 20 de diciembre.
 *
 * Igual criterio que CesantiasService.resolveYearWindow: `periodEndExclusive` es exclusivo,
 * fechas en UTC medianoche para evitar corrimientos por zona horaria.
 */
export function resolvePrimaHalfWindow(
  year: number,
  half: PrimaHalf,
): { periodStart: Date; periodEndExclusive: Date } {
  if (half === 'PRIMER_SEMESTRE') {
    return {
      periodStart: new Date(Date.UTC(year, 0, 1)),
      periodEndExclusive: new Date(Date.UTC(year, 6, 1)),
    };
  }
  return {
    periodStart: new Date(Date.UTC(year, 6, 1)),
    periodEndExclusive: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

/** Semestre calendario (año, mitad) al que pertenece `date` (UTC). */
export function resolvePrimaHalfForDate(date: Date): { year: number; half: PrimaHalf } {
  return {
    year: date.getUTCFullYear(),
    half: date.getUTCMonth() < 6 ? 'PRIMER_SEMESTRE' : 'SEGUNDO_SEMESTRE',
  };
}

/** Semestre calendario inmediatamente anterior a (year, half). Usado para hallar el cierre previo. */
export function previousPrimaHalf(
  year: number,
  half: PrimaHalf,
): { year: number; half: PrimaHalf } {
  return half === 'SEGUNDO_SEMESTRE'
    ? { year, half: 'PRIMER_SEMESTRE' }
    : { year: year - 1, half: 'SEGUNDO_SEMESTRE' };
}
