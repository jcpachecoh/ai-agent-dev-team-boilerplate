-- CreateEnum
CREATE TYPE "MobileAttendanceEventType" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "MobileAttendanceStatus" AS ENUM ('VALID', 'REJECTED', 'PENDING');

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "checkInRadiusMeters" INTEGER,
ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "geoLatitude" DOUBLE PRECISION,
ADD COLUMN     "geoLongitude" DOUBLE PRECISION,
ADD COLUMN     "openingTime" TEXT;

-- AlterTable
ALTER TABLE "production_recipes" ALTER COLUMN "allergens" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "closingTime" TEXT,
ADD COLUMN     "openingTime" TEXT;

-- CreateTable
CREATE TABLE "mobile_attendance_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "eventType" "MobileAttendanceEventType" NOT NULL,
    "status" "MobileAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workDate" TIMESTAMP(3) NOT NULL,
    "clientLatitude" DOUBLE PRECISION NOT NULL,
    "clientLongitude" DOUBLE PRECISION NOT NULL,
    "distanceMeters" DOUBLE PRECISION,
    "radiusMeters" INTEGER,
    "storageObjectId" TEXT,
    "photoUrl" TEXT,
    "facialMatchScore" DOUBLE PRECISION,
    "facialMatchResult" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "mobile_attendance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mobile_attendance_logs_tenantId_employeeId_workDate_idx" ON "mobile_attendance_logs"("tenantId", "employeeId", "workDate");

-- CreateIndex
CREATE INDEX "mobile_attendance_logs_tenantId_locationId_workDate_idx" ON "mobile_attendance_logs"("tenantId", "locationId", "workDate");

-- CreateIndex
CREATE INDEX "mobile_attendance_logs_tenantId_status_idx" ON "mobile_attendance_logs"("tenantId", "status");

-- CreateIndex
CREATE INDEX "mobile_attendance_logs_deletedAt_idx" ON "mobile_attendance_logs"("deletedAt");

-- AddForeignKey
ALTER TABLE "mobile_attendance_logs" ADD CONSTRAINT "mobile_attendance_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobile_attendance_logs" ADD CONSTRAINT "mobile_attendance_logs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
