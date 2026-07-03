-- CreateEnum
CREATE TYPE "RecipeComponentType" AS ENUM ('INGREDIENT', 'SUB_RECIPE', 'PACKAGING', 'SAUCE', 'TOPPING', 'DECORATION');

-- CreateEnum
CREATE TYPE "RecipeUsageUnit" AS ENUM ('GRAM', 'MILLILITER', 'UNIT', 'KILOGRAM', 'LITER', 'OUNCE');

-- CreateTable
CREATE TABLE "recipe_composition_lines" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "supplyItemId" TEXT NOT NULL,
    "componentType" "RecipeComponentType" NOT NULL,
    "usageUnit" "RecipeUsageUnit" NOT NULL,
    "grossQuantity" DECIMAL(10,3) NOT NULL,
    "netQuantity" DECIMAL(10,3) NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_composition_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipe_composition_lines_tenantId_recipeId_idx" ON "recipe_composition_lines"("tenantId", "recipeId");

-- CreateIndex
CREATE INDEX "recipe_composition_lines_recipeId_sortOrder_idx" ON "recipe_composition_lines"("recipeId", "sortOrder");

-- AddForeignKey
ALTER TABLE "recipe_composition_lines" ADD CONSTRAINT "recipe_composition_lines_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "production_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_composition_lines" ADD CONSTRAINT "recipe_composition_lines_supplyItemId_fkey" FOREIGN KEY ("supplyItemId") REFERENCES "supply_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
