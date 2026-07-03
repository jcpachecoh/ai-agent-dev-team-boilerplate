import type { ProductionLog, ProductionLogEvent } from '@prisma/client';

export interface AppendProductionLogData {
  tenantId: string;
  orderId: string;
  phaseExecutionId?: string | null;
  employeeId: string;
  workStationId: string;
  event: ProductionLogEvent;
  notes?: string | null;
  durationSeconds?: number | null;
  idempotencyKey?: string | null;
  timestamp?: Date;
}

export interface IProductionLogRepository {
  append(data: AppendProductionLogData): Promise<ProductionLog>;
  findByIdempotencyKey(tenantId: string, idempotencyKey: string): Promise<ProductionLog | null>;
  findLastByOrder(tenantId: string, orderId: string): Promise<ProductionLog | null>;
  findLastByOrderAndEvents(
    tenantId: string,
    orderId: string,
    events: ProductionLogEvent[],
  ): Promise<ProductionLog | null>;
  findByOrder(tenantId: string, orderId: string): Promise<ProductionLog[]>;
}
