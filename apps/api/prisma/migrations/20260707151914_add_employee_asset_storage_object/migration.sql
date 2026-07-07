-- AlterTable
ALTER TABLE "employee_assets" ADD COLUMN     "storageObjectId" TEXT;

-- CreateIndex
CREATE INDEX "employee_assets_storageObjectId_idx" ON "employee_assets"("storageObjectId");

-- AddForeignKey
ALTER TABLE "employee_assets" ADD CONSTRAINT "employee_assets_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
