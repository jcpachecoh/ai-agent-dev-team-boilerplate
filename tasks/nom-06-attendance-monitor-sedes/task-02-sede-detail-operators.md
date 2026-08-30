# Task 02 — Detalle de sede: operarios por categoría (lista y cards)

**Domain:** `[FRONTEND]` `[UI]`  
**Status:** `pending`  
**Depends on:** [task-01-sede-hub-list-cards.md](./task-01-sede-hub-list-cards.md)  
**Epic:** NOM-06

---

## Goal

Implementar la pantalla de **detalle por sede** donde, al ingresar desde el hub, se muestran los operarios agrupados en **en turno**, **ausentes**, **llegadas tarde** y **horas extra**, cada grupo con opción de vista **lista** o **cards**.

---

## Scope

### UI (`packages/ui`)

- Crear `AsistenciaSedeDetail` — layout de detalle: header con nombre de sede, KPIs, leyenda, toggle lista/cards.
- Crear `AsistenciaCategorySection` — sección colapsable o con tabs internos por categoría.
- Reutilizar `AsistenciaEmployeeCard`, `AsistenciaEmployeeListRow`, `AsistenciaViewToggle`.
- Extender `AsistenciaEmployeeStatus` o agregar `AsistenciaEmployeeCategory` si hace falta para tarde (`late`).

### Web-app

- Crear `AttendanceLocationDetailScreen.tsx` en `features/attendance/screens/`.
- Ruta: `/payroll/attendance/:locationId`.
- Migrar lógica actual de `AttendanceMonitorScreen` (active, history, overtime) al detalle.
- Clasificar empleados en las 4 categorías según reglas del epic:
  - **En turno:** `activeQuery` + ENTRY sin EXIT.
  - **Ausente:** sin entrada en el día (o en rango si Task 03 ya está).
  - **Llegada tarde:** ENTRY después de inicio de turno + tolerancia 5 min (`SHIFT_*_START` en `attendance.constants.ts`).
  - **Horas extra:** `overtimeMinutes > 0`.
- Un empleado puede aparecer en más de una categoría visual (ej. en turno + HE); priorizar badge principal en card.
- Toggle lista/cards global para todas las secciones (una preferencia `restopsiq.attendance.employeeViewMode`).
- Botón **Volver a sedes** → `/payroll/attendance`.
- Mantener acciones **Sincronizar**, **Registrar entrada/salida** en detalle (solo día actual).

### Mapper

- Extraer funciones puras a `features/attendance/mappers/monitor.mappers.ts` (clasificación, labels, duración).

---

## Out of scope

- Filtro día/semana/mes/año y resumen agregado (Tasks 03–04 — **backend** + FE).
- Clasificación multi-día y agregación por periodo en backend (Task 03).
- En esta tarea usar **hoy** como rango fijo (puede llamar lógica local temporal hasta existir `monitor-summary`).
- Tests E2E completos (opcional unit tests de mappers).

---

## Files allowed

- `packages/ui/src/components/asistencia/**`
- `apps/web-app/src/features/attendance/**`
- `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx`

## Files forbidden

- `apps/api/**`
- `schema.prisma`
- `package.json`, `pnpm-lock.yaml`

---

## Acceptance criteria

- [ ] `/payroll/attendance/:locationId` carga sede válida o muestra 404/not found amigable.
- [ ] Cuatro secciones visibles: En turno, Ausentes, Llegadas tarde, Horas extra.
- [ ] Toggle lista/cards aplica a todas las secciones.
- [ ] Métricas del header coinciden con conteos de las secciones.
- [ ] Llegada tarde se calcula con tolerancia documentada en código.
- [ ] Volver al hub preserva preferencia de vista del hub.
- [ ] `AttendanceMonitorScreen` queda solo como hub (sin lógica duplicada de empleados).

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter web-app typecheck
pnpm lint
```

Manual: sede con seed de asistencia → verificar categorías y toggle lista/cards.
