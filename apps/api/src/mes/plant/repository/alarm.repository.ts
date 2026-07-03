import { Injectable } from '@nestjs/common';
import {
  PhaseExecutionStatus,
  Prisma,
  ProductionOrderStatus,
  type PhaseExecutionStatus as PhaseExecutionStatusType,
  type PlantAlarmDispatch,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  AlarmDedupKey,
  CreateAlarmDispatchInput,
  ExecutionAlarmRow,
  IAlarmRepository,
  OrderAlarmRow,
} from '../interfaces/alarm.interfaces';

const OP_RETRASADA_WINDOW_MS = 30 * 60_000;

export const PLANT_ALARM_NOTIFICATION_STATUS = {
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;

@Injectable()
export class AlarmRepository implements IAlarmRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveAlarmTenantIds(now: Date): Promise<string[]> {
    const plannedEndDeadline = new Date(now.getTime() + OP_RETRASADA_WINDOW_MS);

    const [executionTenants, orderTenants] = await Promise.all([
      this.prisma.phaseExecution.findMany({
        where: { status: PhaseExecutionStatus.IN_PROCESS },
        distinct: ['tenantId'],
        select: { tenantId: true },
      }),
      this.prisma.productionOrder.findMany({
        where: {
          status: {
            notIn: [ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CANCELLED],
          },
          plannedEndAt: { lte: plannedEndDeadline },
        },
        distinct: ['tenantId'],
        select: { tenantId: true },
      }),
    ]);

    return [
      ...new Set([
        ...executionTenants.map((row) => row.tenantId),
        ...orderTenants.map((row) => row.tenantId),
      ]),
    ];
  }

  async findActiveExecutionsForAlarmScan(tenantId: string): Promise<ExecutionAlarmRow[]> {
    const executions = await this.prisma.phaseExecution.findMany({
      where: {
        tenantId,
        status: PhaseExecutionStatus.IN_PROCESS,
      },
      include: {
        phase: { select: { standardMinutes: true } },
        sessions: {
          where: { endedAt: null },
          orderBy: { startedAt: 'asc' },
          take: 1,
          select: { startedAt: true },
        },
      },
    });

    return executions.map((execution) => ({
      executionId: execution.id,
      orderId: execution.orderId,
      tenantId: execution.tenantId,
      workStationId: execution.workStationId,
      status: execution.status,
      startedAt: execution.startedAt,
      standardMinutes: execution.phase.standardMinutes,
      activeSessionStartedAt: execution.sessions[0]?.startedAt ?? null,
    }));
  }

  async findDelayedOrdersForAlarmScan(tenantId: string, now: Date): Promise<OrderAlarmRow[]> {
    const plannedEndDeadline = new Date(now.getTime() + OP_RETRASADA_WINDOW_MS);

    const orders = await this.prisma.productionOrder.findMany({
      where: {
        tenantId,
        status: {
          notIn: [ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CANCELLED],
        },
        plannedEndAt: { lte: plannedEndDeadline },
      },
      include: {
        executions: {
          include: {
            phase: { select: { order: true } },
          },
        },
        recipe: {
          include: {
            phases: {
              orderBy: { order: 'asc' },
              take: 1,
              select: { workStationId: true },
            },
          },
        },
      },
    });

    return orders.map((order) => ({
      orderId: order.id,
      tenantId: order.tenantId,
      number: order.number,
      status: order.status,
      plannedEndAt: order.plannedEndAt,
      workStationId: pickRepresentativeWorkStationId(order),
    }));
  }

  findRecentDispatch(
    tenantId: string,
    key: AlarmDedupKey,
    since: Date,
  ): Promise<PlantAlarmDispatch | null> {
    return this.prisma.plantAlarmDispatch.findFirst({
      where: {
        tenantId,
        alarmType: key.alarmType,
        dispatchedAt: { gte: since },
        ...(key.executionId
          ? { executionId: key.executionId }
          : {
              orderId: key.orderId ?? undefined,
              executionId: null,
            }),
      },
      orderBy: { dispatchedAt: 'desc' },
    });
  }

  createDispatch(input: CreateAlarmDispatchInput): Promise<PlantAlarmDispatch> {
    return this.prisma.plantAlarmDispatch.create({
      data: {
        tenantId: input.tenantId,
        alarmType: input.alarmType,
        severity: input.severity,
        message: input.message,
        executionId: input.executionId ?? null,
        orderId: input.orderId ?? null,
        metadata:
          input.metadata === undefined ? undefined : (input.metadata as Prisma.InputJsonValue),
      },
    });
  }

  markDispatchSent(tenantId: string, dispatchId: string): Promise<PlantAlarmDispatch | null> {
    return this.updateNotificationStatus(tenantId, dispatchId, {
      notificationStatus: PLANT_ALARM_NOTIFICATION_STATUS.SENT,
      notificationSentAt: new Date().toISOString(),
      notificationError: null,
    });
  }

  markDispatchFailed(
    tenantId: string,
    dispatchId: string,
    errorMessage: string,
  ): Promise<PlantAlarmDispatch | null> {
    return this.updateNotificationStatus(tenantId, dispatchId, {
      notificationStatus: PLANT_ALARM_NOTIFICATION_STATUS.FAILED,
      notificationFailedAt: new Date().toISOString(),
      notificationError: errorMessage,
    });
  }

  private async updateNotificationStatus(
    tenantId: string,
    dispatchId: string,
    patch: Record<string, unknown>,
  ): Promise<PlantAlarmDispatch | null> {
    const existing = await this.prisma.plantAlarmDispatch.findFirst({
      where: { id: dispatchId, tenantId },
    });

    if (!existing) {
      return null;
    }

    return this.prisma.plantAlarmDispatch.update({
      where: { id: dispatchId },
      data: {
        metadata: mergeNotificationMetadata(existing.metadata, patch),
      },
    });
  }
}

function mergeNotificationMetadata(
  existing: Prisma.JsonValue | null,
  patch: Record<string, unknown>,
): Prisma.InputJsonValue {
  const base =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  return { ...base, ...patch } as Prisma.InputJsonValue;
}

function pickRepresentativeWorkStationId(order: {
  executions: Array<{
    workStationId: string;
    status: PhaseExecutionStatusType;
    phase: { order: number };
  }>;
  recipe: { phases: Array<{ workStationId: string }> };
}): string {
  const inProcess = order.executions.find(
    (execution) => execution.status === PhaseExecutionStatus.IN_PROCESS,
  );
  if (inProcess) {
    return inProcess.workStationId;
  }

  const activeExecution = [...order.executions]
    .filter((execution) => execution.status !== PhaseExecutionStatus.COMPLETED)
    .sort((left, right) => right.phase.order - left.phase.order)[0];
  if (activeExecution) {
    return activeExecution.workStationId;
  }

  return order.recipe.phases[0]?.workStationId ?? order.executions[0]?.workStationId ?? '';
}
