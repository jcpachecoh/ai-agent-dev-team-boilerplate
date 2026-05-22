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

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supply_item_price_history_tenantId_supplyItemId_idx" ON "supply_item_price_history"("tenantId", "supplyItemId");

-- CreateIndex
CREATE INDEX "supply_item_price_history_tenantId_createdAt_idx" ON "supply_item_price_history"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_tenantId_userId_idx" ON "password_reset_tokens"("tenantId", "userId");

-- AddForeignKey
ALTER TABLE "supply_item_price_history" ADD CONSTRAINT "supply_item_price_history_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "supply_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
