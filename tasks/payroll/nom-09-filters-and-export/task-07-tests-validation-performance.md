# Task 07 — Tests, paridad filtros y validación de performance

**Domain:** `[BACKEND]` `[FRONTEND]` `[QA]`  
**Status:** `pending`  
**Depends on:** tasks 02, 04, 05, 06  
**Epic:** NOM-09

---

## Goal

Asegurar con **tests automatizados** y validación manual que los exports respetan filtros, multi-tenant y límites de volumen, cumpliendo los criterios de aceptación del epic.

---

## Scope

### Tests backend (`apps/api/src/reports/test/`)

**Controller**

- `exportEmployeeList` — PDF y XLSX headers, filtros pasados al servicio.
- `exportAttendanceReport` — paridad con `getAttendanceReport` para mismos filtros.
- Tenant isolation — `employeeId` de otro tenant → error.
- Límite 2000 filas — mock repository con 2001 → `BadRequestException`.

**Servicios PDF/Excel**

- Magic bytes PDF (`%PDF`) y XLSX (`PK\x03\x04`) para reportes nuevos.
- Metadata incluye `filtersSummary` con sede/periodo aplicados.
- Reporte vacío (0 filas) aún genera archivo válido con mensaje "Sin resultados".

**Paridad datos**

- Test de integración: misma seed → `GET` listado vs `POST` export XLSX → mismo `rowCount` (parsear xlsx en test o comparar mock del servicio de consulta).

### Tests frontend

- `usePayrollExport` — éxito descarga blob, error muestra toast.
- `PayrollExportMenu` — dispara formato correcto.
- Test de integración ligero en `PayrollEmployeesListScreen` (mock API): export llama client con filtros del estado.

### Performance / límites

- Documentar en epic/README interno:
  - Límite síncrono: 2000 filas.
  - Tiempo objetivo: < 10s para 500 filas en staging.
- Si export > 10s en QA, abrir follow-up para job async (fuera de MVP).

### Checklist manual QA

| #   | Caso                                                                      |
| --- | ------------------------------------------------------------------------- |
| 1   | Empleados: filtro sede + export PDF = solo esa sede                       |
| 2   | Empleados: búsqueda por nombre + export Excel = mismas filas              |
| 3   | Liquidación: periodo junio + sede X = PDF totales coherentes con pantalla |
| 4   | Asistencia: rango 7 días + export = filas del rango                       |
| 5   | Usuario tenant B no accede export con `employeeId` de tenant A            |
| 6   | Export con 0 resultados → archivo válido vacío o mensaje claro            |

---

## Out of scope

- Implementación de job async BullMQ.
- Tests E2E Playwright (opcional follow-up).
- Cambios funcionales en features (solo tests y fixes mínimos para verde).

---

## Files allowed

- `apps/api/src/reports/test/**`
- `apps/web-app/src/features/payroll/**/*.test.ts`
- `apps/web-app/src/features/payroll/**/*.spec.ts`
- Fixes mínimos en archivos de tasks 02–06 **solo** si un test revela bug de paridad

## Files forbidden

- `schema.prisma`, migraciones
- `package.json`, `pnpm-lock.yaml`
- Refactors amplios no relacionados con fallos de test

---

## Acceptance criteria

- [ ] Cobertura tests nuevos en `reports` controller y servicios PDF/Excel.
- [ ] Test de aislamiento multi-tenant en export.
- [ ] Test de límite 2000 filas.
- [ ] `pnpm --filter api test -- reports` en verde.
- [ ] `pnpm --filter web-app test` en verde (tests añadidos).
- [ ] Checklist manual QA documentado y ejecutado en staging.
- [ ] Criterios de aceptación del epic NOM-09 verificados.

---

## Validation commands

```bash
pnpm --filter api typecheck
pnpm --filter api test -- reports
pnpm --filter web-app typecheck
pnpm --filter web-app test
pnpm lint
node scripts/validate-structure.js
```

Cobertura API (si aplica al módulo):

```bash
pnpm --filter api test -- --coverage --collectCoverageFrom='src/reports/**/*.ts'
```
