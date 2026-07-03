-- AlterTable: add name with temp default for existing rows, then drop default
ALTER TABLE "employee_details" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "employee_details" ALTER COLUMN "name" DROP DEFAULT;
