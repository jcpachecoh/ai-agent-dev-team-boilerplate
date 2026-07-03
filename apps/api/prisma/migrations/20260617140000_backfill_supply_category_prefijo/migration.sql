-- Idempotent backfill when prefijo column exists but rows are still NULL (e.g. partial migrate / db push).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'supply_categories'
      AND column_name = 'prefijo'
  ) THEN
    WITH base AS (
      SELECT
        id,
        "tenantId",
        UPPER(SUBSTRING(REGEXP_REPLACE(nombre, '[^a-zA-Z0-9]', '', 'g') FROM 1 FOR 3)) AS base_prefijo,
        "createdAt"
      FROM supply_categories
      WHERE prefijo IS NULL OR prefijo = ''
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
  END IF;
END $$;
