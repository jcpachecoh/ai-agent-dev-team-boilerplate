import { calculatePayrollNovedadMonthAdjustment } from '../utils/payroll-novedad-payroll.utils';
import type { PayrollNovedadPayrollPeriodRange } from '../../payroll-novedades/interfaces/payroll-novedades.interfaces';

describe('calculatePayrollNovedadMonthAdjustment', () => {
  const dailySalary = 100_000;

  function buildNovedad(
    overrides: Partial<PayrollNovedadPayrollPeriodRange> &
      Pick<PayrollNovedadPayrollPeriodRange, 'startDate' | 'endDate' | 'isPaid'>,
  ): PayrollNovedadPayrollPeriodRange {
    return {
      id: 'nov-1',
      employeeId: 'emp-1',
      type: 'AUSENCIA_INJUSTIFICADA',
      ...overrides,
    };
  }

  it('descuenta días no remunerados en el mes', () => {
    const result = calculatePayrollNovedadMonthAdjustment(
      [
        buildNovedad({
          startDate: new Date('2026-07-01T00:00:00.000Z'),
          endDate: new Date('2026-07-03T00:00:00.000Z'),
          isPaid: false,
        }),
      ],
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
      dailySalary,
    );

    expect(result.payrollNovedadUnpaidDays).toBe(3);
    expect(result.payrollNovedadUnpaidDeduction).toBe(300_000);
    expect(result.payrollNovedadPaidDays).toBe(0);
  });

  it('no descuenta licencias remuneradas', () => {
    const result = calculatePayrollNovedadMonthAdjustment(
      [
        buildNovedad({
          startDate: new Date('2026-07-10T00:00:00.000Z'),
          endDate: new Date('2026-07-12T00:00:00.000Z'),
          isPaid: true,
        }),
      ],
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
      dailySalary,
    );

    expect(result.payrollNovedadUnpaidDays).toBe(0);
    expect(result.payrollNovedadPaidDays).toBe(3);
  });

  it('prorratea novedad que cruza dos meses', () => {
    const novedad = buildNovedad({
      startDate: new Date('2026-07-28T00:00:00.000Z'),
      endDate: new Date('2026-08-05T00:00:00.000Z'),
      isPaid: false,
    });

    const july = calculatePayrollNovedadMonthAdjustment(
      [novedad],
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
      dailySalary,
    );
    const august = calculatePayrollNovedadMonthAdjustment(
      [novedad],
      new Date('2026-08-01T00:00:00.000Z'),
      new Date('2026-08-31T00:00:00.000Z'),
      dailySalary,
    );

    expect(july.payrollNovedadUnpaidDays).toBe(4);
    expect(august.payrollNovedadUnpaidDays).toBe(5);
  });
});
