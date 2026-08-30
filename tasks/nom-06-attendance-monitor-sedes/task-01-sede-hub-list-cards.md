# Task 01 — Hub de sedes (lista y cards)

**Domain:** `[FRONTEND]` `[UI]`  
**Status:** `pending`  
**Depends on:** [00-epic-and-decisions.md](./00-epic-and-decisions.md), NOM-05  
**Epic:** NOM-06

---

## Goal

Reemplazar las tabs horizontales de sedes por un **hub inicial** que muestre todas las sedes activas del tenant en vista **lista** o **cards**, con métricas resumidas y navegación al detalle de cada sede.

---

## Scope

### UI (`packages/ui`)

- Crear `AsistenciaLocationCard` — card clickeable con nombre, ciudad, KPIs mini (en turno / ausentes / tarde / HE).
- Crear `AsistenciaLocationList` + `AsistenciaLocationListRow` — fila equivalente a la card.
- Crear `AsistenciaLocationHub` — composición: header, toggle lista/cards, grid o lista de sedes.
- Extender `asistencia-types.ts` con `AsistenciaLocationSummary` (id, name, city, metrics por sede).

### Web-app

- Refactorizar `AttendanceMonitorScreen` para renderizar solo el **hub** en `/payroll/attendance`.
- Cargar sedes con `useLocations()` (activas) y métricas por sede vía queries de asistencia (history del día + active por `locationId`).
- Al hacer clic en sede → `navigate('/payroll/attendance/:locationId')`.
- Toggle lista/cards con persistencia en `sessionStorage` (`restopsiq.attendance.locationViewMode`).

### Rutas

- Actualizar `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx`:
  - `attendance` → hub
  - `attendance/:locationId` → placeholder vacío hasta Task 02 (o ruta stub)

---

## Out of scope

- Detalle de operarios por categoría (Task 02).
- Filtro día/semana/mes/año (Task 03).
- Nuevos endpoints REST.
- Modificar `AsistenciaMonitorPreview` monolítico más allá de extraer piezas reutilizables.

---

## Files allowed

- `packages/ui/src/components/asistencia/**`
- `apps/web-app/src/features/attendance/**`
- `apps/web-app/src/pages/PayrollPage/PayrollPage.tsx`

## Files forbidden

- `apps/api/**`
- `schema.prisma`
- `package.json`, `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `packages/` fuera de `packages/ui/src/components/asistencia/**`

---

## Acceptance criteria

- [ ] `/payroll/attendance` muestra todas las sedes activas del tenant (no solo las con logs del día).
- [ ] Toggle lista/cards cambia el layout sin recargar la página.
- [ ] Cada sede muestra al menos: nombre, ciudad, conteo en turno y ausentes (tarde/HE si hay datos).
- [ ] Clic en sede navega a `/payroll/attendance/:locationId`.
- [ ] Estados loading, error y empty (sin sedes) manejados con patrones del design system.
- [ ] Storybook stories para `AsistenciaLocationHub`, card y list row.

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter web-app typecheck
pnpm lint
```

Manual: login con rol nómina → Monitor de asistencia → verificar hub lista/cards y navegación.
