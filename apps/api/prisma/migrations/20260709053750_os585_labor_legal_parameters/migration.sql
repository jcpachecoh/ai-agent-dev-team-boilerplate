-- CreateTable
CREATE TABLE "labor_legal_parameters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantScope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "key" TEXT NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "source" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "labor_legal_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "labor_legal_parameters_key_validFrom_idx" ON "labor_legal_parameters"("key", "validFrom");

-- CreateIndex
CREATE INDEX "labor_legal_parameters_tenantId_key_validFrom_idx" ON "labor_legal_parameters"("tenantId", "key", "validFrom");

-- CreateIndex
CREATE INDEX "labor_legal_parameters_deletedAt_idx" ON "labor_legal_parameters"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "labor_legal_parameters_tenantScope_key_validFrom_key" ON "labor_legal_parameters"("tenantScope", "key", "validFrom");
