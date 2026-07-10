import { EmployeeCatalogType, SalaryType } from '@prisma/client';

import type {
  EmployeeFundHistoryRecord,
  EmployeeSalaryHistoryRecord,
} from '../interfaces/employee-history.interfaces';
import {
  commercialDaysBetween,
  resolveFundAtDate,
  resolveSalarySegments,
} from '../utils/cesantias-days.util';

function utc(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function salaryEntry(overrides: Partial<EmployeeSalaryHistoryRecord>): EmployeeSalaryHistoryRecord {
  return {
    id: 'hist',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: '2500000',
    effectiveFrom: utc('2026-01-01'),
    effectiveTo: null,
    changedBy: null,
    createdAt: utc('2026-01-01'),
    ...overrides,
  };
}

function fundEntry(overrides: Partial<EmployeeFundHistoryRecord>): EmployeeFundHistoryRecord {
  return {
    id: 'fund',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    fundType: EmployeeCatalogType.CESANTIAS_FUND,
    fundName: 'Porvenir',
    effectiveFrom: utc('2026-01-01'),
    effectiveTo: null,
    changedBy: null,
    createdAt: utc('2026-01-01'),
    ...overrides,
  };
}

describe('commercialDaysBetween', (): void => {
  it('a full calendar year (Jan 1 to next Jan 1, exclusive) is exactly 360 days', (): void => {
    expect(commercialDaysBetween(utc('2026-01-01'), utc('2027-01-01'))).toBe(360);
  });

  it('half a year (Jan 1 to Jul 1) is exactly 180 days', (): void => {
    expect(commercialDaysBetween(utc('2026-01-01'), utc('2026-07-01'))).toBe(180);
  });

  it('one commercial month (Feb 1 to Mar 1) is 30 days even though February has 28 real days', (): void => {
    expect(commercialDaysBetween(utc('2026-02-01'), utc('2026-03-01'))).toBe(30);
  });

  it('caps day-of-month at 30 (31st counts as 30)', (): void => {
    expect(commercialDaysBetween(utc('2026-01-31'), utc('2026-02-28'))).toBe(28);
  });

  it('returns 0 when end is before or equal to start', (): void => {
    expect(commercialDaysBetween(utc('2026-06-01'), utc('2026-01-01'))).toBe(0);
    expect(commercialDaysBetween(utc('2026-06-01'), utc('2026-06-01'))).toBe(0);
  });
});

describe('resolveSalarySegments', (): void => {
  it('returns a single segment covering the whole window when salary never changed', (): void => {
    const history = [salaryEntry({ effectiveFrom: utc('2020-01-01'), effectiveTo: null })];

    const segments = resolveSalarySegments(history, utc('2026-01-01'), utc('2027-01-01'));

    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      start: utc('2026-01-01'),
      endExclusive: utc('2027-01-01'),
      commercialDays: 360,
    });
  });

  it('splits into two tramos when salary changed mid-year (enero-junio A, julio-diciembre B)', (): void => {
    const history = [
      salaryEntry({
        salaryAmount: '2000000',
        effectiveFrom: utc('2024-01-01'),
        effectiveTo: utc('2026-07-01'),
      }),
      salaryEntry({
        salaryAmount: '2500000',
        effectiveFrom: utc('2026-07-01'),
        effectiveTo: null,
      }),
    ];

    const segments = resolveSalarySegments(history, utc('2026-01-01'), utc('2027-01-01'));

    expect(segments).toHaveLength(2);
    expect(segments[0].salaryAmount).toBe('2000000');
    expect(segments[0].commercialDays).toBe(180);
    expect(segments[1].salaryAmount).toBe('2500000');
    expect(segments[1].commercialDays).toBe(180);
    // No doble conteo: la suma de los tramos debe ser exactamente el año completo.
    expect(segments[0].commercialDays + segments[1].commercialDays).toBe(360);
  });

  it('clips the window when the employee was hired mid-year (ingreso durante el año)', (): void => {
    const history = [salaryEntry({ effectiveFrom: utc('2026-04-01'), effectiveTo: null })];

    const segments = resolveSalarySegments(history, utc('2026-01-01'), utc('2027-01-01'));

    expect(segments).toHaveLength(1);
    expect(segments[0].start).toEqual(utc('2026-04-01'));
    // Abril-diciembre = 270 días comerciales (9 meses × 30).
    expect(segments[0].commercialDays).toBe(270);
  });

  it('clips the window when the employee was terminated mid-year (retiro durante el año)', (): void => {
    const history = [salaryEntry({ effectiveFrom: utc('2020-01-01'), effectiveTo: null })];

    // El caller (CesantiasService) ya recorta windowEndExclusive al día siguiente del retiro.
    const segments = resolveSalarySegments(history, utc('2026-01-01'), utc('2026-09-16'));

    expect(segments).toHaveLength(1);
    expect(segments[0].endExclusive).toEqual(utc('2026-09-16'));
    expect(segments[0].commercialDays).toBe(
      commercialDaysBetween(utc('2026-01-01'), utc('2026-09-16')),
    );
  });

  it('ignores history entries entirely outside the window (no aporta días fuera del año)', (): void => {
    const history = [
      salaryEntry({ effectiveFrom: utc('2020-01-01'), effectiveTo: utc('2024-01-01') }),
      salaryEntry({ effectiveFrom: utc('2026-01-01'), effectiveTo: null }),
    ];

    const segments = resolveSalarySegments(history, utc('2026-01-01'), utc('2027-01-01'));

    expect(segments).toHaveLength(1);
  });

  it('sorts segments chronologically regardless of input order', (): void => {
    const history = [
      salaryEntry({ salaryAmount: 'B', effectiveFrom: utc('2026-07-01'), effectiveTo: null }),
      salaryEntry({
        salaryAmount: 'A',
        effectiveFrom: utc('2026-01-01'),
        effectiveTo: utc('2026-07-01'),
      }),
    ];

    const segments = resolveSalarySegments(history, utc('2026-01-01'), utc('2027-01-01'));

    expect(segments.map((s): string => s.salaryAmount)).toEqual(['A', 'B']);
  });
});

