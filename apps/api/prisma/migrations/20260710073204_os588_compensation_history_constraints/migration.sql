-- OS-588 (fase infraestructura) — endurece a nivel de base de datos dos invariantes que
-- hasta ahora solo garantizaba el código de aplicación (EmployeeHistoryRepository):
--
-- 1. Rango de vigencia no invertido: effectiveTo, si existe, no puede ser anterior a
--    effectiveFrom. Mismo patrón que "employee_shift_assignments_effective_range_check"
--    (migración 20260706160000_shift_uni_employee_assignment).
-- 2. employee_fund_history.fundType solo admite CESANTIAS_FUND | PENSION_FUND. Prisma no
--    soporta subconjuntos de enum en el schema, así que se restringe con CHECK en vez de
--    dejarlo solamente en el tipo TypeScript de la capa de aplicación (que no protege
--    contra un INSERT hecho fuera del repository). Mismo patrón que
--    "turno_assignments_type_turno_check" (migración 20260703130000_os_582_turno_assignment_type).

ALTER TABLE "employee_salary_history"
  ADD CONSTRAINT "employee_salary_history_effective_range_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");

ALTER TABLE "employee_fund_history"
  ADD CONSTRAINT "employee_fund_history_effective_range_check"
  CHECK ("effectiveTo" IS NULL OR "effectiveTo" >= "effectiveFrom");

ALTER TABLE "employee_fund_history"
  ADD CONSTRAINT "employee_fund_history_fund_type_check"
  CHECK ("fundType" IN ('CESANTIAS_FUND', 'PENSION_FUND'));