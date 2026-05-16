/*
  Warnings:

  - You are about to drop the column `insumoId` on the `supplier_products` table. All the data in the column will be lost.
  - You are about to drop the `insumos` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenantId,supplierId,supplyItemId]` on the table `supplier_products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `supplyItemId` to the `supplier_products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "supplier_products" DROP CONSTRAINT "supplier_products_insumoId_fkey";

-- DropIndex
DROP INDEX "supplier_products_tenantId_insumoId_idx";

-- DropIndex
DROP INDEX "supplier_products_tenantId_supplierId_insumoId_key";

-- AlterTable
ALTER TABLE "supplier_products" DROP COLUMN "insumoId",
ADD COLUMN     "supplyItemId" TEXT NOT NULL;

-- DropTable
DROP TABLE "insumos";

-- CreateTable
CREATE TABLE "supply_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoInterno" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "descripcion" TEXT,
    "unidadBase" "StockUnit" NOT NULL,
    "factorConversion" DECIMAL(65,30) NOT NULL,
    "costoPromedioPonderado" DECIMAL(65,30) NOT NULL,
    "stockMinimoBodega" DECIMAL(65,30) NOT NULL,
    "stockMaximoBodega" DECIMAL(65,30) NOT NULL,
    "aplicaVencimiento" BOOLEAN NOT NULL DEFAULT false,
    "aplicaLote" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supply_categories_tenantId_isActive_idx" ON "supply_categories"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "supply_categories_tenantId_nombre_key" ON "supply_categories"("tenantId", "nombre");

-- CreateIndex
CREATE INDEX "supply_items_tenantId_categoriaId_idx" ON "supply_items"("tenantId", "categoriaId");

-- CreateIndex
CREATE INDEX "supply_items_tenantId_isActive_idx" ON "supply_items"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "supply_items_tenantId_codigoInterno_key" ON "supply_items"("tenantId", "codigoInterno");

-- CreateIndex
CREATE INDEX "supplier_products_tenantId_supplyItemId_idx" ON "supplier_products"("tenantId", "supplyItemId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_products_tenantId_supplierId_supplyItemId_key" ON "supplier_products"("tenantId", "supplierId", "supplyItemId");

-- AddForeignKey
ALTER TABLE "supply_items" ADD CONSTRAINT "supply_items_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "supply_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_products" ADD CONSTRAINT "supplier_products_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "supply_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