describe('resolveFundAtDate — regla de fondo vigente al cierre', (): void => {
  it('Protección hasta agosto, FNA desde septiembre → el fondo vigente al cierre (31-dic) es FNA', (): void => {
    const fundHistory = [
      fundEntry({
        fundName: 'Protección',
        effectiveFrom: utc('2020-01-01'),
        effectiveTo: utc('2026-09-01'),
      }),
      fundEntry({
        fundName: 'Fondo Nacional del Ahorro',
        effectiveFrom: utc('2026-09-01'),
        effectiveTo: null,
      }),
    ];

    const closing = new Date(utc('2027-01-01').getTime() - 1); // instante justo antes del cierre exclusivo del año
    const fund = resolveFundAtDate(fundHistory, EmployeeCatalogType.CESANTIAS_FUND, closing);

    expect(fund?.fundName).toBe('Fondo Nacional del Ahorro');
  });

  it('no divide la consignación entre fondos anteriores — solo devuelve el vigente al cierre', (): void => {
    const fundHistory = [
      fundEntry({
        fundName: 'Protección',
        effectiveFrom: utc('2020-01-01'),
        effectiveTo: utc('2026-09-01'),
      }),
      fundEntry({
        fundName: 'Fondo Nacional del Ahorro',
        effectiveFrom: utc('2026-09-01'),
        effectiveTo: null,
      }),
    ];

    const closing = new Date(utc('2027-01-01').getTime() - 1);
    const fund = resolveFundAtDate(fundHistory, EmployeeCatalogType.CESANTIAS_FUND, closing);

    // Un solo resultado — nunca un arreglo o una combinación de ambos fondos.
    expect(fund).toBeDefined();
    expect(fund).not.toBeUndefined();
    expect([fund?.fundName]).toEqual(['Fondo Nacional del Ahorro']);
  });

  it('returns undefined when the employee never had a fund entry covering the closing date (empleado sin fondo)', (): void => {
    const fund = resolveFundAtDate([], EmployeeCatalogType.CESANTIAS_FUND, utc('2026-12-31'));
    expect(fund).toBeUndefined();
  });

  it('does not match a fund entry of a different fundType (pensión vs cesantías)', (): void => {
    const fundHistory = [
      fundEntry({ fundType: EmployeeCatalogType.PENSION_FUND, fundName: 'Colpensiones' }),
    ];

    const fund = resolveFundAtDate(
      fundHistory,
      EmployeeCatalogType.CESANTIAS_FUND,
      utc('2026-06-01'),
    );

    expect(fund).toBeUndefined();
  });
});
