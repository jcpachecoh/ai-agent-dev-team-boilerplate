-- AlterEnum
ALTER TYPE "StockUnit" ADD VALUE 'BOX';

-- AlterTable
ALTER TABLE "supply_items" ADD COLUMN "stockActualBodega" DECIMAL(65,30) NOT NULL DEFAULT 0;
