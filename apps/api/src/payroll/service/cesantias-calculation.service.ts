import { Injectable } from '@nestjs/common';
import { Prisma, SalaryType } from '@prisma/client';

/**
 * OS-588 (fase 2) — motor puro de cálculo de cesantías e intereses. Sin acceso a DB, sin
 * efectos secundarios — mismo patrón que PayrollCalculationService (NOM-04): recibe datos
 * ya resueltos por el caller (CesantiasService) y devuelve el resultado.
 *
 * Deliberadamente en `Decimal`, no `number` — a diferencia de PayrollCalculationService
 * (que usa `number`/`Math.round` para un solo mes), esta fase reutiliza el tipo que ya usa
 * la fuente de verdad (EmployeeSalaryHistory.salaryAmount, LaborLegalParameter.value son
 * Decimal en la base de datos) y suma hasta 12 tramos por año — más superficie para el
 * arrastre de error de punto flotante que un cálculo de un solo mes.
 *
 * Redondeo: cada tramo se calcula en precisión completa (sin redondear); solo el TOTAL
 * final de cesantías e intereses se redondea a 2 decimales (ROUND_HALF_UP), igual que
 * medical-leave-payment.utils.ts (resolveDailySalary). Redondear por tramo y luego sumar
 * arrastraría error de redondeo acumulado — se evita a propósito.
 */

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
export type CesantiasSegmentInput = {
  salaryType: SalaryType;
  salaryAmount: Prisma.Decimal;
  /** Días causados en convención comercial 360 (ver cesantias-days.util.ts). */
  commercialDays: number;
};

export type CesantiasLegalRates = {
  /** INTERES_CESANTIAS — p.ej. 0.12 (Ley 52 de 1975). */
  interestRate: Prisma.Decimal;
  /** DIVISOR_CESANTIAS — p.ej. 360 (año comercial). */
  divisor: Prisma.Decimal;
  /** AUXILIO_TRANSPORTE — valor mensual vigente en el periodo. */
  transportSubsidyAmount: Prisma.Decimal;
  /** 2 × SMLV vigente en el periodo — mismo criterio que ReportsService/PayrollCalculationService. */
  transportSubsidyThreshold: Prisma.Decimal;
};

export type CesantiasSegmentBreakdown = {
  start: Date;
  endExclusive: Date;
  salaryType: SalaryType;
  salaryAmount: string;
  commercialDays: number;
  /** false para tramos INTEGRAL — CST art. 132: el salario integral ya incorpora el factor prestacional (incluye cesantías), no se liquidan cesantías tradicionales sobre esa porción. */
  includedInBase: boolean;
  transportSubsidyApplied: boolean;
  segmentBase: string;
  segmentCesantias: string;
};

export type CesantiasCalculationResult = {
  /** Suma de commercialDays de los tramos incluidos (excluye tramos INTEGRAL). */
  accrualDays: number;
  /** Base ponderada informativa: Σ(segmentBase × commercialDays) / accrualDays. Ver nota en el modelo. */
  calculationBase: Prisma.Decimal;
  cesantiasAmount: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  segments: CesantiasSegmentBreakdown[];
};

@Injectable()
export class CesantiasCalculationService {
  calculate(
    segments: CesantiasSegmentInput[],
    hasTransportSubsidy: boolean,
    rates: CesantiasLegalRates,
    segmentDates: { start: Date; endExclusive: Date }[],
  ): CesantiasCalculationResult {
    let accrualDays = 0;
    let rawCesantias = new Prisma.Decimal(0);
    let weightedBaseSum = new Prisma.Decimal(0);
    const breakdown: CesantiasSegmentBreakdown[] = [];

    segments.forEach((segment, index): void => {
      const isIntegral = segment.salaryType === SalaryType.INTEGRAL;
      const eligibleForSubsidy =
        !isIntegral &&
        hasTransportSubsidy &&
        segment.salaryAmount.lte(rates.transportSubsidyThreshold);

      const segmentBase = isIntegral
        ? new Prisma.Decimal(0)
        : segment.salaryAmount.plus(eligibleForSubsidy ? rates.transportSubsidyAmount : 0);

      const segmentCesantias = isIntegral
        ? new Prisma.Decimal(0)
        : segmentBase.times(segment.commercialDays).div(rates.divisor);

      if (!isIntegral) {
        accrualDays += segment.commercialDays;
        rawCesantias = rawCesantias.plus(segmentCesantias);
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
        segmentBase: segmentBase.toString(),
        segmentCesantias: segmentCesantias.toString(),
      });
    });

    const cesantiasAmount = rawCesantias.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const interestAmount = cesantiasAmount
      .times(rates.interestRate)
      .times(accrualDays)
      .div(rates.divisor)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const calculationBase =
      accrualDays > 0
        ? weightedBaseSum.div(accrualDays).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(0);

    return {
      accrualDays,
      calculationBase,
      cesantiasAmount,
      interestAmount,
      segments: breakdown,
    };
  }
}
