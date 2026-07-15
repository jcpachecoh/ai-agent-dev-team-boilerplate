import { Prisma } from '@prisma/client';

import type { PrismaService } from '../../prisma/prisma.service';
import { PendingSalaryService } from '../service/pending-salary.service';

function salaryRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'salhist-1',
    tenantId: 'tenant-1',
    employeeDetailsId: 'emp-1',
    salaryAmount: new Prisma.Decimal(3000000),
    effectiveFrom: new Date(2020, 0, 1),
    effectiveTo: null,
    ...overrides,
  };
}

const TENANT = 'tenant-1';
const EMPLOYEE = 'emp-1';

describe('PendingSalaryService', (): void => {
  let service: PendingSalaryService;
  let findFirstSalary: jest.Mock;
  let findFirstOvertime: jest.Mock;
  let findManyOvertime: jest.Mock;
  let findManyNovedad: jest.Mock;
  let findManyMedicalLeave: jest.Mock;

  beforeEach((): void => {
    findFirstSalary = jest.fn().mockResolvedValue(salaryRecord());
    findFirstOvertime = jest.fn().mockResolvedValue(null);
    findManyOvertime = jest.fn().mockResolvedValue([]);
    findManyNovedad = jest.fn().mockResolvedValue([]);
    findManyMedicalLeave = jest.fn().mockResolvedValue([]);

    const prisma = {
      employeeSalaryHistory: { findFirst: findFirstSalary },
      overtimeRequest: { findFirst: findFirstOvertime, findMany: findManyOvertime },
      payrollNovedad: { findMany: findManyNovedad },
      medicalLeave: { findMany: findManyMedicalLeave },
    } as unknown as PrismaService;

    service = new PendingSalaryService(prisma);
  });

  // ── Período completo / parcial ──────────────────────────────────────────
  describe('cálculo del tramo (período completo vs. parcial)', (): void => {
    it('calcula el tramo completo desde el 1ro del mes de terminación cuando no hay referencia de overtime', async (): Promise<void> => {
      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15), // 15-jun-2026
        new Date(2020, 0, 1), // contrato antiguo, no acota el tramo
      );

      expect(result.periodStart).toEqual(new Date(2026, 5, 1));
      expect(result.calendarDays).toBe(15);
      expect(result.commercialDays).toBe(15);
      // dailySalary = 3000000/30 = 100000; base = 100000 * 15 = 1500000
      expect(result.basePendingSalary).toBe('1500000.00');
      expect(result.totalPendingSalary).toBe('1500000.00');
    });

    it('acota el tramo parcial al inicio real del contrato cuando el empleado ingresó a mitad del mes', async (): Promise<void> => {
      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2026, 5, 10), // contrato inició el 10 de junio
      );

      expect(result.periodStart).toEqual(new Date(2026, 5, 10));
      expect(result.calendarDays).toBe(6); // 10..15 inclusive
      expect(result.commercialDays).toBe(6);
      expect(result.basePendingSalary).toBe('600000.00');
    });

    it('infiere el inicio del tramo desde el último payrollPeriod de overtime aprobado', async (): Promise<void> => {
      findFirstOvertime.mockResolvedValue({ payrollPeriod: '2026-05' });

      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      // El tramo pendiente arranca el mes siguiente al último período procesado (2026-06-01)
      expect(result.periodStart).toEqual(new Date(2026, 5, 1));
    });

    it('descarta la inferencia de overtime si el mes siguiente cae después de la terminación', async (): Promise<void> => {
      // Último payrollPeriod procesado = julio/2026, pero la terminación es en junio/2026
      // (dato inconsistente) — el mes inferido (agosto) queda después de la terminación,
      // así que se vuelve a caer al 1ro del mes de terminación.
      findFirstOvertime.mockResolvedValue({ payrollPeriod: '2026-07' });

      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      expect(result.periodStart).toEqual(new Date(2026, 5, 1));
    });
  });

  // ── Salario histórico vigente por fecha ─────────────────────────────────
  describe('salario histórico vigente por fecha', (): void => {
    it('consulta el salario vigente exactamente en effectiveTerminationDate, no el más reciente sin más', async (): Promise<void> => {
      const terminationDate = new Date(2026, 5, 15);
      findFirstSalary.mockResolvedValue(
        salaryRecord({ id: 'salhist-2', salaryAmount: new Prisma.Decimal(3600000) }),
      );

      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        terminationDate,
        new Date(2020, 0, 1),
      );

      expect(findFirstSalary).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            employeeDetailsId: EMPLOYEE,
            effectiveFrom: { lte: terminationDate },
            OR: [{ effectiveTo: null }, { effectiveTo: { gt: terminationDate } }],
          }),
          orderBy: { effectiveFrom: 'desc' },
        }),
      );
      expect(result.monthlySalary).toBe('3600000.00');
      expect(result.dailySalary).toBe('120000.00');
      expect(result.sources).toContain('EmployeeSalaryHistory:salhist-2');
    });
  });

  // ── Licencias no remuneradas ─────────────────────────────────────────────
  describe('novedades no remuneradas (licencias)', (): void => {
    it('descuenta los días de una novedad APROBADA + isPaid=false que se solapa con el tramo', async (): Promise<void> => {
      findManyNovedad.mockResolvedValue([
        {
          id: 'nov-1',
          startDate: new Date(2026, 5, 5),
          endDate: new Date(2026, 5, 7),
          type: 'LICENCIA_NO_REMUNERADA',
        },
      ]);

      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      // 15 días totales - 3 días de novedad = 12 días pagables
      expect(result.basePendingSalary).toBe('1200000.00');
      expect(result.novedadDeductions).toBe('300000.00');
      expect(result.sources).toContain('PayrollNovedad:nov-1');
      expect(result.breakdown).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ concept: 'DESCUENTO_NOVEDADES_NO_REMUNERADAS' }),
        ]),
      );
    });

    it('solo consulta novedades APROBADA + isPaid=false (excluye remuneradas y no aprobadas)', async (): Promise<void> => {
      await service.calculate(TENANT, EMPLOYEE, new Date(2026, 5, 15), new Date(2020, 0, 1));

      expect(findManyNovedad).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            status: 'APROBADA',
            isPaid: false,
            deletedAt: null,
          }),
        }),
      );
    });
  });

  // ── Incapacidades ─────────────────────────────────────────────────────────
  describe('incapacidades médicas', (): void => {
    it('descuenta los días de una incapacidad no rechazada y agrega el warning de simplificación', async (): Promise<void> => {
      findManyMedicalLeave.mockResolvedValue([
        {
          id: 'leave-1',
          startDate: new Date(2026, 5, 8),
          endDate: new Date(2026, 5, 10),
        },
      ]);

      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      // 15 días - 3 días de incapacidad = 12 días pagables
      expect(result.basePendingSalary).toBe('1200000.00');
      expect(result.sources).toContain('MedicalLeave:leave-1');
      expect(
        result.warnings.some((w): boolean =>
          w.startsWith('pending_salary_medical_leave_simplified'),
        ),
      ).toBe(true);
    });

    it('excluye incapacidades RECHAZADA a nivel de consulta', async (): Promise<void> => {
      await service.calculate(TENANT, EMPLOYEE, new Date(2026, 5, 15), new Date(2020, 0, 1));

      expect(findManyMedicalLeave).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            status: { not: 'RECHAZADA' },
          }),
        }),
      );
    });
  });

  // ── Horas extra pendientes (parte de "novedades que afectan el salario") ──
  describe('horas extra aprobadas pendientes en el tramo', (): void => {
    it('suma el valor de horas extra aprobadas dentro del tramo y advierte sobre la tasa estimada', async (): Promise<void> => {
      findManyOvertime.mockResolvedValue([
        { id: 'ot-1', accumulatedMinutes: 120, type: 'DETECCION_AUTOMATICA' },
      ]);

      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      // hourlyRate = 3000000/240 = 12500; amount = 12500 * 1.25 * 2h = 31250
      expect(result.pendingOvertimeAmount).toBe('31250.00');
      expect(result.totalPendingSalary).toBe('1531250.00');
      expect(result.sources).toContain('OvertimeRequest:ot-1');
      expect(
        result.warnings.some((w): boolean => w.startsWith('pending_salary_overtime_approximation')),
      ).toBe(true);
    });
  });

  // ── Empleado o salario inexistente ───────────────────────────────────────
  describe('empleado o salario inexistente', (): void => {
    it('no lanza excepción cuando no hay historial salarial — degrada a monto cero con warning', async (): Promise<void> => {
      findFirstSalary.mockResolvedValue(null);

      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      expect(result.monthlySalary).toBe('0.00');
      expect(result.totalPendingSalary).toBe('0.00');
      expect(result.sources.some((s): boolean => s.startsWith('EmployeeSalaryHistory'))).toBe(
        false,
      );
      expect(
        result.warnings.some((w): boolean => w.startsWith('pending_salary_no_salary_history')),
      ).toBe(true);
    });
  });

  // ── Fechas inválidas ──────────────────────────────────────────────────────
  describe('fechas inválidas', (): void => {
    it('degrada a cero días/cero monto sin lanzar ni devolver negativos si la terminación es anterior al inicio del contrato', async (): Promise<void> => {
      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15), // terminación
        new Date(2026, 6, 1), // contrato "inicia" después de la terminación (dato inconsistente)
      );

      expect(result.calendarDays).toBe(0);
      expect(result.commercialDays).toBe(0);
      expect(result.basePendingSalary).toBe('0.00');
      expect(result.totalPendingSalary).toBe('0.00');
      expect(Number(result.totalPendingSalary)).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Aislamiento multi-tenant ──────────────────────────────────────────────
  describe('aislamiento multi-tenant', (): void => {
    it('incluye tenantId en cada consulta (salario, overtime, novedades, incapacidades)', async (): Promise<void> => {
      await service.calculate(TENANT, EMPLOYEE, new Date(2026, 5, 15), new Date(2020, 0, 1));

      for (const mockFn of [
        findFirstSalary,
        findFirstOvertime,
        findManyOvertime,
        findManyNovedad,
        findManyMedicalLeave,
      ]) {
        expect(mockFn).toHaveBeenCalledWith(
          expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT }) }),
        );
      }
    });
  });

  // ── Redondeo ──────────────────────────────────────────────────────────────
  describe('redondeo monetario', (): void => {
    it('redondea a 2 decimales (ROUND_HALF_UP) cuando la división no es exacta', async (): Promise<void> => {
      findFirstSalary.mockResolvedValue(
        salaryRecord({ salaryAmount: new Prisma.Decimal(2500000) }),
      );

      // Tramo de 7 días — 2500000/30 = 83333.333...; *7 = 583333.333...
      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 7),
        new Date(2026, 5, 1),
      );

      expect(result.dailySalary).toBe('83333.33');
      expect(result.basePendingSalary).toBe('583333.33');
    });
  });

  // ── Warning de doble pago ─────────────────────────────────────────────────
  describe('warning de posible doble pago', (): void => {
    it('siempre incluye el warning de riesgo de doble pago (no hay tabla de nóminas cerradas)', async (): Promise<void> => {
      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      expect(
        result.warnings.some((w): boolean => w.startsWith('pending_salary_double_payment_risk')),
      ).toBe(true);
    });

    it('el servicio calcula salario CAUSADO (no neto de pagos previos) — nunca consulta un histórico de pagos', async (): Promise<void> => {
      // El único PrismaService inyectado no expone ningún modelo de pagos (p.ej.
      // employeePaymentHistory); si el servicio intentara conciliar contra pagos ya
      // realizados, esta llamada fallaría con "is not a function" en vez de resolver —
      // resuelve sin problema porque nunca lo intenta. El warning de doble pago es el
      // sustituto intencional de esa conciliación que este dominio no puede hacer todavía.
      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      expect(result).toBeDefined();
      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('sin tabla de nóminas cerradas')]),
      );
    });
  });

  // ── Preview sin persistencia ──────────────────────────────────────────────
  describe('preview sin persistencia', (): void => {
    it('no invoca ningún método de escritura — el PrismaService mockeado solo expone lecturas', async (): Promise<void> => {
      // Ninguno de los mocks inyectados (findFirst/findMany) es un create/update/upsert;
      // si el servicio intentara persistir algo, fallaría con un TypeError en runtime.
      const result = await service.calculate(
        TENANT,
        EMPLOYEE,
        new Date(2026, 5, 15),
        new Date(2020, 0, 1),
      );

      expect(result).toBeDefined();
      expect(findFirstSalary).toHaveBeenCalledTimes(1);
    });
  });
});
