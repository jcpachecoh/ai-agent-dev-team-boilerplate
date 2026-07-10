-- CreateEnum
CREATE TYPE "CesantiasSettlementStatus" AS ENUM ('CALCULADA', 'CONSIGNADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "CesantiasInterestStatus" AS ENUM ('CALCULADO', 'PAGADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "CesantiasFundChannel" AS ENUM ('FNA', 'PRIVATE_OPERATOR');

-- CreateTable
CREATE TABLE "cesantias_liquidations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "accrualDays" INTEGER NOT NULL,
    "calculationBase" DECIMAL(12,2) NOT NULL,
    "cesantiasAmount" DECIMAL(14,2) NOT NULL,
    "interestAmount" DECIMAL(14,2) NOT NULL,
    "interestRateSnapshot" DECIMAL(6,4) NOT NULL,
    "fundNameSnapshot" TEXT NOT NULL,
    "fundChannelSnapshot" "CesantiasFundChannel" NOT NULL,
    "cesantiasStatus" "CesantiasSettlementStatus" NOT NULL DEFAULT 'CALCULADA',
    "interestStatus" "CesantiasInterestStatus" NOT NULL DEFAULT 'CALCULADO',
    "calculatedBy" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cesantias_liquidations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_year_idx" ON "cesantias_liquidations"("tenantId", "year");

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_employeeId_idx" ON "cesantias_liquidations"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_cesantiasStatus_idx" ON "cesantias_liquidations"("tenantId", "cesantiasStatus");

-- CreateIndex
CREATE INDEX "cesantias_liquidations_tenantId_interestStatus_idx" ON "cesantias_liquidations"("tenantId", "interestStatus");

-- CreateIndex
CREATE UNIQUE INDEX "cesantias_liquidations_employeeId_year_key" ON "cesantias_liquidations"("employeeId", "year");

-- AddForeignKey
ALTER TABLE "cesantias_liquidations" ADD CONSTRAINT "cesantias_liquidations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
