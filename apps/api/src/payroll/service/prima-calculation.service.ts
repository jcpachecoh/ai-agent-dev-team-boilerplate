import { Injectable } from '@nestjs/common';
import { Prisma, SalaryType } from '@prisma/client';

/**
 * OS-591 (fase 1) — motor puro de cálculo de prima de servicios (CST art. 306). Sin acceso
 * a DB, sin efectos secundarios — mismo patrón que CesantiasCalculationService: recibe
 * segmentos ya resueltos por el caller (PrimaService) y devuelve el resultado.
 *
 * A diferencia de cesantías, prima no tiene un concepto de "interés" — un solo monto por
 * tramo. Redondeo: cada tramo se calcula en precisión completa; solo el TOTAL final se
 * redondea a 2 decimales (ROUND_HALF_UP), mismo criterio que CesantiasCalculationService
 * (evita arrastre de error de redondeo acumulado al sumar tramos).
 */

export type PrimaSegmentInput = {
  salaryType: SalaryType;
  salaryAmount: Prisma.Decimal;
  /** Días causados en convención comercial (30/mes) — ver prima-days.util.ts. */
  commercialDays: number;
};

export type PrimaLegalRates = {
  /** PRIMA_DIVISOR_DIAS — 180 (semestre comercial). */
  divisor: Prisma.Decimal;
  /** AUXILIO_TRANSPORTE — valor mensual vigente en el periodo. */
  transportSubsidyAmount: Prisma.Decimal;
  /** 2 × SMLV vigente en el periodo — mismo criterio que CesantiasCalculationService. */
  transportSubsidyThreshold: Prisma.Decimal;
};

export type PrimaSegmentBreakdown = {
  start: Date;
  endExclusive: Date;
  salaryType: SalaryType;
  /** Sueldo del tramo (sin auxilio ni promedio variable). */
  salaryAmount: string;
  commercialDays: number;
  /**
   * false para tramos INTEGRAL — CST art. 132: el salario integral ya incorpora el factor
   * prestacional (incluye prima y cesantías, NO vacaciones), no se liquida prima tradicional
   * sobre esa porción. Misma regla que CesantiasCalculationService para el mismo artículo.
   */
  includedInBase: boolean;
  transportSubsidyApplied: boolean;
  /** Auxilio de transporte efectivamente aplicado en el tramo — '0' si no aplica. */
  transportSubsidyAmount: string;
  /**
   * OS-591 (fase 1) — promedio de salario variable/comisiones. Siempre '0': no existe en
   * este repo ninguna fuente consolidada de pago variable (EmployeeSalaryHistory solo
   * modela un `salaryAmount` fijo, ver tasks/OS-591.md "Limitación — promedio variable").
   * Campo expuesto explícitamente (no omitido) para que el desglose sea auditable y para
   * que una fase futura, cuando exista esa fuente, solo tenga que dejar de forzar el cero
   * aquí sin cambiar la forma del contrato.
   */
  variableAverageAmount: string;
  /** Base total del tramo = salaryAmount + transportSubsidyAmount + variableAverageAmount. */
  segmentBase: string;
  segmentPrima: string;
};

export type PrimaCalculationResult = {
  /** Suma de commercialDays de los tramos incluidos (excluye tramos INTEGRAL). */
  accrualDays: number;
  /** Base ponderada informativa: Σ(segmentBase × commercialDays) / accrualDays. */
  calculationBase: Prisma.Decimal;
  primaAmount: Prisma.Decimal;
  segments: PrimaSegmentBreakdown[];
};

@Injectable()
export class PrimaCalculationService {
  calculate(
    segments: PrimaSegmentInput[],
    hasTransportSubsidy: boolean,
    rates: PrimaLegalRates,
    segmentDates: { start: Date; endExclusive: Date }[],
  ): PrimaCalculationResult {
    let accrualDays = 0;
    let rawPrima = new Prisma.Decimal(0);
    let weightedBaseSum = new Prisma.Decimal(0);
    const breakdown: PrimaSegmentBreakdown[] = [];

    // OS-591 (fase 1) — siempre cero, ver PrimaSegmentBreakdown.variableAverageAmount.
    const variableAverageAmount = new Prisma.Decimal(0);

    segments.forEach((segment, index): void => {
      const isIntegral = segment.salaryType === SalaryType.INTEGRAL;
      const eligibleForSubsidy =
        !isIntegral &&
        hasTransportSubsidy &&
        segment.salaryAmount.lte(rates.transportSubsidyThreshold);
      const appliedTransportSubsidy = eligibleForSubsidy
        ? rates.transportSubsidyAmount
        : new Prisma.Decimal(0);

      const segmentBase = isIntegral
        ? new Prisma.Decimal(0)
        : segment.salaryAmount.plus(appliedTransportSubsidy).plus(variableAverageAmount);

      const segmentPrima = isIntegral
        ? new Prisma.Decimal(0)
        : segmentBase.times(segment.commercialDays).div(rates.divisor);

      if (!isIntegral) {
        accrualDays += segment.commercialDays;
        rawPrima = rawPrima.plus(segmentPrima);
        weightedBaseSum = weightedBaseSum.plus(segmentBase.times(segment.commercialDays));
      }

      const dates = segmentDates[index];
      breakdown.push({
        start: dates.start,
        endExclusive: dates.endExclusive,
        salaryType: segment.salaryType,
        salaryAmount: segment.salaryAmount.toString(),
        commercialDays: segment.commercialDays,
        includedInBase: !isIntegral,
        transportSubsidyApplied: eligibleForSubsidy,
        transportSubsidyAmount: appliedTransportSubsidy.toString(),
        variableAverageAmount: variableAverageAmount.toString(),
        segmentBase: segmentBase.toString(),
        segmentPrima: segmentPrima.toString(),
      });
    });

    const primaAmount = rawPrima.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const calculationBase =
      accrualDays > 0
        ? weightedBaseSum.div(accrualDays).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(0);

    return {
      accrualDays,
      calculationBase,
      primaAmount,
      segments: breakdown,
    };
  }
}
