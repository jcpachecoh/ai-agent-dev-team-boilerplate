-- CreateEnum
CREATE TYPE "NoveltyType" AS ENUM (
  'INGREDIENT_SHORTAGE',
  'EQUIPMENT_FAILURE',
  'RECIPE_DEVIATION',
  'UNPLANNED_STOP',
  'SAFETY_INCIDENT',
  'QUALITY_ISSUE',
  'OTHER'
);

-- AlterTable
ALTER TABLE "production_incidents"
  ADD COLUMN "noveltyType" "NoveltyType",
  ADD COLUMN "requiresPause" BOOLEAN NOT NULL DEFAULT false;
