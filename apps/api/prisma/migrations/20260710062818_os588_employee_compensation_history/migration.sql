-- CreateTable
CREATE TABLE "employee_salary_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "salaryType" "SalaryType" NOT NULL,
    "salaryAmount" DECIMAL(12,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_salary_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_fund_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "fundType" "EmployeeCatalogType" NOT NULL,
    "fundName" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_fund_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_salary_history_tenantId_employeeDetailsId_idx" ON "employee_salary_history"("tenantId", "employeeDetailsId");

-- CreateIndex
CREATE INDEX "employee_salary_history_employeeDetailsId_effectiveFrom_idx" ON "employee_salary_history"("employeeDetailsId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "employee_fund_history_tenantId_employeeDetailsId_fundType_idx" ON "employee_fund_history"("tenantId", "employeeDetailsId", "fundType");

-- CreateIndex
CREATE INDEX "employee_fund_history_employeeDetailsId_fundType_effectiveF_idx" ON "employee_fund_history"("employeeDetailsId", "fundType", "effectiveFrom");

-- AddForeignKey
ALTER TABLE "employee_salary_history" ADD CONSTRAINT "employee_salary_history_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_fund_history" ADD CONSTRAINT "employee_fund_history_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
