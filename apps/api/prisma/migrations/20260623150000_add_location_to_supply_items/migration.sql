-- AlterTable
ALTER TABLE "supply_items" ADD COLUMN "locationId" TEXT;

-- CreateIndex
CREATE INDEX "supply_items_tenantId_locationId_idx" ON "supply_items"("tenantId", "locationId");

-- AddForeignKey
ALTER TABLE "supply_items" ADD CONSTRAINT "supply_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
