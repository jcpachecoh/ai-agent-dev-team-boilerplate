-- Fill any NULLs introduced while fields were optional
UPDATE "employee_details" SET
  "position"         = '' WHERE "position" IS NULL;
UPDATE "employee_details" SET
  "area"             = '' WHERE "area" IS NULL;
UPDATE "employee_details" SET
  "department"       = '' WHERE "department" IS NULL;
UPDATE "employee_details" SET
  "contractType"     = 'INDEFINIDO' WHERE "contractType" IS NULL;
UPDATE "employee_details" SET
  "hireDate"         = NOW() WHERE "hireDate" IS NULL;
UPDATE "employee_details" SET
  "contractStart"    = NOW() WHERE "contractStart" IS NULL;
UPDATE "employee_details" SET
  "salaryType"       = 'ORDINARIO' WHERE "salaryType" IS NULL;
UPDATE "employee_details" SET
  "salaryAmount"     = 0 WHERE "salaryAmount" IS NULL;
UPDATE "employee_details" SET
  "epsName"          = '' WHERE "epsName" IS NULL;
UPDATE "employee_details" SET
  "pensionFundName"  = '' WHERE "pensionFundName" IS NULL;
UPDATE "employee_details" SET
  "cesantiasFundName"= '' WHERE "cesantiasFundName" IS NULL;
UPDATE "employee_details" SET
  "arlName"          = '' WHERE "arlName" IS NULL;
UPDATE "employee_details" SET
  "arlRiskLevel"     = 'RIESGO_I' WHERE "arlRiskLevel" IS NULL;
UPDATE "employee_details" SET
  "cajaCompensacion" = '' WHERE "cajaCompensacion" IS NULL;

-- AlterTable
ALTER TABLE "employee_details"
  ALTER COLUMN "position"          SET NOT NULL,
  ALTER COLUMN "area"              SET NOT NULL,
  ALTER COLUMN "department"        SET NOT NULL,
  ALTER COLUMN "contractType"      SET NOT NULL,
  ALTER COLUMN "hireDate"          SET NOT NULL,
  ALTER COLUMN "contractStart"     SET NOT NULL,
  ALTER COLUMN "salaryType"        SET NOT NULL,
  ALTER COLUMN "salaryAmount"      SET NOT NULL,
  ALTER COLUMN "epsName"           SET NOT NULL,
  ALTER COLUMN "pensionFundName"   SET NOT NULL,
  ALTER COLUMN "cesantiasFundName" SET NOT NULL,
  ALTER COLUMN "arlName"           SET NOT NULL,
  ALTER COLUMN "arlRiskLevel"      SET NOT NULL,
  ALTER COLUMN "cajaCompensacion"  SET NOT NULL;
