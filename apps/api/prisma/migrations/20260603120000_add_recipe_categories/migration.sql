-- CreateTable
CREATE TABLE "recipe_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_categories_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "production_recipes" ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "recipe_categories_tenantId_isActive_idx" ON "recipe_categories"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_categories_tenantId_nombre_key" ON "recipe_categories"("tenantId", "nombre");

-- CreateIndex
CREATE INDEX "production_recipes_tenantId_categoryId_idx" ON "production_recipes"("tenantId", "categoryId");

-- AddForeignKey
ALTER TABLE "production_recipes" ADD CONSTRAINT "production_recipes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "recipe_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
