import { AttendanceOvertimeType } from '../payroll.constants';

export type OvertimeSurchargeRates = {
  recargoHoraExtraDiurna: number;
  recargoHoraExtraNocturna: number;
  recargoDominicalFestivo: number;
};

export type OvertimeSurchargeClassification = {
  type: AttendanceOvertimeType;
  surchargeRate: number;
};

/**
 * OS-591 (fase 2, cierre de hallazgos) — única fuente de la regla que combina
 * festivo + nocturno (Ley 51/1983) para clasificar un tramo de horas extra en su tipo
 * legal (DIURNO/NOCTURNO/FESTIVO_DIURNO/FESTIVO_NOCTURNO) y la tasa de recargo aplicable.
 *
 * Extraída de `ReportsService.buildAttendanceSummary` (el motor de nómina real,
 * `PayrollCalculationService`) para que `VariableAverageService` (promedio variable de
 * la liquidación definitiva) reutilice EXACTAMENTE la misma regla en vez de una
 * clasificación binaria propia — ninguno de los dos sitios vuelve a codificar los
 * porcentajes ni la combinación festivo+nocturno por su cuenta.
 */
export function classifyOvertimeSurcharge(
  isNocturno: boolean,
  isFestivo: boolean,
  rates: OvertimeSurchargeRates,
): OvertimeSurchargeClassification {
  if (isFestivo) {
    if (isNocturno) {
      return {
        type: AttendanceOvertimeType.FESTIVO_NOCTURNO,
        surchargeRate: rates.recargoHoraExtraNocturna + rates.recargoDominicalFestivo,
      };
    }
    return {
      type: AttendanceOvertimeType.FESTIVO_DIURNO,
      surchargeRate: rates.recargoDominicalFestivo,
    };
  }
  if (isNocturno) {
    return { type: AttendanceOvertimeType.NOCTURNO, surchargeRate: rates.recargoHoraExtraNocturna };
  }
  return { type: AttendanceOvertimeType.DIURNO, surchargeRate: rates.recargoHoraExtraDiurna };
}
