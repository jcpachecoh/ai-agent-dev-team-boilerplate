# CONN-06 Task 08 — Tests y validación final

**Domain:** `[BACKEND]` `[FRONTEND]` `[QA]`  
**Status:** `completed`  
**Depends on:** [Task 07](./task-07-nom24-comparative-report-proration.md)  
**Epic:** [CONN-06](./00-epic-and-decisions.md)

---

## Goal

Cerrar criterios de aceptación del epic CONN-06 con tests de integración, casos de prorrateo, pendientes manuales y validación de pipeline local.

---

## Scope

### Tests backend (obligatorios)

| Caso                                                   | Esperado                                                 |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Empleado rotante + turno sede A                        | `DailyCostCenterAssignment` `TURNO_ASIGNADO`, location A |
| Empleado rotante + marcación sede B (sin turno)        | Asignación `MARCACION_ASISTENCIA`, location B            |
| Empleado rotante sin turno ni marcación                | Sin fila; aparece en `pending`                           |
| Manual asignado + nueva marcación                      | Manual persiste (D2)                                     |
| Rotante 6 días sede A + 4 días sede B, costo 1.000.000 | NOM-24: 600.000 A, 400.000 B                             |
| Rotante 100% una sede                                  | Toda la costo a esa sede                                 |
| Empleado OPERACIONES sede fija                         | Sin `DailyCostCenterAssignment`; costo a sede fija       |
| Create empleado ROTANTE + locationId                   | 400                                                      |
| Create empleado OPERACIONES sin locationId             | 400                                                      |
| Multi-tenant                                           | Tenant A no ve asignaciones de B                         |

### Tests frontend (mínimo)

- Selector Rotante bloquea Áreas.
- Calendario muestra sede y pendientes.
- Pantalla corrección: asignar manual actualiza calendario.

### Seed demo (opcional)

- 1–2 empleados `ROTANTE` en seed con turnos en sedes distintas para QA manual.

### Postman

Carpeta `CONN-06 Rotante Cost Proration` en `postman/restopsiq-api.collection.json`:

- List assignments empleado
- PUT manual assignment
- List pending
- Generate NOM-24 comparative (o endpoint reporte existente)

### Checklist epic

Marcar ítems del epic [00-epic-and-decisions.md](./00-epic-and-decisions.md) según pasen tests.

---

## Out of scope

- E2E browser automatizado (manual QA checklist suficiente).
- Performance load test.

---

## Files allowed

- `apps/api/src/daily-cost-center/test/**`
- `apps/api/src/reports/test/**`
- `apps/api/src/payroll/test/**` (casos rotante adicionales)
- `apps/web-app/src/features/payroll/**` (tests componente si existen)
- `apps/api/prisma/seed.ts` o seed dedicado (opcional)
- `postman/restopsiq-api.collection.json`

---

## Files forbidden

- Cambios funcionales fuera de fixes para tests fallidos
- `package.json`, lockfiles

---

## Acceptance criteria

- [x] Todos los casos de tabla backend pasan.
- [x] Checklist epic completo.
- [x] Pipeline local en verde (comandos abajo).
- [x] Postman documentado.

---

## Validation commands

```bash
pnpm prisma format --schema=apps/api/prisma/schema.prisma
DATABASE_URL="<dev-url>" pnpm prisma validate --schema=apps/api/prisma/schema.prisma
pnpm --filter=api test -- daily-cost-center
pnpm --filter=api test -- rotante-proration
pnpm --filter=api test -- payroll.service
pnpm --filter=web-app typecheck
pnpm lint
node scripts/validate-structure.js
```
