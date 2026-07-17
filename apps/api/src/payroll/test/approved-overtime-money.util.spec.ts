import {
  AttendanceEventType,
  AttendanceMarkingScope,
  OvertimeRequestType,
  Prisma,
  type LaborLegalParameter,
} from '@prisma/client';

import { LegalParameterSnapshot } from '../../labor-legal-parameters/service/legal-parameter-snapshot';
import {
  computeApprovedOvertimeMoney,
  type ApprovedOvertimeRequestSlice,
} from '../utils/approved-overtime-money.util';

function legalParam(key: string, value: number): LaborLegalParameter {
  return {
    id: `param-${key}`,
    tenantId: null,
    tenantScope: 'GLOBAL',
    key,
    value: new Prisma.Decimal(value),
    validFrom: new Date('2020-01-01'),
    validTo: null,
    source: 'test',
    deletedAt: null,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
  } as LaborLegalParameter;
}

const SNAPSHOT = new LegalParameterSnapshot(
  [
    legalParam('HORARIO_NOCTURNO_INICIO', 21),
    legalParam('RECARGO_DOMINICAL_FESTIVO', 0.75),
    legalParam('RECARGO_HORA_EXTRA_DIURNA', 0.25),
    legalParam('RECARGO_HORA_EXTRA_NOCTURNA', 0.75),
  ],
  null,
);

const SALARY = new Prisma.Decimal(2_400_000);
const RANGE_START = new Date('2026-03-01T00:00:00.000Z');
const RANGE_END = new Date('2026-03-31T23:59:59.000Z');

function autoRequest(
  overrides: Partial<ApprovedOvertimeRequestSlice> = {},
): ApprovedOvertimeRequestSlice {
  return {
    id: 'auto-1',
    type: OvertimeRequestType.DETECCION_AUTOMATICA,
    payrollPeriod: '2026-03',
    accumulatedMinutes: 120,
    shiftEndTime: new Date('2026-03-16T19:00:00.000Z'),
    actualEndTime: new Date('2026-03-16T21:00:00.000Z'),
    workDate: null,
    proposedStartTime: null,
    proposedEndTime: null,
    proposedMinutes: null,
    ...overrides,
  };
}

function adminRequest(
  overrides: Partial<ApprovedOvertimeRequestSlice> = {},
): ApprovedOvertimeRequestSlice {
  return {
    id: 'admin-1',
    type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
    payrollPeriod: '2026-03',
    accumulatedMinutes: null,
    shiftEndTime: null,
    actualEndTime: null,
    workDate: new Date('2026-03-16T00:00:00.000Z'),
    proposedStartTime: new Date('2026-03-17T03:00:00.000Z'), // 22:00 Bogotá
    proposedEndTime: new Date('2026-03-17T04:30:00.000Z'), // 23:30 Bogotá
    proposedMinutes: 90,
    ...overrides,
  };
}

