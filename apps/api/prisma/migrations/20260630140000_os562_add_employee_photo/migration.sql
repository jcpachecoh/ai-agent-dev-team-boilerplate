-- AlterTable
ALTER TABLE "employee_details" ADD COLUMN "photoStorageObjectId" TEXT;

-- AddForeignKey
ALTER TABLE "employee_details" ADD CONSTRAINT "employee_details_photoStorageObjectId_fkey"
  FOREIGN KEY ("photoStorageObjectId") REFERENCES "storage_objects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
