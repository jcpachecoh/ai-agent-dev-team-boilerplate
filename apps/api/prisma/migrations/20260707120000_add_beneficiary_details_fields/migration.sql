-- CreateEnum
CREATE TYPE "BeneficiaryDisabilityType" AS ENUM ('NOT_APPLICABLE', 'PHYSICAL', 'AUDITORY', 'VISUAL', 'DEAFBLINDNESS', 'INTELLECTUAL_COGNITIVE', 'PSYCHOSOCIAL', 'MULTIPLE');

-- AlterEnum
ALTER TYPE "EmployeeRelationshipType" ADD VALUE 'MINOR_IN_CHARGE';
ALTER TYPE "EmployeeRelationshipType" ADD VALUE 'ORPHAN_SIBLING';

-- AlterTable
ALTER TABLE "employee_social_profiles" ADD COLUMN     "disability" "BeneficiaryDisabilityType" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentType" "DocumentType",
ADD COLUMN     "primerApellido" TEXT,
ADD COLUMN     "primerNombre" TEXT,
ADD COLUMN     "segundoApellido" TEXT,
ADD COLUMN     "segundoNombre" TEXT;
