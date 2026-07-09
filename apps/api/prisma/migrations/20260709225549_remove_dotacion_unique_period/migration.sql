-- DropIndex
DROP INDEX "dotacion_deliveries_employeeId_period_key";

-- CreateIndex
CREATE INDEX "dotacion_deliveries_employeeId_period_idx" ON "dotacion_deliveries"("employeeId", "period");
