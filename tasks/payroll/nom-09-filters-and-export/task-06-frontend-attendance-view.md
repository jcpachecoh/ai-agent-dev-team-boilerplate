# Task 06 — Frontend: filtros y export en asistencia (nómina)

**Domain:** `[FRONTEND]` `[WEB-APP]` `[PAYROLL]` `[ATTENDANCE]`  
**Status:** `pending`  
**Depends on:** [task-02-backend-export-endpoints.md](./task-02-backend-export-endpoints.md), [task-03-frontend-shared-filter-export-ui.md](./task-03-frontend-shared-filter-export-ui.md)  
**Epic:** NOM-09

---

## Goal

Agregar **filtros de rango de fechas, sede, empleado y estado** y **exportación PDF/Excel** en las vistas de asistencia del módulo de Nómina.

---

## Scope

### Vistas en alcance

| Vista                            | Archivo                                               | Acción                                                           |
| -------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Reporte asistencia en dashboard  | `PayrollReportsScreen` (card NOM-03)                  | Conectar export con filtros globales de task 05                  |
| Reporte asistencia dedicado      | `AttendanceReportsScreen` (si aplica en rutas nómina) | Barra filtros + export                                           |
| Tab Asistencia — perfil empleado | `PayrollEmployeeAttendanceTab`                        | Filtro rango fechas + export del historial filtrado del empleado |

### Filtros

- Rango de fechas (`from`, `to`) — default: mes en curso.
- Sede (`locationId`) — en vistas multi-empleado.
- Empleado — preseleccionado en tab de perfil (`userId` fijo).
- Estado (`PRESENT` | `ABSENT` | `LATE` | `ALL`) — según contrato task 01/02.

### Export

- Usar `exportAttendanceReport(filters, format)` de task 03.
- Columnas: empleado, sede, minutos trabajados, horas extra, alerta límite legal (alinear con `AttendanceReportEmployeeRow`).

### Fuera de monitor en vivo

- **No** modificar `AttendanceMonitorScreen` / hub NOM-06 para export (decisión epic D4).

---

## Out of scope

- Export del monitor de asistencia en tiempo real.
- Cambios en reglas de cálculo de tardanzas/HE (SHIFT-UNI / attendance backend).
- Backend endpoints (task 02).

---

## Files allowed

- `apps/web-app/src/features/payroll/screens/PayrollReportsScreen.tsx` (solo card NOM-03 / filtros asistencia)
- `apps/web-app/src/features/attendance/screens/AttendanceReportsScreen.tsx`
- `apps/web-app/src/features/payroll/components/PayrollEmployeeAttendanceTab.tsx`
- `apps/web-app/src/features/payroll/hooks/usePayrollReportQueries.ts`
- `apps/web-app/src/features/payroll/types/payroll-reports.types.ts`
- `apps/web-app/src/features/payroll/api/payroll.client.ts`
- Componentes de task 03

## Files forbidden

- `apps/api/**`
- `apps/web-app/src/features/attendance/screens/AttendanceMonitorScreen.tsx`
- `schema.prisma`
- `package.json`, `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Usuario filtra asistencia por rango y sede; tabla muestra datos filtrados.
- [ ] Export PDF/Excel desde NOM-03 respeta filtros activos del dashboard.
- [ ] Tab asistencia en perfil exporta solo marcaciones del empleado en el rango seleccionado.
- [ ] Contenido exportado = mismas filas que la vista (test manual de conteo).
- [ ] Monitor en vivo sin cambios de export.

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm lint
```

Manual: perfil empleado → tab Asistencia → filtrar última semana → export Excel → verificar fechas.
