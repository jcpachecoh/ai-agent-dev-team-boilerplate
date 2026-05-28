import {
  AlarmSeverity,
  PhaseExecutionStatus,
  PlantAlarmType,
  ProductionOrderStatus,
} from '@prisma/client';
import type { ExecutionAlarmRow, OrderAlarmRow } from '../interfaces/alarm.interfaces';
import {
  AlarmEvaluatorService,
  evaluateFaseSinOperario,
  evaluateOpRetrasada,
  evaluateTenantAlarms,
  evaluateTiempoExcedido,
} from '../service/alarm-evaluator.service';

const tenantId = 'palos-de-lena';
const now = new Date('2026-05-28T10:30:00.000Z');

function buildExecution(overrides: Partial<ExecutionAlarmRow> = {}): ExecutionAlarmRow {
  return {
    executionId: 'exec-1',
    orderId: 'order-1',
    tenantId,
    workStationId: 'ws-1',
    status: PhaseExecutionStatus.IN_PROCESS,
    startedAt: new Date('2026-05-28T09:00:00.000Z'),
    standardMinutes: 30,
    activeSessionStartedAt: null,
    ...overrides,
  };
}

function buildOrder(overrides: Partial<OrderAlarmRow> = {}): OrderAlarmRow {
  return {
    orderId: 'order-1',
    tenantId,
    number: '2026-0001',
    status: ProductionOrderStatus.IN_PROCESS,
    plannedEndAt: new Date('2026-05-28T10:45:00.000Z'),
    workStationId: 'ws-1',
    ...overrides,
  };
}

