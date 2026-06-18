-- CreateEnum
CREATE TYPE "InventoryAlertType" AS ENUM ('LOW_STOCK');

-- CreateTable
CREATE TABLE "inventory_alert_resolutions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "alertType" "InventoryAlertType" NOT NULL DEFAULT 'LOW_STOCK',
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedById" TEXT,
    "note" TEXT,

    CONSTRAINT "inventory_alert_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_alert_resolutions_tenantId_supplyItemId_resolvedAt_idx" ON "inventory_alert_resolutions"("tenantId", "supplyItemId", "resolvedAt");

-- CreateIndex
CREATE INDEX "inventory_alert_resolutions_tenantId_resolvedAt_idx" ON "inventory_alert_resolutions"("tenantId", "resolvedAt");

-- AddForeignKey
ALTER TABLE "inventory_alert_resolutions" ADD CONSTRAINT "inventory_alert_resolutions_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "supply_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
