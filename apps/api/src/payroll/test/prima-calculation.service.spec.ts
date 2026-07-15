import { Prisma, SalaryType } from '@prisma/client';

import {
  PrimaCalculationService,
  type PrimaSegmentInput,
} from '../service/prima-calculation.service';

const RATES = {
  divisor: new Prisma.Decimal(180),
  transportSubsidyAmount: new Prisma.Decimal(249095),
  transportSubsidyThreshold: new Prisma.Decimal(1750905 * 2),
};

function segment(overrides: Partial<PrimaSegmentInput> = {}): PrimaSegmentInput {
  return {
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: new Prisma.Decimal(1750905),
    commercialDays: 180,
    ...overrides,
  };
}

describe('PrimaCalculationService', (): void => {
  let service: PrimaCalculationService;

  beforeEach((): void => {
    service = new PrimaCalculationService();
  });

  it('calcula un semestre completo (180 días) con auxilio de transporte', (): void => {
    // Arrange
    const dates = [{ start: new Date('2026-01-01'), endExclusive: new Date('2026-07-01') }];

    // Act
    const result = service.calculate([segment()], true, RATES, dates);

    // Assert — (1750905 + 249095) * 180 / 180 = 2000000
    expect(result.accrualDays).toBe(180);
    expect(result.primaAmount.toString()).toBe('2000000');
    expect(result.segments[0].transportSubsidyApplied).toBe(true);
    // Desglose explícito: sueldo, auxilio y promedio variable expuestos por separado.
    expect(result.segments[0].salaryAmount).toBe('1750905');
    expect(result.segments[0].transportSubsidyAmount).toBe('249095');
    expect(result.segments[0].variableAverageAmount).toBe('0');
    expect(result.segments[0].segmentBase).toBe('2000000');
  });

  it('prorratea un semestre parcial (empleado con menos de seis meses)', (): void => {
    // Arrange — 90 días (medio semestre)
    const dates = [{ start: new Date('2026-01-01'), endExclusive: new Date('2026-04-01') }];

    // Act
    const result = service.calculate([segment({ commercialDays: 90 })], true, RATES, dates);

    // Assert — (1750905 + 249095) * 90 / 180 = 1000000
    expect(result.accrualDays).toBe(90);
    expect(result.primaAmount.toString()).toBe('1000000');
  });

  it('no aplica auxilio de transporte por encima del umbral de 2 SMLV', (): void => {
    const dates = [{ start: new Date('2026-01-01'), endExclusive: new Date('2026-07-01') }];

    const result = service.calculate(
      [segment({ salaryAmount: new Prisma.Decimal(5000000) })],
      true,
      RATES,
      dates,
    );

    expect(result.segments[0].transportSubsidyApplied).toBe(false);
    expect(result.segments[0].transportSubsidyAmount).toBe('0');
    expect(result.primaAmount.toString()).toBe('5000000');
  });

  it('excluye tramos INTEGRAL de la base (CST art. 132 — factor prestacional ya incluye prima)', (): void => {
    const dates = [{ start: new Date('2026-01-01'), endExclusive: new Date('2026-07-01') }];

    const result = service.calculate(
      [segment({ salaryType: SalaryType.INTEGRAL, salaryAmount: new Prisma.Decimal(20000000) })],
      false,
      RATES,
      dates,
    );

    expect(result.accrualDays).toBe(0);
    expect(result.primaAmount.toString()).toBe('0');
    expect(result.segments[0].includedInBase).toBe(false);
  });

  it('redondea el total final a 2 decimales (ROUND_HALF_UP)', (): void => {
    const dates = [{ start: new Date('2026-01-01'), endExclusive: new Date('2026-01-31') }];

    const result = service.calculate(
      [segment({ salaryAmount: new Prisma.Decimal(1000003), commercialDays: 7 })],
      false,
      RATES,
      dates,
    );

    // 1000003 * 7 / 180 = 38889.006944... → redondeado a 38889.01
    expect(result.primaAmount.toString()).toBe('38889.01');
  });

  it('combina dos tramos salariales en el mismo semestre (aumento de sueldo a mitad de periodo)', (): void => {
    const dates = [
      { start: new Date('2026-01-01'), endExclusive: new Date('2026-04-01') },
      { start: new Date('2026-04-01'), endExclusive: new Date('2026-07-01') },
    ];

    const result = service.calculate(
      [
        segment({ salaryAmount: new Prisma.Decimal(1500000), commercialDays: 90 }),
        segment({ salaryAmount: new Prisma.Decimal(2000000), commercialDays: 90 }),
      ],
      false,
      RATES,
      dates,
    );

    // (1500000*90/180) + (2000000*90/180) = 750000 + 1000000
    expect(result.primaAmount.toString()).toBe('1750000');
    expect(result.accrualDays).toBe(180);
  });
});
