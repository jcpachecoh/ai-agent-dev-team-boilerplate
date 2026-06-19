-- CreateEnum
CREATE TYPE "ProductionLogEvent" AS ENUM (
  'ORDER_STARTED',
  'ORDER_PAUSED',
  'ORDER_RESUMED',
  'STEP_COMPLETED',
  'ORDER_COMPLETED',
  'NOVELTY_ADDED'
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "phaseExecutionId" TEXT,
    "employeeId" TEXT NOT NULL,
    "workStationId" TEXT NOT NULL,
    "event" "ProductionLogEvent" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "durationSeconds" INTEGER,
    "idempotencyKey" TEXT,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_logs_tenantId_orderId_timestamp_idx" ON "production_logs"("tenantId", "orderId", "timestamp");

-- CreateIndex
CREATE INDEX "production_logs_tenantId_orderId_event_idx" ON "production_logs"("tenantId", "orderId", "event");

-- CreateIndex
CREATE UNIQUE INDEX "production_logs_tenantId_idempotencyKey_key" ON "production_logs"("tenantId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_phaseExecutionId_fkey" FOREIGN KEY ("phaseExecutionId") REFERENCES "phase_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "operational_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_workStationId_fkey" FOREIGN KEY ("workStationId") REFERENCES "work_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
