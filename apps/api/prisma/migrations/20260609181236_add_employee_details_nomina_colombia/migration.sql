-- CreateEnum
CREATE TYPE "EmployeeContractType" AS ENUM ('FIJO', 'INDEFINIDO', 'OBRA', 'PRESTACION', 'APRENDIZAJE');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('ORDINARIO', 'INTEGRAL');

-- CreateEnum
CREATE TYPE "ArlRiskLevel" AS ENUM ('RIESGO_I', 'RIESGO_II', 'RIESGO_III', 'RIESGO_IV', 'RIESGO_V');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nit" TEXT,
    "legalName" TEXT,
    "tradeName" TEXT,
    "legalRepresentativeName" TEXT,
    "legalRepresentativeDocumentType" "DocumentType",
    "legalRepresentativeDocumentNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "department" TEXT,
    "country" TEXT NOT NULL DEFAULT 'CO',
    "taxRegime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_details" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "contractType" "EmployeeContractType" NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3),
    "salaryType" "SalaryType" NOT NULL,
    "salaryAmount" DECIMAL(12,2) NOT NULL,
    "hasTransportSubsidy" BOOLEAN NOT NULL DEFAULT false,
    "isExemptFromTax" BOOLEAN NOT NULL DEFAULT false,
    "epsName" TEXT NOT NULL,
    "pensionFundName" TEXT NOT NULL,
    "cesantiasFundName" TEXT NOT NULL,
    "arlName" TEXT NOT NULL,
    "arlRiskLevel" "ArlRiskLevel" NOT NULL,
    "cajaCompensacion" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employee_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_nit_key" ON "tenants"("nit");

-- CreateIndex
CREATE INDEX "tenants_isActive_idx" ON "tenants"("isActive");

-- CreateIndex
CREATE INDEX "locations_tenantId_idx" ON "locations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "locations_tenantId_name_key" ON "locations"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "locations_tenantId_code_key" ON "locations"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_details_userId_key" ON "employee_details"("userId");

-- CreateIndex
CREATE INDEX "employee_details_tenantId_idx" ON "employee_details"("tenantId");

-- CreateIndex
CREATE INDEX "employee_details_locationId_idx" ON "employee_details"("locationId");

-- CreateIndex
CREATE INDEX "employee_details_contractType_idx" ON "employee_details"("contractType");

-- CreateIndex
CREATE INDEX "employee_details_isActive_idx" ON "employee_details"("isActive");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_details" ADD CONSTRAINT "employee_details_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_details" ADD CONSTRAINT "employee_details_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
