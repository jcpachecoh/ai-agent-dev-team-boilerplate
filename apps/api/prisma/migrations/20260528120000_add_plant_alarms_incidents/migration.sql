-- AlterTable
ALTER TABLE "phase_executions" ADD COLUMN "startedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "PlantAlarmType" AS ENUM ('TIEMPO_EXCEDIDO', 'FASE_SIN_OPERARIO', 'OP_RETRASADA');

-- CreateEnum
CREATE TYPE "AlarmSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('QUALITY', 'SAFETY', 'EQUIPMENT', 'OTHER');

-- CreateTable
CREATE TABLE "plant_alarm_dispatches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "alarmType" "PlantAlarmType" NOT NULL,
    "executionId" TEXT,
    "orderId" TEXT,
    "severity" "AlarmSeverity" NOT NULL,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "plant_alarm_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_incidents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT,
    "executionId" TEXT,
    "workStationId" TEXT NOT NULL,
    "operatorUserId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "severity" "AlarmSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phase_executions_tenantId_status_startedAt_idx" ON "phase_executions"("tenantId", "status", "startedAt");

-- CreateIndex
CREATE INDEX "plant_alarm_dispatches_tenantId_idx" ON "plant_alarm_dispatches"("tenantId");

-- CreateIndex
CREATE INDEX "plant_alarm_dispatches_tenantId_alarmType_executionId_dispatchedAt_idx" ON "plant_alarm_dispatches"("tenantId", "alarmType", "executionId", "dispatchedAt");

-- CreateIndex
CREATE INDEX "plant_alarm_dispatches_tenantId_alarmType_orderId_dispatchedAt_idx" ON "plant_alarm_dispatches"("tenantId", "alarmType", "orderId", "dispatchedAt");

-- CreateIndex
CREATE INDEX "production_incidents_tenantId_idx" ON "production_incidents"("tenantId");

-- CreateIndex
CREATE INDEX "production_incidents_tenantId_workStationId_idx" ON "production_incidents"("tenantId", "workStationId");

-- CreateIndex
CREATE INDEX "production_incidents_tenantId_orderId_idx" ON "production_incidents"("tenantId", "orderId");

-- CreateIndex
CREATE INDEX "production_incidents_tenantId_resolvedAt_idx" ON "production_incidents"("tenantId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "plant_alarm_dispatches" ADD CONSTRAINT "plant_alarm_dispatches_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "phase_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plant_alarm_dispatches" ADD CONSTRAINT "plant_alarm_dispatches_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_incidents" ADD CONSTRAINT "production_incidents_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_incidents" ADD CONSTRAINT "production_incidents_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "phase_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_incidents" ADD CONSTRAINT "production_incidents_workStationId_fkey" FOREIGN KEY ("workStationId") REFERENCES "work_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_incidents" ADD CONSTRAINT "production_incidents_operatorUserId_fkey" FOREIGN KEY ("operatorUserId") REFERENCES "operational_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_incidents" ADD CONSTRAINT "production_incidents_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "operational_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