describe('AlarmEvaluatorService', () => {
  const service = new AlarmEvaluatorService();

  describe('evaluateTiempoExcedido', () => {
    it('returns TIEMPO_EXCEDIDO when IN_PROCESS elapsed exceeds 120% of standard time', () => {
      const row = buildExecution({
        startedAt: new Date('2026-05-28T09:00:00.000Z'),
        standardMinutes: 30,
      });

      const candidate = evaluateTiempoExcedido(row, now);

      expect(candidate).toEqual({
        alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
        severity: AlarmSeverity.WARNING,
        tenantId,
        workStationId: 'ws-1',
        executionId: 'exec-1',
        orderId: 'order-1',
        message: 'Fase excedió tiempo estándar',
      });
    });

    it('returns null when startedAt is null', () => {
      const candidate = evaluateTiempoExcedido(buildExecution({ startedAt: null }), now);

      expect(candidate).toBeNull();
    });

    it('returns null when execution is not IN_PROCESS', () => {
      const candidate = evaluateTiempoExcedido(
        buildExecution({ status: PhaseExecutionStatus.READY }),
        now,
      );

      expect(candidate).toBeNull();
    });
    it('returns null when elapsed time is within 120% threshold', () => {
      const candidate = evaluateTiempoExcedido(
        buildExecution({
          startedAt: new Date('2026-05-28T10:10:00.000Z'),
          standardMinutes: 30,
        }),
        now,
      );

      expect(candidate).toBeNull();
    });
  });

  describe('evaluateFaseSinOperario', () => {
    it('returns FASE_SIN_OPERARIO when IN_PROCESS without active session for more than 15 minutes', () => {
      const candidate = evaluateFaseSinOperario(
        buildExecution({
          startedAt: new Date('2026-05-28T10:00:00.000Z'),
          activeSessionStartedAt: null,
        }),
        now,
      );

      expect(candidate).toEqual({
        alarmType: PlantAlarmType.FASE_SIN_OPERARIO,
        severity: AlarmSeverity.CRITICAL,
        tenantId,
        workStationId: 'ws-1',
        executionId: 'exec-1',
        orderId: 'order-1',
        message: 'Fase en proceso sin operario activo',
      });
    });

    it('returns null when a recent active session exists', () => {
      const candidate = evaluateFaseSinOperario(
        buildExecution({
          startedAt: new Date('2026-05-28T10:00:00.000Z'),
          activeSessionStartedAt: new Date('2026-05-28T10:25:00.000Z'),
        }),
        now,
      );

      expect(candidate).toBeNull();
    });

    it('returns null when execution is not IN_PROCESS', () => {
      const candidate = evaluateFaseSinOperario(
        buildExecution({ status: PhaseExecutionStatus.PAUSED }),
        now,
      );

      expect(candidate).toBeNull();
    });

    it('returns null when startedAt is null', () => {
      const candidate = evaluateFaseSinOperario(
        buildExecution({ startedAt: null, activeSessionStartedAt: null }),
        now,
      );

      expect(candidate).toBeNull();
    });

    it('returns null when without-operator duration is 15 minutes or less', () => {
      const candidate = evaluateFaseSinOperario(
        buildExecution({
          startedAt: new Date('2026-05-28T10:20:00.000Z'),
          activeSessionStartedAt: null,
        }),
        now,
      );

      expect(candidate).toBeNull();
    });
  });

  describe('evaluateOpRetrasada', () => {
    it('returns OP_RETRASADA when order is within 30 minutes of planned end', () => {
      const candidate = evaluateOpRetrasada(
        buildOrder({ plannedEndAt: new Date('2026-05-28T10:45:00.000Z') }),
        now,
      );

      expect(candidate).toEqual({
        alarmType: PlantAlarmType.OP_RETRASADA,
        severity: AlarmSeverity.WARNING,
        tenantId,
        workStationId: 'ws-1',
        orderId: 'order-1',
        message: 'Orden 2026-0001 próxima a vencer',
      });
    });

    it('returns null when planned end is more than 30 minutes away', () => {
      const candidate = evaluateOpRetrasada(
        buildOrder({ plannedEndAt: new Date('2026-05-28T12:00:00.000Z') }),
        now,
      );

      expect(candidate).toBeNull();
    });

    it('does not filter COMPLETED status at evaluator layer (repository scan excludes it)', () => {
      const candidate = evaluateOpRetrasada(
        buildOrder({
          status: ProductionOrderStatus.COMPLETED,
          plannedEndAt: new Date('2026-05-28T10:20:00.000Z'),
        }),
        now,
      );

      expect(candidate?.alarmType).toBe(PlantAlarmType.OP_RETRASADA);
    });
  });

  describe('evaluateTenantAlarms', () => {
    it('aggregates execution and order alarm candidates', () => {
      const candidates = evaluateTenantAlarms(
        {
          executions: [
            buildExecution({
              startedAt: new Date('2026-05-28T09:00:00.000Z'),
              activeSessionStartedAt: null,
            }),
          ],
          orders: [buildOrder({ plannedEndAt: new Date('2026-05-28T10:40:00.000Z') })],
        },
        now,
      );

      expect(candidates.map((c) => c.alarmType)).toEqual([
        PlantAlarmType.TIEMPO_EXCEDIDO,
        PlantAlarmType.FASE_SIN_OPERARIO,
        PlantAlarmType.OP_RETRASADA,
      ]);
    });

    it('evaluates 10 active OPs in under 500ms', () => {
      const executions: ExecutionAlarmRow[] = Array.from({ length: 10 }, (_, index) =>
        buildExecution({
          executionId: `exec-${index}`,
          orderId: `order-${index}`,
          workStationId: `ws-${index}`,
          startedAt: new Date('2026-05-28T09:00:00.000Z'),
          activeSessionStartedAt: new Date('2026-05-28T10:25:00.000Z'),
        }),
      );
      const orders: OrderAlarmRow[] = Array.from({ length: 10 }, (_, index) =>
        buildOrder({
          orderId: `order-${index}`,
          number: `2026-${String(index + 1).padStart(4, '0')}`,
          workStationId: `ws-${index}`,
          plannedEndAt: new Date('2026-05-28T10:50:00.000Z'),
        }),
      );

      const start = performance.now();
      service.evaluateTenantAlarms({ executions, orders }, now);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
    });
  });
});
