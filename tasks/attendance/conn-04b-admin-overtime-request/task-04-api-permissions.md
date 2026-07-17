# CONN-04b Task 04 — API REST, DTOs y permiso de creación

**Domain:** `[BACKEND]`  
**Status:** `completed`  
**Depends on:** [Task 03](./task-03-admin-create-service.md)  
**Epic:** [CONN-04b](./00-epic-and-decisions.md)

---

## Goal

Exponer creación administrativa vía HTTP, permiso RBAC de create, y campos `type` + propuestos en responses.

---

## Scope entregado

### Endpoint

| Método | Ruta                                               | Descripción       |
| ------ | -------------------------------------------------- | ----------------- |
| `POST` | `/api/attendance/overtime-requests/administrative` | Crear batch admin |

Body: `employeeIds`, `locationId`, `workDate`, `proposedStartTime`, `proposedEndTime`, `reasonOptionId`.  
**No** aceptar `proposedMinutes`, `payrollPeriod`, `batchId`, `type`, `status`, `tenantId`, `requestedByUserId` (whitelist + `forbidNonWhitelisted` global).

Response 201: `{ batchId, createdCount, items[] }`.

Actor: `user.tenantId` + `user.sub` del JWT. Guard: `JwtAuthGuard` + `PermissionsGuard` + kiosk reject.

### Permiso

| Código                        | Uso          | Roles seed                              |
| ----------------------------- | ------------ | --------------------------------------- |
| `attendance.overtime.request` | Create admin | `MANAGER` (+ OWNER/SUPER_ADMIN vía ALL) |

- `attendance.overtime.read` **no** autoriza POST.
- Service sigue validando cargo `pos-pdl-001` + sede.
- NOMINA **no** recibe create (P4 pendiente).
- Motivos catálogo / demo → task-05.

### DTOs / responses

- `CreateAdministrativeOvertimeRequestDto`
- `CreateAdministrativeOvertimeBatchResponseDto` / `AdministrativeOvertimeCreatedItemDto`
- `OvertimeRequestResponseDto` extendido: `type`, `workDate`, `proposed*`, `reasonOptionId`, `batchId`, `requestedByUserId`

### Postman

Pendiente en **task-10** (no actualizado aquí).

---

## Files touched

- `apps/api/src/overtime/controller/**`
- `apps/api/src/overtime/overtime.constants.ts`
- `apps/api/src/overtime/test/overtime.controller.spec.ts`
- `apps/api/prisma/seed.ts` — permiso + asignación MANAGER

---

## Acceptance criteria

- [x] POST create documentado Swagger.
- [x] Sin permiso / sin cargo sede → 403.
- [x] Body inválido → 400 (ValidationPipe / service).
- [x] Duplicado/overlap → 409.
- [x] List/detail incluyen `type` + campos admin.
- [x] Tests controller mockean service + guard metadata.
- [x] `node scripts/validate-structure.js` OK.

---

## Validation commands

```bash
cd apps/api && pnpm exec jest src/overtime/test/overtime.controller.spec.ts --runInBand
node scripts/validate-structure.js
```
