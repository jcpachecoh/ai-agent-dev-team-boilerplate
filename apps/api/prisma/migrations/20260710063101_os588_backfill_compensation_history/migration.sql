-- OS-588 (fase infraestructura) — Backfill de historial salarial y de fondos para
-- empleados existentes creados antes de que employee_salary_history / employee_fund_history
-- existieran.
--
-- Fecha de vigencia inicial (effectiveFrom): se usa la mejor fecha disponible, en este
-- orden de preferencia: contractStart -> hireDate -> createdAt. contractStart es la fecha
-- en que el contrato (y por tanto el salario/fondo vigente) tomó efecto; hireDate es el
-- respaldo natural cuando contractStart falte; createdAt es el último respaldo para
-- filas legacy sin ninguna de las dos fechas anteriores. Es la misma regla que usa el
-- código de aplicación para nuevos empleados (ver resolveInitialEffectiveDate en
-- apps/api/src/payroll/utils/employee-history-effective-date.util.ts) para no duplicar
-- la lógica entre el backfill y el flujo de creación.
--
-- Alcance: se incluyen TODOS los empleados, incluyendo inactivos y con soft-delete
-- (deletedAt IS NOT NULL). Decisión deliberada: un empleado que se retiró durante el año
-- fiscal igual generó cesantías causadas hasta su fecha de retiro, así que su historial
-- salarial/de fondos debe poder reconstruirse aunque el registro esté con soft-delete.
--
-- Idempotencia: cada INSERT usa NOT EXISTS para no duplicar filas si esta migración
-- llegara a ejecutarse más de una vez sobre el mismo entorno.

-- Backfill: historial salarial (un registro abierto por empleado)
INSERT INTO "employee_salary_history"
  ("id", "tenantId", "employeeDetailsId", "salaryType", "salaryAmount", "effectiveFrom", "effectiveTo", "changedBy", "createdAt")
SELECT
  gen_random_uuid()::text,
  ed."tenantId",
  ed."id",
  ed."salaryType",
  ed."salaryAmount",
  COALESCE(ed."contractStart", ed."hireDate", ed."createdAt"),
  NULL,
  NULL,
  NOW()
FROM "employee_details" ed
WHERE NOT EXISTS (
  SELECT 1 FROM "employee_salary_history" esh WHERE esh."employeeDetailsId" = ed."id"
);

-- Backfill: historial de fondo de cesantías (un registro abierto por empleado)
INSERT INTO "employee_fund_history"
  ("id", "tenantId", "employeeDetailsId", "fundType", "fundName", "effectiveFrom", "effectiveTo", "changedBy", "createdAt")
SELECT
  gen_random_uuid()::text,
  ed."tenantId",
  ed."id",
  'CESANTIAS_FUND',
  ed."cesantiasFundName",
  COALESCE(ed."contractStart", ed."hireDate", ed."createdAt"),
  NULL,
  NULL,
  NOW()
FROM "employee_details" ed
WHERE NOT EXISTS (
  SELECT 1 FROM "employee_fund_history" efh
  WHERE efh."employeeDetailsId" = ed."id" AND efh."fundType" = 'CESANTIAS_FUND'
);

-- Backfill: historial de fondo de pensión (un registro abierto por empleado)
INSERT INTO "employee_fund_history"
  ("id", "tenantId", "employeeDetailsId", "fundType", "fundName", "effectiveFrom", "effectiveTo", "changedBy", "createdAt")
SELECT
  gen_random_uuid()::text,
  ed."tenantId",
  ed."id",
  'PENSION_FUND',
  ed."pensionFundName",
  COALESCE(ed."contractStart", ed."hireDate", ed."createdAt"),
  NULL,
  NULL,
  NOW()
FROM "employee_details" ed
WHERE NOT EXISTS (
  SELECT 1 FROM "employee_fund_history" efh
  WHERE efh."employeeDetailsId" = ed."id" AND efh."fundType" = 'PENSION_FUND'
);
