-- CreateTable
CREATE TABLE "case_milestones" (
    "milestoneId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "case_milestones_pkey" PRIMARY KEY ("milestoneId","caseId")
);

-- CreateTable
CREATE TABLE "supply_item_price_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "costoAnterior" DECIMAL(65,30) NOT NULL,
    "costoNuevo" DECIMAL(65,30) NOT NULL,
    "cantidadRecibida" DECIMAL(65,30),
    "stockAnterior" DECIMAL(65,30),
    "stockNuevo" DECIMAL(65,30),
    "motivo" TEXT,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_item_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supply_item_price_history_tenantId_supplyItemId_idx" ON "supply_item_price_history"("tenantId", "supplyItemId");

-- CreateIndex
CREATE INDEX "supply_item_price_history_tenantId_createdAt_idx" ON "supply_item_price_history"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "case_milestones" ADD CONSTRAINT "case_milestones_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_milestones" ADD CONSTRAINT "case_milestones_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supply_item_price_history" ADD CONSTRAINT "supply_item_price_history_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "supply_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
