-- CreateEnum
CREATE TYPE "EmployeeRelationshipType" AS ENUM ('SPOUSE', 'CHILD', 'FATHER', 'MOTHER', 'OTHER');

-- CreateTable
CREATE TABLE "employee_social_profiles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "employeeDetailsId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationshipType" "EmployeeRelationshipType" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employee_social_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_social_profiles_employeeDetailsId_fullName_relationshipType_birthDate_key" ON "employee_social_profiles"("employeeDetailsId", "fullName", "relationshipType", "birthDate");

-- CreateIndex
CREATE INDEX "employee_social_profiles_tenantId_employeeDetailsId_idx" ON "employee_social_profiles"("tenantId", "employeeDetailsId");

-- CreateIndex
CREATE INDEX "employee_social_profiles_deletedAt_idx" ON "employee_social_profiles"("deletedAt");

-- AddForeignKey
ALTER TABLE "employee_social_profiles" ADD CONSTRAINT "employee_social_profiles_employeeDetailsId_fkey" FOREIGN KEY ("employeeDetailsId") REFERENCES "employee_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;
