-- OS-594: tabla progresiva de retención en la fuente (Ley 2277/2022)

CREATE TABLE "tax_withholding_brackets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "tenantScope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "sortOrder" INTEGER NOT NULL,
    "lowerUvtBound" DECIMAL(14,4) NOT NULL,
    "upperUvtBound" DECIMAL(14,4),
    "marginalRate" DECIMAL(8,6) NOT NULL,
    "fixedTaxUvt" DECIMAL(14,4) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "source" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_withholding_brackets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tax_withholding_brackets_tenantScope_validFrom_sortOrder_key" ON "tax_withholding_brackets"("tenantScope", "validFrom", "sortOrder");

CREATE INDEX "tax_withholding_brackets_tenantScope_validFrom_validTo_idx" ON "tax_withholding_brackets"("tenantScope", "validFrom", "validTo");

CREATE INDEX "tax_withholding_brackets_deletedAt_idx" ON "tax_withholding_brackets"("deletedAt");
