-- CONN-12: aprobación semanal de malla de turnos por sede.
-- Asociación con turno_assignments: implícita por locationId + weekStart (sin FK).

-- CreateEnum
CREATE TYPE "WeeklyShiftPlanStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "weekly_shift_plans" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "status" "WeeklyShiftPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedByUserId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedByUserId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_shift_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_shift_plans_tenantId_locationId_weekStart_key" ON "weekly_shift_plans"("tenantId", "locationId", "weekStart");

-- CreateIndex
CREATE INDEX "weekly_shift_plans_tenantId_status_weekStart_idx" ON "weekly_shift_plans"("tenantId", "status", "weekStart");

-- CreateIndex
CREATE INDEX "weekly_shift_plans_tenantId_locationId_weekStart_idx" ON "weekly_shift_plans"("tenantId", "locationId", "weekStart");

-- AddForeignKey
ALTER TABLE "weekly_shift_plans" ADD CONSTRAINT "weekly_shift_plans_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_shift_plans" ADD CONSTRAINT "weekly_shift_plans_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_shift_plans" ADD CONSTRAINT "weekly_shift_plans_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_shift_plans" ADD CONSTRAINT "weekly_shift_plans_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
