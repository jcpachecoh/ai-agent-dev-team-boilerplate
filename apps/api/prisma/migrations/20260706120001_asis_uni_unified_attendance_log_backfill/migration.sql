-- ASIS-UNI Task 01 (paso 2/2): columnas móvil + backfill (requiere APP_MOVIL ya commiteado).

-- CreateEnum (idempotente)
DO $$ BEGIN
    CREATE TYPE "AttendanceValidationStatus" AS ENUM ('VALID', 'REJECTED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable (idempotente)
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "validationStatus" "AttendanceValidationStatus";
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "clientLatitude" DOUBLE PRECISION;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "clientLongitude" DOUBLE PRECISION;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "distanceMeters" DOUBLE PRECISION;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "radiusMeters" INTEGER;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "storageObjectId" TEXT;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "facialMatchScore" DOUBLE PRECISION;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "facialMatchResult" TEXT;
ALTER TABLE "attendance_logs" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "attendance_logs_tenantId_validationStatus_idx" ON "attendance_logs"("tenantId", "validationStatus");

-- Backfill: copiar marcaciones móviles activas a attendance_logs (idempotente por PK).
INSERT INTO "attendance_logs" (
    "id",
    "tenantId",
    "employeeId",
    "locationId",
    "eventType",
    "shift",
    "timestamp",
    "workDate",
    "notes",
    "isActive",
    "createdAt",
    "updatedAt",
    "source",
    "validationStatus",
    "clientLatitude",
    "clientLongitude",
    "distanceMeters",
    "radiusMeters",
    "storageObjectId",
    "photoUrl",
    "facialMatchScore",
    "facialMatchResult",
    "rejectionReason"
)
SELECT
    m."id",
    m."tenantId",
    m."employeeId",
    m."locationId",
    m."eventType"::text::"AttendanceEventType",
    NULL,
    m."timestamp",
    m."workDate",
    m."notes",
    true,
    m."createdAt",
    m."updatedAt",
    'APP_MOVIL'::"AttendanceLogSource",
    m."status"::text::"AttendanceValidationStatus",
    m."clientLatitude",
    m."clientLongitude",
    m."distanceMeters",
    m."radiusMeters",
    m."storageObjectId",
    m."photoUrl",
    m."facialMatchScore",
    m."facialMatchResult",
    m."rejectionReason"
FROM "mobile_attendance_logs" m
WHERE m."deletedAt" IS NULL
ON CONFLICT ("id") DO NOTHING;

-- Legacy kiosko (DEVICE) → APP_MOVIL
UPDATE "attendance_logs"
SET "source" = 'APP_MOVIL'::"AttendanceLogSource"
WHERE "source" = 'DEVICE'::"AttendanceLogSource"
  AND "validationStatus" IS NULL
  AND "clientLatitude" IS NULL;
