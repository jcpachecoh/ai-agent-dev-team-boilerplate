# CONN-05 Task 04 — API: validación, catálogo y hook

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 03](./task-03-provision-service.md)  
**Epic:** [CONN-05](./00-epic-and-decisions.md)

---

## Goal

Exponer el catálogo unificado por API, validar `reason` contra el catálogo shared, e integrar el provisionamiento en `createManualMarking`.

---

## Scope

### Endpoints

| Método | Ruta                                 | Descripción                                                                                                   |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/attendance/manual-marking-reasons` | Lista `ManualMarkingReasonOption[]` para el tenant (filtrar tipos inactivos en `NovedadTypeConfig` si aplica) |

### DTO

- `CreateManualMarkingDto.reason` → `@IsIn` códigos del catálogo shared (reemplaza `ATTENDANCE_MANUAL_MARKING_REASONS` legacy).
- Deprecar constante `ATTENDANCE_MANUAL_MARKING_REASONS` — re-export desde shared o eliminar.

### Integración

- `AttendanceCardService.createManualMarking` → invocar `ManualMarkingProvisionService` post-`registerEvent`.
- Mantener `AuditLog`, scoping de sede OS-551, `manualParentLogId`.

### Tests

- Controller spec: GET catálogo, POST con reason inválido (400), POST `CORRECCION_MARCACION` sin side-effect.
- E2E: POST incapacidad → `MedicalLeave` existe; POST permiso → `PayrollNovedad` existe.

---

## Out of scope

- Postman (task 07).
- Frontend.

---

## Files allowed

- `apps/api/src/attendance/controller/**` — modify
- `apps/api/src/attendance/controller/dto/**` — modify
- `apps/api/src/attendance/service/attendance-card.service.ts` — modify
- `apps/api/src/attendance/attendance.constants.ts` — modify (deprecar lista legacy)
- `apps/api/src/attendance/test/**` — modify/create

---

## Files forbidden

- `prisma/schema.prisma`
- `apps/web-app/**`
- `packages/ui/**`

---

## Acceptance criteria

- [ ] `GET manual-marking-reasons` retorna catálogo alineado con task 01.
- [ ] `reason` fuera del catálogo → `400`.
- [ ] Criterios de aceptación del epic cubiertos a nivel API.

---

## Validation commands

```bash
pnpm --filter=api test -- attendance-card
pnpm --filter=api test:e2e -- manual-marking
pnpm typecheck
```
