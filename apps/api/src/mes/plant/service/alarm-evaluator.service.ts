import { Injectable } from '@nestjs/common';
import { AlarmSeverity, PhaseExecutionStatus, PlantAlarmType } from '@prisma/client';
import type {
  AlarmCandidate,
  AlarmEvaluationContext,
  ExecutionAlarmRow,
  IAlarmEvaluator,
  OrderAlarmRow,
} from '../interfaces/alarm.interfaces';

const MS_PER_MINUTE = 60_000;
const TIEMPO_OVERRUN_FACTOR = 1.2;
const FASE_SIN_OPERARIO_MINUTES = 15;
const OP_RETRASADA_WINDOW_MINUTES = 30;

const DEFAULT_SEVERITY: Record<PlantAlarmType, AlarmSeverity> = {
  [PlantAlarmType.TIEMPO_EXCEDIDO]: AlarmSeverity.WARNING,
  [PlantAlarmType.FASE_SIN_OPERARIO]: AlarmSeverity.CRITICAL,
  [PlantAlarmType.OP_RETRASADA]: AlarmSeverity.WARNING,
};

/** TIEMPO_EXCEDIDO — execution exceeded 120% of phase standard time (D1). */
export function evaluateTiempoExcedido(row: ExecutionAlarmRow, now: Date): AlarmCandidate | null {
  if (row.status !== PhaseExecutionStatus.IN_PROCESS || row.startedAt === null) {
    return null;
  }

  const thresholdMs = row.standardMinutes * TIEMPO_OVERRUN_FACTOR * MS_PER_MINUTE;
  if (now.getTime() - row.startedAt.getTime() <= thresholdMs) {
    return null;
  }

  return {
    alarmType: PlantAlarmType.TIEMPO_EXCEDIDO,
    severity: DEFAULT_SEVERITY[PlantAlarmType.TIEMPO_EXCEDIDO],
    tenantId: row.tenantId,
    workStationId: row.workStationId,
    executionId: row.executionId,
    orderId: row.orderId,
    message: 'Fase excedió tiempo estándar',
  };
}

/**
 * FASE_SIN_OPERARIO — IN_PROCESS execution without active operator session (D2).
 * Active session = `endedAt IS NULL`; when absent, anchor elapsed time on `startedAt`.
 */
export function evaluateFaseSinOperario(row: ExecutionAlarmRow, now: Date): AlarmCandidate | null {
  if (row.status !== PhaseExecutionStatus.IN_PROCESS) {
    return null;
  }

  if (row.activeSessionStartedAt !== null) {
    return null;
  }

  if (row.startedAt === null) {
    return null;
  }

  const withoutOperatorMs = now.getTime() - row.startedAt.getTime();
  if (withoutOperatorMs <= FASE_SIN_OPERARIO_MINUTES * MS_PER_MINUTE) {
    return null;
  }

  return {
    alarmType: PlantAlarmType.FASE_SIN_OPERARIO,
    severity: DEFAULT_SEVERITY[PlantAlarmType.FASE_SIN_OPERARIO],
    tenantId: row.tenantId,
    workStationId: row.workStationId,
    executionId: row.executionId,
    orderId: row.orderId,
    message: 'Fase en proceso sin operario activo',
  };
}

/** OP_RETRASADA — order within 30 minutes of planned end or already overdue. */
export function evaluateOpRetrasada(row: OrderAlarmRow, now: Date): AlarmCandidate | null {
  const msUntilEnd = row.plannedEndAt.getTime() - now.getTime();
  if (msUntilEnd > OP_RETRASADA_WINDOW_MINUTES * MS_PER_MINUTE) {
    return null;
  }

  const message =
    msUntilEnd < 0
      ? `Orden ${row.number} superó la fecha planificada de fin`
      : `Orden ${row.number} próxima a vencer`;

  return {
    alarmType: PlantAlarmType.OP_RETRASADA,
    severity: DEFAULT_SEVERITY[PlantAlarmType.OP_RETRASADA],
    tenantId: row.tenantId,
    workStationId: row.workStationId,
    orderId: row.orderId,
    message,
  };
}

export function evaluateTenantAlarms(input: AlarmEvaluationContext, now: Date): AlarmCandidate[] {
  const candidates: AlarmCandidate[] = [];

  for (const execution of input.executions) {
    const tiempo = evaluateTiempoExcedido(execution, now);
    if (tiempo) {
      candidates.push(tiempo);
    }

    const fase = evaluateFaseSinOperario(execution, now);
    if (fase) {
      candidates.push(fase);
    }
  }

  for (const order of input.orders) {
    const op = evaluateOpRetrasada(order, now);
    if (op) {
      candidates.push(op);
    }
  }

  return candidates;
}

@Injectable()
export class AlarmEvaluatorService implements IAlarmEvaluator {
  evaluateTenantAlarms(input: AlarmEvaluationContext, now: Date): AlarmCandidate[] {
    return evaluateTenantAlarms(input, now);
  }
}
