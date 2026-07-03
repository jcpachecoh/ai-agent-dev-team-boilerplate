# NOM-06 — Monitor de asistencia por sede (hub + detalle + filtros)

**Domain:** `[FRONTEND]` `[BACKEND]` `[WEB-APP]` `[UI]` `[ATTENDANCE]`  
**Status:** `pending`  
**Entry route:** `/payroll/attendance` → `AttendanceMonitorScreen`  
**UI kit:** `packages/ui/src/components/asistencia/*`  
**API existente:** `apps/api/src/attendance/*` (REST: history, active, overtime)  
**Depends on:** NOM-03 (kiosk + attendance logs), NOM-05 (acceso rol Nómina), sedes (`useLocations`)

---

## Objetivo

Reorganizar el **Monitor de Asistencia** en dos niveles de navegación:

1. **Hub de sedes** — listado de todas las sedes del tenant en vista **lista** o **cards**, con KPIs resumidos por sede.
2. **Detalle de sede** — al seleccionar una sede, mostrar operarios clasificados en **en turno**, **ausentes**, **llegadas tarde** y **horas extra**, con toggle **lista / cards**.
3. **Filtro temporal** — en el detalle, consultar resumen por **día**, **semana**, **mes** y **año** vía **API backend** (sin agregación en el cliente).

---

## Estado actual (codebase)

| Área          | Hoy                                                            | Gap                                                                              |
| ------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Ruta          | `/payroll/attendance` — pantalla única                         | Sin ruta de detalle por sede                                                     |
| Sedes         | `AsistenciaLocationTabs` (tabs horizontales)                   | No hay hub lista/cards de sedes                                                  |
| Operarios     | `AsistenciaViewToggle` lista/grid solo en empleados            | Falta secciones por categoría (tarde, HE)                                        |
| Fecha         | `dateFrom`/`dateTo` fijados a **hoy** en FE                    | Sin filtro día/semana/mes/año; sin endpoint de resumen agregado                  |
| Llegada tarde | `offSchedule` siempre `0`; status solo `on-shift` / `absent`   | No se calcula tarde vs turno                                                     |
| Backend       | `GET /attendance` (logs crudos, `limit≤100`), overtime por día | Falta `GET /attendance/locations/:id/monitor-summary` con agregación por periodo |

### Archivos relevantes

- `apps/web-app/src/features/attendance/screens/AttendanceMonitorScreen.tsx`
- `packages/ui/src/components/asistencia/asistencia-monitor-preview/AsistenciaMonitorPreview.tsx`
- `apps/api/src/attendance/controller/dto/list-attendance-query.dto.ts`
- `apps/api/src/attendance/attendance.constants.ts` (`SHIFT_*_START` para turnos)

---

## Decisiones de diseño

### Navegación

- **Hub:** `/payroll/attendance` — grid/lista de sedes.
- **Detalle:** `/payroll/attendance/:locationId` — operarios de la sede seleccionada.
- Breadcrumb o botón **Volver a sedes** en detalle.
- Persistir preferencia de vista (lista/cards) en `sessionStorage` por pantalla.

### Clasificación de operarios (detalle)

| Categoría     | Regla MVP (implementar en **backend**, Task 03)                                             |
| ------------- | ------------------------------------------------------------------------------------------- |
| En turno      | Usuario con sesión activa (`GET /attendance/active`) o último evento ENTRY sin EXIT del día |
| Ausente       | Empleados asignados a la sede sin entrada en el rango seleccionado                          |
| Llegada tarde | ENTRY del día posterior al inicio del `AttendanceShift` del log + tolerancia (ej. 5 min)    |
| Horas extra   | `overtimeMinutes > 0` en resumen de overtime del usuario                                    |

> **Nota:** Si no hay roster de empleados por sede en API, usar empleados con al menos un `AttendanceLog` en el rango o los que aparecen en history del día — documentar fuente en Task 02.

### Filtro temporal (detalle) — **responsabilidad backend**

El cliente envía `period` + `anchorDate`. El servidor resuelve el rango y devuelve KPIs + empleados clasificados.

**Endpoint propuesto:**

```
GET /api/attendance/locations/:locationId/monitor-summary
  ?period=day|week|month|year
  &anchorDate=YYYY-MM-DD
```

| Preset | Resolución en servidor (`America/Bogota`)            |
| ------ | ---------------------------------------------------- |
| Día    | `anchorDate`                                         |
| Semana | Lunes–domingo de la semana que contiene `anchorDate` |
| Mes    | Primer y último día del mes                          |
| Año    | 1 ene – 31 dic del año                               |

- Respuesta incluye `dateFrom`, `dateTo`, `isLive` (true solo si `period=day` y `anchorDate=hoy`).
- KPIs y listas (`onShift`, `absent`, `late`, `overtime`) calculados en `AttendanceMonitorSummaryService`.
- Frontend: solo renderiza; polling 30s cuando `isLive=true`.

### UI

- Reutilizar tokens y componentes `asistencia/*` existentes.
- Nuevos componentes sugeridos: `AsistenciaLocationCard`, `AsistenciaLocationList`, `AsistenciaPeriodFilter`, `AsistenciaCategorySection`.
- No inline styles; CSS Modules + SCSS tokens.

---

## Subtareas

| #   | Archivo                                                                                  | Descripción                                             |
| --- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | [task-01-sede-hub-list-cards.md](./task-01-sede-hub-list-cards.md)                       | Hub de sedes con vista lista/cards y KPIs por sede      |
| 2   | [task-02-sede-detail-operators.md](./task-02-sede-detail-operators.md)                   | Detalle por sede: categorías + lista/cards (día actual) |
| 3   | [task-03-backend-monitor-period-summary.md](./task-03-backend-monitor-period-summary.md) | API `monitor-summary` con periodo día/semana/mes/año    |
| 4   | [task-04-frontend-period-filter.md](./task-04-frontend-period-filter.md)                 | Filtro UI consumiendo API backend                       |

**Orden de implementación:** 1 → 2 → 3 → 4 (Task 04 depende del endpoint de Task 03).

---

## Criterio de éxito del epic

- Usuario entra a Monitor → ve todas las sedes activas en lista o cards.
- Al abrir una sede → ve operarios agrupados (turno, ausentes, tarde, HE) en lista o cards.
- Puede cambiar filtro día/semana/mes/año; el **backend** devuelve totales y listas del rango.
- Rutas protegidas por RBAC de nómina (NOM-05).
- Sin regresiones en registro rápido entrada/salida si se mantiene en detalle.

## Out of scope

- Clasificación/agregación de periodo en el frontend (prohibido en Task 04).
- Export PDF/Excel de asistencia (NOM-04).
- Edición de turnos o horarios de empleado.
- Cambios en schema Prisma o migraciones.
- Kiosko plant / app móvil.
