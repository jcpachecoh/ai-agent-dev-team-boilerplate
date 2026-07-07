-- CreateEnum
CREATE TYPE "DocumentFileType" AS ENUM ('IDENTIFICATION', 'DRIVER_LICENSE', 'STUDY_CERTIFICATE', 'DEPENDANT_DOCUMENT', 'MEDICAL_CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fileType" "DocumentFileType" NOT NULL,
    "title" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "storageObjectId" TEXT NOT NULL,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_documents_tenantId_idx" ON "employee_documents"("tenantId");

-- CreateIndex
CREATE INDEX "employee_documents_employeeId_idx" ON "employee_documents"("employeeId");

-- CreateIndex
CREATE INDEX "employee_documents_tenantId_fileType_idx" ON "employee_documents"("tenantId", "fileType");

-- CreateIndex
CREATE INDEX "employee_documents_deletedAt_idx" ON "employee_documents"("deletedAt");

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_storageObjectId_fkey" FOREIGN KEY ("storageObjectId") REFERENCES "storage_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
