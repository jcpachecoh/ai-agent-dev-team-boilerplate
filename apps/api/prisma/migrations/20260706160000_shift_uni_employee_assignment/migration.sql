-- SHIFT-UNI Task 01: extend turnos with location + daysOfWeek; employee_shift_assignments.
-- Backfill: each existing turno gets the first active location of its tenant (by createdAt).

-- AlterTable: add nullable columns first for safe backfill
ALTER TABLE "turnos" ADD COLUMN "locationId" TEXT;
ALTER TABLE "turnos" ADD COLUMN "daysOfWeek" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5];

-- Backfill locationId from first active location per tenant
UPDATE "turnos" t
SET "locationId" = (
  SELECT l."id"
  FROM "locations" l
  WHERE l."tenantId" = t."tenantId"
    AND l."isActive" = true
    AND l."deletedAt" IS NULL
  ORDER BY l."createdAt" ASC
  LIMIT 1
)
WHERE t."locationId" IS NULL;

-- Ensure daysOfWeek default for any null rows
UPDATE "turnos"
SET "daysOfWeek" = ARRAY[1, 2, 3, 4, 5]
WHERE "daysOfWeek" IS NULL;

-- NOT NULL after backfill (fails if a tenant has turnos but no locations)
ALTER TABLE "turnos" ALTER COLUMN "locationId" SET NOT NULL;
ALTER TABLE "turnos" ALTER COLUMN "daysOfWeek" SET NOT NULL;
ALTER TABLE "turnos" ALTER COLUMN "daysOfWeek" SET DEFAULT ARRAY[1, 2, 3, 4, 5];

-- CreateTable
CREATE TABLE "employee_shift_assignments" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "turnoId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_shift_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "employee_shift_assignments_effective_range_check"
      CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom")
);

-- CreateIndex
CREATE INDEX "turnos_tenantId_locationId_idx" ON "turnos"("tenantId", "locationId");

CREATE INDEX "employee_shift_assignments_tenantId_employeeId_effectiveFrom_idx"
  ON "employee_shift_assignments"("tenantId", "employeeId", "effectiveFrom");

CREATE INDEX "employee_shift_assignments_tenantId_turnoId_idx"
  ON "employee_shift_assignments"("tenantId", "turnoId");

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_turnoId_fkey"
  FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "employee_shift_assignments" ADD CONSTRAINT "employee_shift_assignments_updatedByUserId_fkey"
  FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
