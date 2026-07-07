# Task 05 — Frontend: filtros y export en reportes / liquidaciones

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]`  
**Status:** `pending`  
**Depends on:** [task-02-backend-export-endpoints.md](./task-02-backend-export-endpoints.md), [task-03-frontend-shared-filter-export-ui.md](./task-03-frontend-shared-filter-export-ui.md)  
**Epic:** NOM-09

---

## Goal

Exponer **filtros de periodo, sede y empleado** en la pantalla de reportes de nómina (`/payroll`) y habilitar exportación PDF/Excel para **NOM-01 (empleados)**, **NOM-02 (contratos)** y **NOM-04 (liquidación)**, reemplazando los toasts "próximamente".

---

## Scope

### Pantalla `PayrollReportsScreen`

**Filtros globales** (afectan KPIs y exports):

- Periodo de nómina (`YYYY-MM`) — selector mes/año (hoy hardcodeado a mes actual).
- Sede (`locationId`) — opcional, "Todas las sedes".
- Empleado (`employeeId`) — opcional, autocomplete/búsqueda.

Al cambiar filtros → refetch `usePayrollReportQuery` y queries de asistencia con mismos criterios.

### Report cards (`NominaReportDefinition`)

| ID                           | Acción                                                              |
| ---------------------------- | ------------------------------------------------------------------- |
| `nom-01`                     | Export empleados del periodo/contexto → PDF / XLSX                  |
| `nom-02`                     | Export contratos vigentes filtrados → PDF / XLSX                    |
| `nom-03`                     | Delegar a task 06 (asistencia) o enlace con mismos filtros de fecha |
| `nom-04-pdf` / `nom-04-xlsx` | Pasar `locationId`, `employeeId` al `exportPayrollReport` existente |

### Refactor

- Extraer `downloadBlob` a util de task 03.
- Unificar manejo de errores con `usePayrollExport`.

### KPIs y gráficos

- Deben reflejar filtros de sede/empleado cuando el backend lo soporte; si el API de reporte aún es solo por periodo, documentar limitación y filtrar solo en export hasta extensión BE.

---

## Out of scope

- Rediseño completo del dashboard `NominaDashboardPreview`.
- Nuevos tipos de reporte más allá de NOM-01–04.
- Tab pagos del perfil de empleado (liquidaciones individuales).

---

## Files allowed

- `apps/web-app/src/features/payroll/screens/PayrollReportsScreen.tsx`
- `apps/web-app/src/features/payroll/screens/PayrollReportsScreen.module.scss`
- `apps/web-app/src/features/payroll/hooks/usePayrollReportQueries.ts`
- `apps/web-app/src/features/payroll/utils/mapPayrollReportToNomina.ts` (solo si hace falta mapeo de filtros)
- `apps/web-app/src/features/payroll/api/payroll.client.ts`
- `apps/web-app/src/features/payroll/types/payroll-reports.types.ts`
- Componentes de task 03

## Files forbidden

- `apps/api/**`
- `schema.prisma`
- `package.json`, `pnpm-lock.yaml`
- `packages/ui/**` (salvo consumo de componentes existentes)

---

## Acceptance criteria

- [ ] Usuario selecciona periodo y sede; KPIs y exports usan esos filtros.
- [ ] NOM-01 y NOM-02 exportan PDF y Excel (ya no toast "próximamente").
- [ ] NOM-04 PDF/Excel incluyen `locationId`/`employeeId` cuando están seleccionados.
- [ ] PDF de liquidación muestra resumen de filtros aplicados en encabezado (validar con backend task 02).
- [ ] Estados loading durante descarga en cada card de reporte.

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm lint
```

Manual: `/payroll` → elegir sede → descargar NOM-04 PDF → verificar totales solo de esa sede.
