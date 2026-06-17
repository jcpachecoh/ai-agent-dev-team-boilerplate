-- AlterTable
ALTER TABLE "locations" ALTER COLUMN "address" DROP DEFAULT;

-- AlterTable
ALTER TABLE "production_incidents" ADD COLUMN     "locationId" TEXT;

-- CreateIndex
CREATE INDEX "production_incidents_tenantId_locationId_createdAt_idx" ON "production_incidents"("tenantId", "locationId", "createdAt");

-- AddForeignKey
ALTER TABLE "production_incidents" ADD CONSTRAINT "production_incidents_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
