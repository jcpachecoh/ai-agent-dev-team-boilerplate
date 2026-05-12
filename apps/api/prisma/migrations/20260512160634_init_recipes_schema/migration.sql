-- CreateEnum
CREATE TYPE "StockUnit" AS ENUM ('GRAMS', 'UNIT', 'ML', 'KILOGRAMS', 'LITERS');

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porciones" INTEGER NOT NULL,
    "notas" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "foodCostActual" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "cantidad" DECIMAL(12,4) NOT NULL,
    "unidad" "StockUnit" NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "costoPromedioPonderado" DECIMAL(12,4) NOT NULL,

    CONSTRAINT "SupplyItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recipe_tenantId_productId_idx" ON "Recipe"("tenantId", "productId");

-- CreateIndex
CREATE INDEX "RecipeItem_tenantId_supplyItemId_idx" ON "RecipeItem"("tenantId", "supplyItemId");

-- CreateIndex
CREATE INDEX "RecipeItem_tenantId_recipeId_idx" ON "RecipeItem"("tenantId", "recipeId");

-- CreateIndex
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

-- CreateIndex
CREATE INDEX "SupplyItem_tenantId_idx" ON "SupplyItem"("tenantId");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "SupplyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
