-- Add optional package weight to production recipes (approx. kg per package)

ALTER TABLE "production_recipes" ADD COLUMN "packageWeight" DECIMAL(10,3);
