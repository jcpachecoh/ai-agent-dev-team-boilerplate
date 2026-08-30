import type {
  AlarmSeverity,
  PhaseExecutionStatus,
  PlantAlarmDispatch,
  PlantAlarmType,
  ProductionOrderStatus,
} from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Alarm evaluation (pure — no Prisma in evaluator)
// ─────────────────────────────────────────────────────────────────────────────

export interface ExecutionAlarmRow {
  executionId: string;
  orderId: string;
  tenantId: string;
  workStationId: string;
  status: PhaseExecutionStatus;
  startedAt: Date | null;
  /** From linked production phase. */
  standardMinutes: number;
  /** Earliest active session (`endedAt IS NULL`) for this execution, if any. */
  activeSessionStartedAt: Date | null;
}

export interface OrderAlarmRow {
  orderId: string;
  tenantId: string;
  number: string;
  status: ProductionOrderStatus;
  plannedEndAt: Date;
  /** Representative station for OP_RETRASADA WS payload (e.g. current execution). */
  workStationId: string;
}

export interface AlarmEvaluationContext {
  executions: ExecutionAlarmRow[];
  orders: OrderAlarmRow[];
}

export interface AlarmCandidate {
  alarmType: PlantAlarmType;
  severity: AlarmSeverity;
  tenantId: string;
  workStationId: string;
  message: string;
  executionId?: string;
  orderId?: string;
}

export interface IAlarmEvaluator {
  evaluateTenantAlarms(input: AlarmEvaluationContext, now: Date): AlarmCandidate[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Alarm repository & dedup (D4 — 30-minute window enforced in service)
// ─────────────────────────────────────────────────────────────────────────────

export interface AlarmDedupKey {
  alarmType: PlantAlarmType;
  executionId?: string | null;
  orderId?: string | null;
}

export interface CreateAlarmDispatchInput {
  tenantId: string;
  alarmType: PlantAlarmType;
  severity: AlarmSeverity;
  message: string;
  executionId?: string | null;
  orderId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface IAlarmRepository {
  findActiveExecutionsForAlarmScan(tenantId: string): Promise<ExecutionAlarmRow[]>;
  findDelayedOrdersForAlarmScan(tenantId: string, now: Date): Promise<OrderAlarmRow[]>;
  findRecentDispatch(
    tenantId: string,
    key: AlarmDedupKey,
    since: Date,
  ): Promise<PlantAlarmDispatch | null>;
  createDispatch(input: CreateAlarmDispatchInput): Promise<PlantAlarmDispatch>;
}

// ─────────────────────────────────────────────────────────────────────────────
// BullMQ notification worker payload
// ─────────────────────────────────────────────────────────────────────────────

export interface PlantAlarmNotificationJob {
  tenantId: string;
  alarmType: PlantAlarmType;
  severity: AlarmSeverity;
  message: string;
  stationId: string;
  dispatchId: string;
  orderId?: string;
  executionId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// External adapters (stub implementations acceptable in tasks 06–09)
// ─────────────────────────────────────────────────────────────────────────────

export interface AlarmPushParams {
  tenantId: string;
  alarmType: PlantAlarmType;
  severity: AlarmSeverity;
  message: string;
  stationId: string;
  orderId?: string;
  executionId?: string;
}

export interface EmergencyAlertParams {
  tenantId: string;
  alarmType: PlantAlarmType;
  severity: AlarmSeverity;
  message: string;
  stationId: string;
  orderId?: string;
  executionId?: string;
}

export interface IAlarmPushAdapter {
  send(params: AlarmPushParams): Promise<void>;
}

export interface IEmergencyAlertAdapter {
  notify(params: EmergencyAlertParams): Promise<void>;
}
