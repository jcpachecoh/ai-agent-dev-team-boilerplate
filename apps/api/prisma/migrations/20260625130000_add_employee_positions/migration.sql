-- CreateTable
CREATE TABLE "employee_positions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "baseSalaryRange" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_position_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_position_history_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "employee_details" ADD COLUMN "positionId" TEXT;

-- CreateIndex
CREATE INDEX "employee_positions_tenantId_isActive_idx" ON "employee_positions"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "employee_positions_tenantId_area_idx" ON "employee_positions"("tenantId", "area");

-- CreateIndex
CREATE UNIQUE INDEX "employee_positions_tenantId_title_key" ON "employee_positions"("tenantId", "title");

-- CreateIndex
CREATE INDEX "employee_position_history_tenantId_employeeDetailsId_idx" ON "employee_position_history"("tenantId", "employeeDetailsId");

-- CreateIndex
CREATE INDEX "employee_position_history_tenantId_positionId_idx" ON "employee_position_history"("tenantId", "positionId");

-- CreateIndex
CREATE INDEX "employee_position_history_employeeDetailsId_effectiveFrom_idx" ON "employee_position_history"("employeeDetailsId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "employee_details_positionId_idx" ON "employee_details"("positionId");

-- AddForeignKey
ALTER TABLE "employee_details" ADD CONSTRAINT "employee_details_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "employee_positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_position_history" ADD CONSTRAINT "employee_position_history_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_position_history" ADD CONSTRAINT "employee_position_history_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "employee_positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
