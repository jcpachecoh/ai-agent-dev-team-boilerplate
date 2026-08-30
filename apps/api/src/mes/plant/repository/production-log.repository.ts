import { Injectable } from '@nestjs/common';
import type { ProductionLog, ProductionLogEvent } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  AppendProductionLogData,
  IProductionLogRepository,
} from '../interfaces/production-log.interfaces';

@Injectable()
export class ProductionLogRepository implements IProductionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  append(data: AppendProductionLogData): Promise<ProductionLog> {
    return this.prisma.productionLog.create({
      data: {
        tenantId: data.tenantId,
        orderId: data.orderId,
        phaseExecutionId: data.phaseExecutionId ?? null,
        employeeId: data.employeeId,
        workStationId: data.workStationId,
        event: data.event,
        notes: data.notes ?? null,
        durationSeconds: data.durationSeconds ?? null,
        idempotencyKey: data.idempotencyKey ?? null,
        timestamp: data.timestamp ?? new Date(),
      },
    });
  }

  findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<ProductionLog | null> {
    return this.prisma.productionLog.findFirst({
      where: { tenantId, idempotencyKey },
    });
  }

  findLastByOrder(tenantId: string, orderId: string): Promise<ProductionLog | null> {
    return this.prisma.productionLog.findFirst({
      where: { tenantId, orderId },
      orderBy: { timestamp: 'desc' },
    });
  }

  findLastByOrderAndEvents(
    tenantId: string,
    orderId: string,
    events: ProductionLogEvent[],
  ): Promise<ProductionLog | null> {
    return this.prisma.productionLog.findFirst({
      where: { tenantId, orderId, event: { in: events } },
      orderBy: { timestamp: 'desc' },
    });
  }

  findByOrder(tenantId: string, orderId: string): Promise<ProductionLog[]> {
    return this.prisma.productionLog.findMany({
      where: { tenantId, orderId },
      orderBy: { timestamp: 'asc' },
    });
  }
}
