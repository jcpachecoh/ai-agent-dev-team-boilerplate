-- CreateEnum
CREATE TYPE "RecipeType" AS ENUM ('FINAL_PRODUCT', 'SUB_RECIPE', 'BASE_PRODUCTION', 'COMBO', 'SIDE');

-- CreateEnum
CREATE TYPE "RecipeLifecycleStatus" AS ENUM ('TRIAL', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OperationCenter" AS ENUM ('PLANT', 'LOCATION', 'ALL');

-- CreateEnum
CREATE TYPE "TechnicalResponsible" AS ENUM ('CHEF', 'PRODUCTION', 'QUALITY');

-- CreateEnum
CREATE TYPE "RecipeAllergen" AS ENUM ('GLUTEN', 'DAIRY', 'EGG', 'NUTS');

-- CreateEnum
CREATE TYPE "BatchDisplayUnit" AS ENUM ('UNIT', 'PORTION', 'KILOGRAM', 'LITER', 'TRAY', 'BATCH');

-- AlterTable recipe_categories
ALTER TABLE "recipe_categories" ADD COLUMN "codePrefix" TEXT NOT NULL DEFAULT 'REC';
ALTER TABLE "recipe_categories" ADD COLUMN "codeSequence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable production_recipes
ALTER TABLE "production_recipes" ADD COLUMN "code" TEXT;
ALTER TABLE "production_recipes" ADD COLUMN "recipeType" "RecipeType";
ALTER TABLE "production_recipes" ADD COLUMN "batchDisplayUnit" "BatchDisplayUnit";
ALTER TABLE "production_recipes" ADD COLUMN "packageWeightGrams" INTEGER;
ALTER TABLE "production_recipes" ADD COLUMN "expectedYield" DECIMAL(10,2);
ALTER TABLE "production_recipes" ADD COLUMN "expectedYieldUnit" TEXT;
ALTER TABLE "production_recipes" ADD COLUMN "lifecycleStatus" "RecipeLifecycleStatus" NOT NULL DEFAULT 'TRIAL';
ALTER TABLE "production_recipes" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "production_recipes" ADD COLUMN "operationCenter" "OperationCenter";
ALTER TABLE "production_recipes" ADD COLUMN "technicalResponsible" "TechnicalResponsible";
ALTER TABLE "production_recipes" ADD COLUMN "allergens" "RecipeAllergen"[] DEFAULT ARRAY[]::"RecipeAllergen"[];
ALTER TABLE "production_recipes" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "production_recipes" ALTER COLUMN "finishedProductId" DROP NOT NULL;

-- Backfill category prefixes
UPDATE "recipe_categories"
SET "codePrefix" = CASE
  WHEN lower("nombre") LIKE '%cocina%' THEN 'COC'
  WHEN lower("nombre") LIKE '%panader%' THEN 'PAN'
  WHEN lower("nombre") LIKE '%bebida%' THEN 'BEB'
  WHEN lower("nombre") LIKE '%postre%' THEN 'POS'
  WHEN lower("nombre") LIKE '%combo%' THEN 'COM'
  ELSE upper(left(regexp_replace("nombre", '[^a-zA-Z]', '', 'g'), 3))
END
WHERE "codePrefix" = 'REC';

-- Backfill lifecycle from legacy isActive
UPDATE "production_recipes"
SET "lifecycleStatus" = CASE
  WHEN "isActive" = true THEN 'ACTIVE'::"RecipeLifecycleStatus"
  ELSE 'INACTIVE'::"RecipeLifecycleStatus"
END;

-- Backfill legacy codes
WITH numbered AS (
  SELECT
    pr.id,
    pr."tenantId",
    COALESCE(rc."codePrefix", 'LEG') AS prefix,
    row_number() OVER (
      PARTITION BY pr."tenantId", COALESCE(rc."codePrefix", 'LEG')
      ORDER BY pr."createdAt", pr.id
    ) AS seq
  FROM "production_recipes" pr
  LEFT JOIN "recipe_categories" rc ON rc.id = pr."categoryId"
  WHERE pr.code IS NULL
)
UPDATE "production_recipes" pr
SET code = numbered.prefix || '-' || lpad(numbered.seq::text, 4, '0')
FROM numbered
WHERE pr.id = numbered.id;

-- Sync category sequences from backfilled codes
UPDATE "recipe_categories" rc
SET "codeSequence" = sub.max_seq
FROM (
  SELECT pr."categoryId", MAX(CAST(split_part(pr.code, '-', 2) AS INTEGER)) AS max_seq
  FROM "production_recipes" pr
  WHERE pr."categoryId" IS NOT NULL AND pr.code ~ '-[0-9]+$'
  GROUP BY pr."categoryId"
) sub
WHERE rc.id = sub."categoryId";

-- Backfill grams from kg when missing
UPDATE "production_recipes"
SET "packageWeightGrams" = ROUND(COALESCE("packageWeight", 0) * 1000)::INTEGER
WHERE "packageWeightGrams" IS NULL AND "packageWeight" IS NOT NULL;

-- CreateTable production_recipe_locations
CREATE TABLE "production_recipe_locations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "production_recipe_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable recipe_status_history
CREATE TABLE "recipe_status_history" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "fromStatus" "RecipeLifecycleStatus",
    "toStatus" "RecipeLifecycleStatus" NOT NULL,
    "changedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_categories_tenantId_codePrefix_key" ON "recipe_categories"("tenantId", "codePrefix");

CREATE UNIQUE INDEX "production_recipes_tenantId_code_key" ON "production_recipes"("tenantId", "code");

CREATE UNIQUE INDEX "production_recipes_tenantId_categoryId_name_key" ON "production_recipes"("tenantId", "categoryId", "name");

CREATE INDEX "production_recipes_tenantId_lifecycleStatus_idx" ON "production_recipes"("tenantId", "lifecycleStatus");

CREATE UNIQUE INDEX "production_recipe_locations_recipeId_locationId_key" ON "production_recipe_locations"("recipeId", "locationId");

CREATE INDEX "production_recipe_locations_tenantId_idx" ON "production_recipe_locations"("tenantId");

CREATE INDEX "production_recipe_locations_locationId_idx" ON "production_recipe_locations"("locationId");

CREATE INDEX "recipe_status_history_tenantId_recipeId_idx" ON "recipe_status_history"("tenantId", "recipeId");

CREATE INDEX "recipe_status_history_recipeId_createdAt_idx" ON "recipe_status_history"("recipeId", "createdAt");

-- AddForeignKey
ALTER TABLE "production_recipe_locations" ADD CONSTRAINT "production_recipe_locations_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "production_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "production_recipe_locations" ADD CONSTRAINT "production_recipe_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "recipe_status_history" ADD CONSTRAINT "recipe_status_history_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "production_recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
