-- Add prefijo column for supply category SKU prefixes (e.g. ACF-000001)
ALTER TABLE "supply_categories" ADD COLUMN "prefijo" TEXT;

-- Backfill from category name (first 3 alphanumeric chars, uppercase)
WITH base AS (
  SELECT
    id,
    "tenantId",
    UPPER(SUBSTRING(REGEXP_REPLACE(nombre, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3)) AS base_prefijo,
    "createdAt"
  FROM supply_categories
),
ranked AS (
  SELECT
    id,
    "tenantId",
    CASE
      WHEN base_prefijo IS NULL OR base_prefijo = '' THEN 'CAT'
      ELSE base_prefijo
    END AS base_prefijo,
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId",
      CASE
        WHEN base_prefijo IS NULL OR base_prefijo = '' THEN 'CAT'
        ELSE base_prefijo
      END
      ORDER BY "createdAt", id
    ) AS rn
  FROM base
)
UPDATE supply_categories sc
SET prefijo = CASE
  WHEN r.rn = 1 THEN r.base_prefijo
  ELSE r.base_prefijo || r.rn::text
END
FROM ranked r
WHERE sc.id = r.id;

ALTER TABLE "supply_categories" ALTER COLUMN "prefijo" SET NOT NULL;

CREATE UNIQUE INDEX "supply_categories_tenantId_prefijo_key" ON "supply_categories"("tenantId", "prefijo");
