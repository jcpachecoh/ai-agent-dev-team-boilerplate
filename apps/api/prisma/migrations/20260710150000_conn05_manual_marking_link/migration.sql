-- CONN-05: vínculo opcional marcación manual ↔ nómina / incapacidad

-- AlterTable
ALTER TABLE "medical_leaves" ADD COLUMN "sourceAttendanceLogId" TEXT;

-- AlterTable
ALTER TABLE "payroll_novedades" ADD COLUMN "sourceAttendanceLogId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "medical_leaves_sourceAttendanceLogId_key" ON "medical_leaves"("sourceAttendanceLogId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_novedades_sourceAttendanceLogId_key" ON "payroll_novedades"("sourceAttendanceLogId");

-- CreateIndex
CREATE INDEX "medical_leaves_tenantId_sourceAttendanceLogId_idx" ON "medical_leaves"("tenantId", "sourceAttendanceLogId");

-- CreateIndex
CREATE INDEX "payroll_novedades_tenantId_sourceAttendanceLogId_idx" ON "payroll_novedades"("tenantId", "sourceAttendanceLogId");

-- AddForeignKey
ALTER TABLE "medical_leaves" ADD CONSTRAINT "medical_leaves_sourceAttendanceLogId_fkey" FOREIGN KEY ("sourceAttendanceLogId") REFERENCES "attendance_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_novedades" ADD CONSTRAINT "payroll_novedades_sourceAttendanceLogId_fkey" FOREIGN KEY ("sourceAttendanceLogId") REFERENCES "attendance_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
