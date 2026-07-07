-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHECK');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('SAVINGS', 'CHECKING');

-- CreateEnum
CREATE TYPE "FinancialPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "OperationalRole_new" AS ENUM ('OWNER', 'SUPERVISOR', 'MANAGER', 'OPERATOR');
ALTER TABLE "operational_users" ALTER COLUMN "role" TYPE "OperationalRole_new" USING ("role"::text::"OperationalRole_new");
ALTER TYPE "OperationalRole" RENAME TO "OperationalRole_old";
ALTER TYPE "OperationalRole_new" RENAME TO "OperationalRole";
DROP TYPE "OperationalRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "locations" DROP COLUMN "closingTime",
DROP COLUMN "openingTime";

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "closingTime",
DROP COLUMN "openingTime";

-- CreateTable
CREATE TABLE "employee_financial_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "primaryBankAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employee_financial_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_bank_accounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "financialProfileId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "accountType" "BankAccountType" NOT NULL,
    "accountNumberEncrypted" TEXT NOT NULL,
    "accountLast4" CHAR(4) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employee_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_tax_information" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "financialProfileId" TEXT NOT NULL,
    "taxIdEncrypted" TEXT NOT NULL,
    "taxIdLast4" CHAR(4) NOT NULL,
    "taxRegime" TEXT,
    "withholdingApplicable" BOOLEAN NOT NULL DEFAULT false,
    "withholdingRate" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_tax_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_payment_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "financialProfileId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "deductionBreakdown" JSONB,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "FinancialPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_financial_profiles_employeeDetailsId_key" ON "employee_financial_profiles"("employeeDetailsId");

-- CreateIndex
CREATE INDEX "employee_financial_profiles_tenantId_idx" ON "employee_financial_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "employee_financial_profiles_deletedAt_idx" ON "employee_financial_profiles"("deletedAt");

-- CreateIndex
CREATE INDEX "employee_bank_accounts_tenantId_financialProfileId_idx" ON "employee_bank_accounts"("tenantId", "financialProfileId");

-- CreateIndex
CREATE INDEX "employee_bank_accounts_tenantId_isActive_idx" ON "employee_bank_accounts"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "employee_bank_accounts_deletedAt_idx" ON "employee_bank_accounts"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "employee_tax_information_financialProfileId_key" ON "employee_tax_information"("financialProfileId");

-- CreateIndex
CREATE INDEX "employee_tax_information_tenantId_financialProfileId_idx" ON "employee_tax_information"("tenantId", "financialProfileId");

-- CreateIndex
CREATE INDEX "employee_payment_history_tenantId_financialProfileId_idx" ON "employee_payment_history"("tenantId", "financialProfileId");

-- CreateIndex
CREATE INDEX "employee_payment_history_tenantId_periodYear_periodMonth_idx" ON "employee_payment_history"("tenantId", "periodYear", "periodMonth");

-- CreateIndex
CREATE INDEX "employee_payment_history_tenantId_status_idx" ON "employee_payment_history"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_payment_history_financialProfileId_periodYear_peri_key" ON "employee_payment_history"("financialProfileId", "periodYear", "periodMonth");

-- AddForeignKey
ALTER TABLE "employee_financial_profiles" ADD CONSTRAINT "employee_financial_profiles_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_bank_accounts" ADD CONSTRAINT "employee_bank_accounts_financialProfileId_fkey" FOREIGN KEY ("financialProfileId") REFERENCES "employee_financial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_tax_information" ADD CONSTRAINT "employee_tax_information_financialProfileId_fkey" FOREIGN KEY ("financialProfileId") REFERENCES "employee_financial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_history" ADD CONSTRAINT "employee_payment_history_financialProfileId_fkey" FOREIGN KEY ("financialProfileId") REFERENCES "employee_financial_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_history" ADD CONSTRAINT "employee_payment_history_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "employee_bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "employee_social_profiles_employeeDetailsId_fullName_relationshi" RENAME TO "employee_social_profiles_employeeDetailsId_fullName_relatio_key";

-- RenameIndex
ALTER INDEX "inventory_alert_resolutions_tenantId_supplyItemId_resolvedAt_id" RENAME TO "inventory_alert_resolutions_tenantId_supplyItemId_resolvedA_idx";

