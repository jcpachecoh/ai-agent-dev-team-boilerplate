import { Prisma, SalaryType } from '@prisma/client';

import {
  CesantiasCalculationService,
  type CesantiasLegalRates,
  type CesantiasSegmentInput,
} from '../service/cesantias-calculation.service';

const rates: CesantiasLegalRates = {
  interestRate: new Prisma.Decimal(0.12),
  divisor: new Prisma.Decimal(360),
  transportSubsidyAmount: new Prisma.Decimal(249095),
  transportSubsidyThreshold: new Prisma.Decimal(3501810), // 2 x SMLV 2026
};

function dates(n: number): { start: Date; endExclusive: Date }[] {
  return Array.from({ length: n }, (_, i): { start: Date; endExclusive: Date } => ({
    start: new Date(`2026-0${i + 1}-01`),
    endExclusive: new Date(`2026-0${i + 2}-01`),
  }));
}

describe('CesantiasCalculationService', (): void => {
  let service: CesantiasCalculationService;

  beforeEach((): void => {
    service = new CesantiasCalculationService();
  });

  it('full year, single ORDINARIO segment, no transport subsidy', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2500000),
        commercialDays: 360,
      },
    ];

    const result = service.calculate(segments, false, rates, dates(1));

    expect(result.accrualDays).toBe(360);
    expect(result.cesantiasAmount.toString()).toBe('2500000');
    expect(result.interestAmount.toString()).toBe('300000');
    expect(result.calculationBase.toString()).toBe('2500000');
    expect(result.segments[0].includedInBase).toBe(true);
    expect(result.segments[0].transportSubsidyApplied).toBe(false);
  });

  it('applies auxilio de transporte when eligible (salario ≤ 2 SMLV y hasTransportSubsidy)', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(1500000),
        commercialDays: 360,
      },
    ];

    const result = service.calculate(segments, true, rates, dates(1));

    expect(result.segments[0].transportSubsidyApplied).toBe(true);
    expect(result.segments[0].segmentBase).toBe('1749095');
    expect(result.cesantiasAmount.toString()).toBe('1749095');
    expect(result.interestAmount.toString()).toBe('209891.4');
  });

  it('does not apply auxilio de transporte when salary is above the 2×SMLV threshold', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(4000000),
        commercialDays: 360,
      },
    ];

    const result = service.calculate(segments, true, rates, dates(1));

    expect(result.segments[0].transportSubsidyApplied).toBe(false);
    expect(result.cesantiasAmount.toString()).toBe('4000000');
  });

  it('excludes INTEGRAL salary segments from the base (CST art. 132 — ya incluye el factor prestacional)', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.INTEGRAL,
        salaryAmount: new Prisma.Decimal(20000000),
        commercialDays: 360,
      },
    ];

    const result = service.calculate(segments, false, rates, dates(1));

    expect(result.accrualDays).toBe(0);
    expect(result.cesantiasAmount.toString()).toBe('0');
    expect(result.interestAmount.toString()).toBe('0');
    expect(result.calculationBase.toString()).toBe('0');
    expect(result.segments[0].includedInBase).toBe(false);
  });

  it('sums two salary segments without double counting (cambio salarial a mitad de año)', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2000000),
        commercialDays: 180,
      },
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2500000),
        commercialDays: 180,
      },
    ];

    const result = service.calculate(segments, false, rates, dates(2));

    expect(result.accrualDays).toBe(360);
    expect(result.cesantiasAmount.toString()).toBe('2250000');
    expect(result.interestAmount.toString()).toBe('270000');
    expect(result.calculationBase.toString()).toBe('2250000');
  });

  it('handles multiple salary changes (3+ tramos) without double counting', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(1000000),
        commercialDays: 120,
      },
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(1200000),
        commercialDays: 120,
      },
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(1500000),
        commercialDays: 120,
      },
    ];

    const result = service.calculate(segments, false, rates, dates(3));

    expect(result.accrualDays).toBe(360);
    // (1,000,000×120 + 1,200,000×120 + 1,500,000×120) / 360 = 1,233,333.333... → 1,233,333.33
    expect(result.cesantiasAmount.toString()).toBe('1233333.33');
  });

  it('prorates for a partial year (retiro/ingreso a mitad de año)', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(2500000),
        commercialDays: 180,
      },
    ];

    const result = service.calculate(segments, false, rates, dates(1));

    expect(result.accrualDays).toBe(180);
    expect(result.cesantiasAmount.toString()).toBe('1250000');
    expect(result.interestAmount.toString()).toBe('75000');
  });

  it('rounds only the final total to 2 decimals with ROUND_HALF_UP (no redondeo por tramo)', (): void => {
    const segments: CesantiasSegmentInput[] = [
      {
        salaryType: SalaryType.ORDINARIO,
        salaryAmount: new Prisma.Decimal(1000000),
        commercialDays: 100,
      },
    ];

    const result = service.calculate(segments, false, rates, dates(1));

    // 1,000,000 × 100 / 360 = 277,777.777... → redondea a 277,777.78
    expect(result.cesantiasAmount.toString()).toBe('277777.78');
  });

  it('treats zero accrual days as zero base without dividing by zero', (): void => {
    const result = service.calculate([], false, rates, []);

    expect(result.accrualDays).toBe(0);
    expect(result.calculationBase.toString()).toBe('0');
    expect(result.cesantiasAmount.toString()).toBe('0');
    expect(result.interestAmount.toString()).toBe('0');
  });
});
