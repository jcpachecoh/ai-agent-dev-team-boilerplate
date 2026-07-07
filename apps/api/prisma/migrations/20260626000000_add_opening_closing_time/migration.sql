-- AlterTable
ALTER TABLE "tenants" ADD COLUMN "openingTime" TEXT,
                      ADD COLUMN "closingTime" TEXT;

-- AlterTable
ALTER TABLE "locations" ADD COLUMN "openingTime" TEXT,
                        ADD COLUMN "closingTime" TEXT;
