# CONN-04b Task 05 — Seeds de motivos, permiso y demo

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `completed`  
**Depends on:** [Task 01](./task-01-schema-migration.md), [Task 04](./task-04-api-permissions.md)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Sembrar motivos `OVERTIME_REASON`, permiso `attendance.overtime.request` y (opcional) demo de solicitud administrativa, con upsert idempotente.

---

## Scope

### Motivos (tenant demo `palos-de-lena`)

| Nombre                    | `type`            |
| ------------------------- | ----------------- |
| Inventario físico semana  | `OVERTIME_REASON` |
| Inventario físico mensual | `OVERTIME_REASON` |
| Aseo                      | `OVERTIME_REASON` |

- IDs deterministas documentados.
- `pilaCode = null`.
- `isActive = true`.
- Upsert por `tenantId_type_name` (o id fijo).
- Soft-deactivate: `isActive = false` (no hard delete).
- Scope: **tenant demo**, no `GLOBAL` tipo `LaborLegalParameter`.
- Onboarding futuro: fuera de alcance MVP (puede copiar plantilla más adelante).

### Permiso

- `attendance.overtime.request` en `PERMISSION_SEEDS`.
- Asignar en `ROLE_PERMISSION_MATRIX` según P4 (default: roles que operan como Admin de sede / MANAGER con cargo Admin — documentar elección al implementar).
- **No** asumir que `attendance.overtime.read` implica create.

### Demo OvertimeRequest admin

- Solo **después** de [task-09](./task-09-pending-salary-fix.md), o con flag/comentario si se siembra antes.
- Al menos 1 solicitud `PENDIENTE_GERENCIA_OPERACIONES` con ventana y motivo.

### Wiring

- Invocar seed desde `apps/api/prisma/seed.ts`.
- Extender `employee-catalog.seed.ts` **o** archivo nuevo `overtime-reason.seed.ts`.

---

## Out of scope

- CRUD HTTP write de catálogo.
- Postman.
- Frontend.

---

## Files allowed

- `apps/api/prisma/seeds/**`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/seeds/overtime-demo.seed.ts` — extend opcional

---

## Files forbidden

- `apps/api/src/**` (salvo que no haga falta)
- `apps/web-app/**`
- Generar migraciones nuevas

---

## Acceptance criteria

- [ ] Re-ejecutar seed no duplica motivos ni permisos.
- [ ] `GET /employee-catalogs?type=OVERTIME_REASON` lista los 3 (tras generate).
- [ ] Permiso create existe y está en matrix acordada.
- [ ] Demo admin no introduce recargo 75% incorrecto si task-09 pendiente (bloquear o documentar).

---

## Validation commands

```bash
# Tras migrate/generate en entorno local:
cd apps/api && pnpm exec prisma db seed
# Verificar por query o script de inspección de los 3 nombres + permiso
```
