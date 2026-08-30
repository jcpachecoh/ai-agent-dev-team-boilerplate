-- CreateTable
CREATE TABLE "employee_position_supervisors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "supervisorPositionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_position_supervisors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_position_supervisors_tenantId_positionId_idx" ON "employee_position_supervisors"("tenantId", "positionId");

-- CreateIndex
CREATE INDEX "employee_position_supervisors_tenantId_supervisorPositionId_idx" ON "employee_position_supervisors"("tenantId", "supervisorPositionId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_position_supervisors_tenantId_positionId_superviso_key" ON "employee_position_supervisors"("tenantId", "positionId", "supervisorPositionId");

-- AddForeignKey
ALTER TABLE "employee_position_supervisors" ADD CONSTRAINT "employee_position_supervisors_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "employee_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_position_supervisors" ADD CONSTRAINT "employee_position_supervisors_supervisorPositionId_fkey" FOREIGN KEY ("supervisorPositionId") REFERENCES "employee_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
