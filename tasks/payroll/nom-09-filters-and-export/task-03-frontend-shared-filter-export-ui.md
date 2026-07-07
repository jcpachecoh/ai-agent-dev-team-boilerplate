# Task 03 — Frontend: componentes reutilizables de filtros y exportación

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]`  
**Status:** `pending`  
**Depends on:** [task-01-backend-export-contracts.md](./task-01-backend-export-contracts.md)  
**Epic:** NOM-09

---

## Goal

Crear componentes reutilizables para **barra de filtros** y **menú de exportación** (PDF / Excel) con estado de carga, reutilizables en las vistas de Nómina.

---

## Scope

### Tipos (`apps/web-app/src/features/payroll/types/`)

- `PayrollExportFormat` — reutilizar `'PDF' | 'XLSX'` de `payroll-reports.types.ts`.
- `PayrollExportFiltersBase` — campos comunes (`locationId?`, `employeeId?`, `dateFrom?`, `dateTo?`, `period?`).
- `PayrollExportColumn` — `{ key, label }` para documentar columnas visibles.

### API client (`payroll.client.ts`)

```typescript
exportEmployeeList(filters, format): Promise<Blob>
exportAttendanceReport(filters, format): Promise<Blob>
// exportPayrollReport ya existe — alinear firma con filtros extendidos
```

Helper `downloadExportBlob(blob, filename)` — extraer de `PayrollReportsScreen`.

### Componentes

**`PayrollExportMenu`**

- Props: `onExport(format)`, `loading`, `disabled`, `theme`.
- Dropdown o split button: "Exportar PDF" / "Exportar Excel".
- `aria-label` y feedback visual durante carga.

**`PayrollFilterBar`** (layout wrapper)

- Slot `filters` (children) + slot `actions` (export menu).
- Responsive: filtros en wrap en mobile.

**Hooks**

- `usePayrollExport({ buildFilters, exportFn, filenamePrefix })` — maneja loading, error toast, descarga.

### UI kit (opcional)

Si el patrón es genérico para otros módulos, evaluar ubicación en `packages/ui`. Si es específico de nómina, mantener en `features/payroll/components/`.

---

## Out of scope

- Integración en pantallas concretas (tasks 04–06).
- Nuevos endpoints backend.
- Filtros de monitor de asistencia en vivo.

---

## Files allowed

- `apps/web-app/src/features/payroll/components/PayrollExportMenu.tsx`
- `apps/web-app/src/features/payroll/components/PayrollFilterBar.tsx`
- `apps/web-app/src/features/payroll/components/PayrollExportMenu.module.scss`
- `apps/web-app/src/features/payroll/components/PayrollFilterBar.module.scss`
- `apps/web-app/src/features/payroll/hooks/usePayrollExport.ts`
- `apps/web-app/src/features/payroll/utils/download-export-blob.ts`
- `apps/web-app/src/features/payroll/api/payroll.client.ts`
- `apps/web-app/src/features/payroll/types/payroll-reports.types.ts`
- `packages/ui/src/components/**` (solo si se promueve componente genérico)

## Files forbidden

- `apps/api/**`
- `schema.prisma`
- `package.json`, `pnpm-lock.yaml`
- Pantallas de listado (task 04+)

---

## Acceptance criteria

- [ ] `PayrollExportMenu` dispara callback con formato PDF o XLSX.
- [ ] Estado loading deshabilita botones y muestra indicador.
- [ ] `usePayrollExport` descarga archivo con nombre derivado de filtros/fecha.
- [ ] Errores de API muestran `toast.error` con mensaje del servidor.
- [ ] Componentes usan CSS Modules + tokens del tema empleado/nómina.
- [ ] Sin `fetch` directo — solo funciones de `payroll.client.ts`.

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm lint
```
