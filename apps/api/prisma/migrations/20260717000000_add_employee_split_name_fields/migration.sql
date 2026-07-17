-- AlterTable
ALTER TABLE "employee_personal_data" ADD COLUMN     "primerNombre" TEXT,
ADD COLUMN     "segundoNombre" TEXT;

-- Backfill desde "nombres" (solo contiene nombres de pila, nunca apellidos):
-- primera palabra → primerNombre, resto → segundoNombre.
UPDATE "employee_personal_data"
SET
    "primerNombre" = split_part(btrim("nombres"), ' ', 1),
    "segundoNombre" = NULLIF(btrim(substr(btrim("nombres"), length(split_part(btrim("nombres"), ' ', 1)) + 1)), '')
WHERE "nombres" IS NOT NULL AND btrim("nombres") <> '';