describe('computeApprovedOvertimeMoney', (): void => {
  it('admin APROBADA sin marcación → 0 (no usa proposedMinutes ni 75%)', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [adminRequest()],
      logs: [],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    expect(result.amount.toFixed(2)).toBe('0.00');
    expect(result.liquidableMinutes).toBe(0);
    expect(result.concepts).toEqual([]);
  });

  it('admin APROBADA + marcación diurna → recargo diurno legal (no por type)', (): void => {
    // Ventana diurna 14:00–16:00 Bogotá
    const admin = adminRequest({
      proposedStartTime: new Date('2026-03-16T19:00:00.000Z'),
      proposedEndTime: new Date('2026-03-16T21:00:00.000Z'),
      proposedMinutes: 120,
    });
    const result = computeApprovedOvertimeMoney({
      requests: [admin],
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-16T19:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-16T21:00:00.000Z'),
          isActive: true,
        },
      ],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    // 10000 * 1.25 * 2h = 25000
    expect(result.amount.toFixed(2)).toBe('25000.00');
    expect(result.concepts).toEqual(['OVERTIME:DIURNO']);
    expect(result.liquidableMinutes).toBe(120);
  });

  it('admin APROBADA + marcación nocturna → nocturno por horario, no por type', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [adminRequest()],
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T03:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T04:00:00.000Z'),
          isActive: true,
        },
      ],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    // 60 min ∩ ventana; 10000 * 1.75 * 1h = 17500
    expect(result.amount.toFixed(2)).toBe('17500.00');
    expect(result.concepts).toEqual(['OVERTIME:NOCTURNO']);
    expect(result.liquidableMinutes).toBe(60);
  });

  it('proposedMinutes no se usa como pagable (marcación parcial)', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [adminRequest({ proposedMinutes: 500 })],
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T03:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T03:30:00.000Z'),
          isActive: true,
        },
      ],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    expect(result.liquidableMinutes).toBe(30);
    expect(result.amount.toFixed(2)).not.toBe(
      // 500 min * nocturno would be huge if proposedMinutes were used
      new Prisma.Decimal(10000)
        .times(1.75)
        .times(500 / 60)
        .toFixed(2),
    );
  });

  it('detección automática sin pares OVERTIME mantiene legacy accumulatedMinutes', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [autoRequest()],
      logs: [],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    expect(result.usedLegacyAutomatic).toBe(true);
    expect(result.amount.toFixed(2)).toBe('25000.00');
    expect(result.concepts).toEqual(['OVERTIME:DIURNO']);
  });

  it('auto + admin con solape no duplica minutos marcados', (): void => {
    const markedEntry = new Date('2026-03-17T03:00:00.000Z');
    const markedExit = new Date('2026-03-17T05:00:00.000Z'); // 2h OVERTIME
    const result = computeApprovedOvertimeMoney({
      requests: [
        autoRequest({
          accumulatedMinutes: 120,
          shiftEndTime: markedEntry,
          actualEndTime: markedExit,
        }),
        adminRequest({
          proposedStartTime: markedEntry,
          proposedEndTime: new Date('2026-03-17T04:00:00.000Z'),
          proposedMinutes: 60,
        }),
      ],
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: markedEntry,
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: markedExit,
          isActive: true,
        },
      ],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    // Unión = 120 min marcados (auto autoriza todo marked); no 180
    expect(result.liquidableMinutes).toBe(120);
    expect(result.usedLegacyAutomatic).toBe(false);
  });

  it('requests sin payrollPeriod usan el rango fallback para filtrar logs', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [adminRequest({ payrollPeriod: null })],
      logs: [
        // Log fuera del rango fallback — debe descartarse
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-02-10T03:00:00.000Z'),
          isActive: true,
        },
        // Par dentro del rango; isActive omitido para ejercer el default `?? true`
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T03:00:00.000Z'),
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T04:00:00.000Z'),
        },
      ],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    // 60 min ∩ ventana admin nocturna; 10000 * 1.75 * 1h = 17500
    expect(result.amount.toFixed(2)).toBe('17500.00');
    expect(result.liquidableMinutes).toBe(60);
  });

  it('legacy: accumulatedMinutes null o 0 no aportan dinero', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [
        autoRequest({ id: 'auto-null', accumulatedMinutes: null }),
        autoRequest({ id: 'auto-zero', accumulatedMinutes: 0 }),
      ],
      logs: [],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    expect(result.usedLegacyAutomatic).toBe(true);
    expect(result.amount.toFixed(2)).toBe('0.00');
    expect(result.sourceIds).toEqual([]);
  });

  it('legacy: sin salario resoluble no aporta dinero', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [autoRequest()],
      logs: [],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): null => null,
    });

    expect(result.usedLegacyAutomatic).toBe(true);
    expect(result.amount.toFixed(2)).toBe('0.00');
  });

  it('intervalo liquidable menor a un minuto se descarta', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [autoRequest()],
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T03:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T03:00:30.000Z'),
          isActive: true,
        },
      ],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    expect(result.usedLegacyAutomatic).toBe(false);
    expect(result.amount.toFixed(2)).toBe('0.00');
    expect(result.liquidableMinutes).toBe(0);
  });

  it('intervalo liquidable sin salario resoluble no aporta dinero', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [autoRequest()],
      logs: [
        {
          eventType: AttendanceEventType.ENTRY,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T03:00:00.000Z'),
          isActive: true,
        },
        {
          eventType: AttendanceEventType.EXIT,
          markingScope: AttendanceMarkingScope.OVERTIME,
          timestamp: new Date('2026-03-17T04:00:00.000Z'),
          isActive: true,
        },
      ],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): null => null,
    });

    expect(result.usedLegacyAutomatic).toBe(false);
    expect(result.amount.toFixed(2)).toBe('0.00');
    expect(result.liquidableMinutes).toBe(0);
  });

  it('fila admin con metadata nullable incompleta no falla y aporta 0', (): void => {
    const result = computeApprovedOvertimeMoney({
      requests: [
        adminRequest({
          proposedStartTime: null,
          proposedEndTime: null,
          proposedMinutes: null,
          workDate: null,
        }),
      ],
      logs: [],
      rangeStart: RANGE_START,
      rangeEnd: RANGE_END,
      legalSnapshot: SNAPSHOT,
      resolveSalaryAt: (): Prisma.Decimal => SALARY,
    });

    expect(result.amount.toFixed(2)).toBe('0.00');
  });
});
