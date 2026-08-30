# NOM-09 — Filtros y exportación (PDF / Excel) en módulo de Nómina

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[REPORTS]`  
**Status:** `pending`  
**Created:** 2026-07-07  
**Módulo NestJS:** `apps/api/src/reports/` (extender) + `apps/api/src/payroll/` (consultas de empleados)  
**UI kit:** `packages/ui` (toolbar reutilizable) + `apps/web-app/src/features/payroll/**`

---

## Objetivo

Agregar **filtros de búsqueda/consulta** en las vistas principales del módulo de Nómina y permitir la **exportación de los resultados filtrados** en formato **PDF** y **Excel (XLSX)**.

Los archivos exportados deben reflejar **exactamente** los filtros aplicados en pantalla (no toda la data sin filtrar) y respetar el contexto **multi-tenant** del usuario autenticado.

---

## Historia de usuario

**Como** usuario de Nómina (RRHH / Admin),  
**quiero** filtrar empleados, liquidaciones y asistencia por periodo, sede, empleado y estado,  
**para** consultar la información relevante y exportarla a PDF o Excel con los mismos criterios que veo en pantalla.

---

## Alcance funcional

### Filtros (vistas principales)

| Vista                    | Ruta                                                         | Filtros                                                                        |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Listado de empleados     | `/payroll/employees`                                         | Sede, cargo/área, empleado (búsqueda), tipo contrato, estado activo/inactivo   |
| Reportes / liquidaciones | `/payroll`                                                   | Periodo de nómina (`YYYY-MM`), sede, empleado (opcional)                       |
| Asistencia del periodo   | `/payroll` (tab asistencia) + perfil empleado tab Asistencia | Rango de fechas, sede, empleado, estado (presente/ausente/tarde según reporte) |

> **Nota:** El monitor de asistencia en tiempo real (`/payroll/attendance`) queda fuera de este epic salvo que se requiera export del resumen filtrado — ver decisión D4.

### Exportación

En cada vista filtrable, botón **Exportar** con menú:

- **PDF** — reporte legible con encabezado (nombre tenant/sede), resumen de filtros aplicados y tabla de resultados.
- **Excel (XLSX)** — datos tabulares con las **mismas columnas visibles** en la vista, sin columnas ocultas adicionales.

---

## Estado actual (codebase)

| Área               | Hoy                                                                                                     | Gap                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Reportes nómina    | `POST /reports/payroll/export` — PDF/XLSX por `period` (+ `locationId`, `employeeId` opcionales en DTO) | Solo liquidación mensual agregada; sin export de listado de empleados ni asistencia filtrada |
| PDF / Excel        | `ReportPdfService` (pdfkit), `ReportExcelService` (exceljs) en `apps/api/src/reports/`                  | Reutilizar patrón; falta plantillas por tipo de vista                                        |
| Empleados FE       | `usePayrollEmployeesFilters` — sede, contrato, estado, búsqueda local, paginación                       | Sin export; búsqueda por texto no va al backend; faltan filtros cargo/área en API            |
| Reportes FE        | `PayrollReportsScreen` — export PDF/XLSX solo NOM-04 (liquidación)                                      | NOM-01/02/03 muestran toast "próximamente"; filtros de sede/empleado no expuestos en UI      |
| Asistencia reporte | `GET /reports/attendance?from&to&locationId`                                                            | Sin export PDF/XLSX; sin filtros empleado/estado                                             |
| Multi-tenant       | `tenantId` desde JWT en controllers de reports                                                          | Export debe usar **mismos** filtros + `tenantId` del actor; nunca `tenantId` en body         |

### Archivos relevantes

- `apps/api/src/reports/controller/reports.controller.ts`
- `apps/api/src/reports/service/report-pdf.service.ts`
- `apps/api/src/reports/service/report-excel.service.ts`
- `apps/api/src/reports/controller/dto/report-query.dto.ts`
- `apps/api/src/reports/controller/dto/export-payroll-report.dto.ts`
- `apps/web-app/src/features/payroll/screens/PayrollEmployeesListScreen.tsx`
- `apps/web-app/src/features/payroll/screens/PayrollReportsScreen.tsx`
- `apps/web-app/src/features/payroll/hooks/usePayrollEmployeesFilters.ts`
- `apps/web-app/src/features/payroll/api/payroll.client.ts`

---

## Decisiones de diseño

### D1 — Un contrato de filtros por dominio de export

No un único mega-DTO para todo el módulo. Tres familias alineadas con las vistas:

1. `EmployeeListExportQueryDto` — listado de empleados.
2. `PayrollSettlementExportQueryDto` — extiende `PeriodQueryDto` existente (liquidación / pagos).
3. `AttendanceExportQueryDto` — extiende `AttendanceQueryDto` existente.

Cada export recibe `format: PDF | XLSX` y los filtros de su vista. El servicio de export **reutiliza el mismo método de consulta** que alimenta la vista (repository/service), no una query paralela con reglas distintas.

### D2 — Paridad pantalla ↔ export

- La UI serializa el estado de filtros actual a query params / body de export.
- Si la vista está paginada, el export incluye **todos** los registros que coinciden con los filtros (sin paginación), respetando un límite de seguridad (ver D5).
- Columnas exportadas = columnas visibles en la tabla activa (configurable por vista vía `ExportColumnDefinition[]`).

### D3 — Reutilizar módulo `reports`

Nuevos endpoints bajo `ReportsController` (o sub-rutas dedicadas) en lugar de crear módulo nuevo:

```
POST /reports/employees/export
POST /reports/payroll/export          (existente — extender filtros en UI)
POST /reports/attendance/export       (nuevo)
```

### D4 — Monitor de asistencia en vivo

`/payroll/attendance` (hub/detalle NOM-06) **no** es objetivo de esta epic salvo export del **reporte de asistencia por periodo** ya expuesto en reportes. El export del monitor en tiempo real queda **out of scope**.

### D5 — Performance y volúmenes grandes

| Umbral        | Comportamiento MVP                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------- |
| ≤ 2 000 filas | Export síncrono (stream/buffer) — respuesta inmediata                                              |
| > 2 000 filas | `413` o `202` + job async (BullMQ) — **solo si** se detecta necesidad en QA; documentar en task 07 |

MVP: límite duro en repository (`take: 2000`) con mensaje claro al usuario si se excede.

### D6 — Multi-tenant

- `tenantId` siempre del JWT (`@CurrentUser()` / `ReportsActor`).
- Filtro `locationId` validado contra sedes del tenant.
- `employeeId` validado que pertenezca al tenant antes de exportar.

### D7 — Componente FE reutilizable

`PayrollExportToolbar` en `packages/ui` o `apps/web-app/src/features/payroll/components/`:

- Slot para filtros (children).
- Botón **Exportar** con dropdown PDF / Excel.
- Estados: idle, loading, error.
- Deshabilitado si no hay datos o filtros inválidos.

---

## Subtareas

| #   | Archivo                                                                                      | Descripción                                                      |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 01  | [task-01-backend-export-contracts.md](./task-01-backend-export-contracts.md)                 | DTOs, interfaces y contrato de columnas/filtros compartidos      |
| 02  | [task-02-backend-export-endpoints.md](./task-02-backend-export-endpoints.md)                 | Endpoints employees + attendance export; extender payroll export |
| 03  | [task-03-frontend-shared-filter-export-ui.md](./task-03-frontend-shared-filter-export-ui.md) | Componente reutilizable de filtros + menú exportación            |
| 04  | [task-04-frontend-employees-view.md](./task-04-frontend-employees-view.md)                   | Filtros completos + export en listado de empleados               |
| 05  | [task-05-frontend-reports-payments-view.md](./task-05-frontend-reports-payments-view.md)     | Filtros + export NOM-01/02/04 en reportes/liquidaciones          |
| 06  | [task-06-frontend-attendance-view.md](./task-06-frontend-attendance-view.md)                 | Filtros + export asistencia (reportes + tab perfil)              |
| 07  | [task-07-tests-validation-performance.md](./task-07-tests-validation-performance.md)         | Tests BE/FE, paridad filtros, límites y validación final         |

---

## Criterios de aceptación (epic)

- [ ] El usuario puede aplicar filtros (fecha/periodo, sede, empleado, cargo/área, estado) en las vistas del módulo de Nómina en alcance.
- [ ] El usuario puede exportar los resultados filtrados a **PDF**.
- [ ] El usuario puede exportar los resultados filtrados a **Excel (XLSX)**.
- [ ] El contenido exportado coincide exactamente con los datos filtrados en pantalla (mismas filas y columnas visibles).
- [ ] La exportación respeta el contexto multi-tenant del usuario autenticado.
- [ ] Estados de carga y error visibles durante la exportación.

---

## Orden de implementación

```
01 → 02 → 03 → 04 → 05 → 06 → 07
```

La task **03** puede iniciarse en paralelo con **02** una vez definidos los contratos de **01**. Las tasks **04–06** dependen de **02** y **03**.

---

## Fuera de alcance (epic)

- Export del monitor de asistencia en vivo (NOM-06 hub/detalle).
- Cambios a `schema.prisma` o nuevas entidades.
- Envío de export por email o almacenamiento en S3 (solo descarga directa).
- Internacionalización de encabezados de reporte (es-CO únicamente en MVP).
