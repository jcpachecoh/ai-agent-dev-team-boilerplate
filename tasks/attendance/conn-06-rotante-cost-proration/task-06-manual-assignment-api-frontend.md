# CONN-06 Task 06 — Asignación manual, calendario y pantalla de corrección

**Domain:** `[BACKEND]` `[FRONTEND]` `[WEB-APP]`  
**Status:** `completed`  
**Depends on:** [Task 04](./task-04-assignment-resolution-service.md), [Task 05](./task-05-employee-form-rotante.md)  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Exponer API para corrección manual de sede diaria, vista calendario en perfil de empleados rotantes, y pantalla operativa para días pendientes no capturados automáticamente.

---

## Scope

### Backend — REST / GraphQL (elegir patrón del módulo payroll/attendance)

Endpoints mínimos propuestos (REST alineado a payroll):

| Método   | Ruta                                                             | Descripción                             |
| -------- | ---------------------------------------------------------------- | --------------------------------------- |
| `GET`    | `/employees/:employeeId/daily-cost-center-assignments?from=&to=` | Calendario empleado                     |
| `PUT`    | `/employees/:employeeId/daily-cost-center-assignments/:date`     | Asignación manual día (`source=MANUAL`) |
| `GET`    | `/daily-cost-center-assignments/pending?from=&to=`               | Lista días pendientes tenant            |
| `DELETE` | `/daily-cost-center-assignments/:id`                             | Quitar manual (opcional; solo MANUAL)   |

DTOs:

- `UpsertManualAssignmentDto`: `date`, `locationId`
- `ListAssignmentsQueryDto`: `from`, `to`
- Response incluye `source`, `location` (nombre sede), `shiftId?`

RBAC: roles con permiso gestión nómina/asistencia (alinear con `canRegisterPayrollNovedadOnBehalf` o permiso dedicado — definir en implementación).

### `assignManual()`

- Valida empleado rotante del tenant.
- Valida `locationId` pertenece al tenant.
- Upsert con `source = MANUAL` (siempre gana — D2).

### Frontend — Perfil empleado rotante

- Sección visible solo si `costCenter === ROTANTE`.
- Vista **calendario mensual** (o lista por semana) mostrando sede asignada cada día.
- Código de color:
  - Verde/azul: turno
  - Gris: marcación
  - Ámbar: manual
  - Rojo/vacío: pendiente

### Frontend — Pantalla corrección manual

Ruta sugerida: `/payroll/rotante-assignments` o bajo módulo asistencia según IA de navegación existente.

- Filtros: rango fechas, empleado, sede, estado (pendiente/asignado).
- Tabla: empleado, fecha, sede sugerida (si hay turno/marcación parcial), acción asignar sede.
- Modal asignación: select Áreas (sedes tenant).

---

## Out of scope

- Prorrateo NOM-24 (task 07).
- Notificaciones push/email por días pendientes.
- Edición masiva CSV.

---

## Files allowed

- `apps/api/src/daily-cost-center/controller/**`
- `apps/api/src/daily-cost-center/controller/dto/**`
- `apps/api/src/daily-cost-center/service/**` (métodos manual/list)
- `apps/api/src/daily-cost-center/test/**`
- `apps/web-app/src/features/payroll/screens/**` (nueva pantalla corrección)
- `apps/web-app/src/features/payroll/components/**` (calendario rotante)
- Rutas/navegación payroll si aplica
- `postman/restopsiq-api.collection.json` (requests CONN-06)

---

## Files forbidden

- `schema.prisma`
- NOM-24 report service (task 07)
- Liquidación nómina

---

## Acceptance criteria

- [x] Calendario perfil muestra sede por día para empleado rotante.
- [x] Días sin turno ni marcación aparecen como pendientes.
- [x] Corrección manual persiste con `source=MANUAL` y se refleja en calendario.
- [x] Manual no se pierde ante nueva marcación (integración con task 04).
- [x] API filtra por `tenantId`; empleado de otro tenant → 404/403.

---

## Validation commands

```bash
pnpm --filter=api test -- daily-cost-center
pnpm --filter=web-app typecheck
pnpm --filter=web-app lint
node scripts/validate-structure.js
```
