-- OS-595 hotfix: la migración de formato dejó el unique viejo
-- (tenantId, periodHealth, version) porque usaba DROP CONSTRAINT sobre un INDEX.
-- Eso bloquea XLSX v1 cuando ya existe TXT v1 del mismo período.

DROP INDEX IF EXISTS "pila_period_exports_tenantId_periodHealth_version_key";
