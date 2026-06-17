/*
  Warnings:

  - You are about to drop the column `operatorUserId` on the `phase_executions` table. All the data in the column will be lost.
  - You are about to drop the column `productionOrderId` on the `phase_executions` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `phase_executions` table. All the data in the column will be lost.
  - Added the required column `orderId` to the `phase_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plannedMinutes` to the `phase_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workStationId` to the `phase_executions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `batchCount` to the `production_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `production_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plannedEndAt` to the `production_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plannedQuantity` to the `production_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plannedStartAt` to the `production_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipeVersion` to the `production_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shift` to the `production_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `production_orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROCESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionPriority" AS ENUM ('NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ProductionShift" AS ENUM ('MORNING', 'AFTERNOON', 'NIGHT');

-- CreateEnum
CREATE TYPE "PhaseExecutionStatus" AS ENUM ('PENDING', 'READY', 'IN_PROCESS', 'PAUSED', 'QA_PENDING', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "phase_executions" DROP CONSTRAINT "phase_executions_operatorUserId_fkey";

-- DropForeignKey
ALTER TABLE "phase_executions" DROP CONSTRAINT "phase_executions_productionOrderId_fkey";

-- DropIndex
DROP INDEX "phase_executions_operatorUserId_idx";

-- DropIndex
DROP INDEX "phase_executions_phaseId_idx";

-- DropIndex
DROP INDEX "phase_executions_productionOrderId_idx";

-- DropIndex
DROP INDEX "production_orders_recipeId_idx";

-- DropIndex
DROP INDEX "production_orders_tenantId_idx";

-- AlterTable
ALTER TABLE "operator_sessions" ADD COLUMN     "phaseExecutionId" TEXT;

-- AlterTable
ALTER TABLE "phase_executions" DROP COLUMN "operatorUserId",
DROP COLUMN "productionOrderId",
DROP COLUMN "startedAt",
ADD COLUMN     "actualMinutes" INTEGER,
ADD COLUMN     "efficiencyPct" DECIMAL(5,2),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "plannedMinutes" INTEGER NOT NULL,
ADD COLUMN     "producedQuantity" DECIMAL(10,3),
ADD COLUMN     "qaApprovedAt" TIMESTAMP(3),
ADD COLUMN     "qaApprovedBy" TEXT,
ADD COLUMN     "status" "PhaseExecutionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "workStationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "production_orders" ADD COLUMN     "actualEndAt" TIMESTAMP(3),
ADD COLUMN     "actualStartAt" TIMESTAMP(3),
ADD COLUMN     "batchCount" INTEGER NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "plannedEndAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "plannedQuantity" DECIMAL(10,3) NOT NULL,
ADD COLUMN     "plannedStartAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "priority" "ProductionPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "producedQuantity" DECIMAL(10,3),
ADD COLUMN     "recipeVersion" INTEGER NOT NULL,
ADD COLUMN     "shift" "ProductionShift" NOT NULL,
ADD COLUMN     "status" "ProductionOrderStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "supervisorId" TEXT,
ADD COLUMN     "unit" "StockUnit" NOT NULL;

-- CreateIndex
CREATE INDEX "operator_sessions_phaseExecutionId_idx" ON "operator_sessions"("phaseExecutionId");

-- CreateIndex
CREATE INDEX "phase_executions_orderId_idx" ON "phase_executions"("orderId");

-- CreateIndex
CREATE INDEX "phase_executions_tenantId_workStationId_status_idx" ON "phase_executions"("tenantId", "workStationId", "status");

-- CreateIndex
CREATE INDEX "production_orders_tenantId_status_idx" ON "production_orders"("tenantId", "status");

-- CreateIndex
CREATE INDEX "production_orders_tenantId_plannedStartAt_idx" ON "production_orders"("tenantId", "plannedStartAt");

-- AddForeignKey
ALTER TABLE "operator_sessions" ADD CONSTRAINT "operator_sessions_phaseExecutionId_fkey" FOREIGN KEY ("phaseExecutionId") REFERENCES "phase_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_executions" ADD CONSTRAINT "phase_executions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "production_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phase_executions" ADD CONSTRAINT "phase_executions_workStationId_fkey" FOREIGN KEY ("workStationId") REFERENCES "work_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
