-- CreateTable
CREATE TABLE "recipes_images" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "alt" TEXT,
    "nameImage" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageObjectId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_images_tenantId_recipeId_idx" ON "recipes_images"("tenantId", "recipeId");

-- CreateIndex
CREATE INDEX "recipes_images_tenantId_recipeId_isActive_idx" ON "recipes_images"("tenantId", "recipeId", "isActive");

-- CreateIndex
CREATE INDEX "recipes_images_tenantId_isActive_idx" ON "recipes_images"("tenantId", "isActive");

-- AddForeignKey
ALTER TABLE "recipes_images" ADD CONSTRAINT "recipes_images_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "production_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
