# Task 04 — Frontend: filtro temporal consumiendo API de resumen (backend)

**Domain:** `[FRONTEND]` `[UI]`  
**Status:** `pending`  
**Depends on:** [task-03-backend-monitor-period-summary.md](./task-03-backend-monitor-period-summary.md)  
**Epic:** NOM-06

---

## Goal

Agregar en el **detalle de sede** el filtro **Día | Semana | Mes | Año** que consume `GET /attendance/locations/:locationId/monitor-summary` del backend. El frontend solo envía `period` + `anchorDate` y renderiza KPIs + listas; **sin** agregación local de logs ni cálculo de rangos de fechas para métricas.

---

## Scope

### UI (`packages/ui`)

- `AsistenciaPeriodFilter` — segmented control: Día | Semana | Mes | Año.
- Selector de fecha ancla (día/semana/mes) o año.
- Subtítulo con rango legible devuelto por API (`dateFrom`–`dateTo` + `period`).

### Web-app

- Cliente API: `getAttendanceMonitorSummary(locationId, { period, anchorDate })`.
- Hook React Query: `useAttendanceMonitorSummary(locationId, period, anchorDate)`.
- Integrar en `AttendanceLocationDetailScreen`:
  - Estado `periodPreset` + `anchorDate` (default: hoy Bogotá).
  - Al cambiar filtro → refetch del endpoint de resumen.
  - Mapear respuesta → props de `AsistenciaSedeDetail` (KPIs + secciones por categoría).
- Polling 30s **solo** si `response.isLive === true`.
- Ocultar **Registrar entrada/salida** cuando `isLive === false`.
- Utilidad FE `formatMonitorPeriodLabel(response)` — solo presentación; **no** calcular `dateFrom`/`dateTo` para datos.

### Tipos

- `apps/web-app/src/features/attendance/types/attendance.types.ts` — alinear con `AttendanceMonitorSummaryDto` del backend.

---

## Out of scope

- Cálculo de métricas o clasificación en el cliente.
- `useAttendanceHistoryQuery` para alimentar KPIs del detalle (puede quedar para debug o eliminarse si el resumen cubre todo).
- Export de reportes.
- Filtro temporal en el hub de sedes (sigue mostrando hoy).

---

## Files allowed

- `packages/ui/src/components/asistencia/**`
- `apps/web-app/src/features/attendance/**`

## Files forbidden

- `apps/api/**`
- `schema.prisma`
- `package.json`, `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] Cambiar Día/Semana/Mes/Año dispara request con `period` + `anchorDate` correctos.
- [ ] KPIs y listas provienen **exclusivamente** de `monitor-summary` (no agregación local).
- [ ] `isLive` controla polling y visibilidad de entrada/salida.
- [ ] Estados loading, error y empty del design system.
- [ ] Storybook de `AsistenciaPeriodFilter`.
- [ ] Sin util `period-range.ts` en web-app para datos (solo formato de UI si aplica).

---

## Validation commands

```bash
pnpm --filter web-app typecheck
pnpm lint
```

Manual: detalle de sede → cambiar periodos → verificar en Network que solo se llama `monitor-summary` y los totales coinciden con Postman.
