-- OS-588 (fase infraestructura) — `fundName` no está protegido por NOT NULL contra un
-- string vacío ('' no es NULL). Hoy la única vía de escritura pública (DTOs REST/GraphQL de
-- create/update de empleado) ya rechaza vacíos con @IsNotEmpty(), pero
-- EmployeeHistoryRepository.syncFundHistoryTx no lo revalida por su cuenta — un caller
-- interno futuro que no pase por esos DTOs podría escribir '' sin que nada lo impida.
-- Se cierra en la base de datos, igual que los CHECK de la migración anterior.
ALTER TABLE "employee_fund_history"
  ADD CONSTRAINT "employee_fund_history_fund_name_not_blank_check"
  CHECK (length(trim("fundName")) > 0);
