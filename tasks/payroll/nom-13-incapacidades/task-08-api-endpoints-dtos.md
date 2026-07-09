# NOM-13 Task 08 — API REST, controller y DTOs

**Domain:** `[BACKEND]`  
**Status:** `pending`  
**Depends on:** [Task 05](./task-05-medical-leave-service.md), [Task 06](./task-06-storage-support-doc.md)  
**Epic:** [NOM-13](./00-epic-and-decisions.md)

---

## Goal

Exponer endpoints REST para RRHH: CRUD de incapacidades, cambio de estado y adjunto/descarga de soporte.

---

## Scope

### Módulo

- `apps/api/src/medical-leaves/controller/medical-leaves.controller.ts`
- `apps/api/src/medical-leaves/controller/dto/**`
- Registrar en `medical-leaves.module.ts`
- **No** modificar `app.module.ts` en esta task salvo que el repo ya tenga patrón de auto-import; si requiere registro manual, documentar para PR humano.

### Endpoints propuestos

| Método   | Ruta                                       | Descripción                                  |
| -------- | ------------------------------------------ | -------------------------------------------- |
| `POST`   | `/medical-leaves`                          | Registrar incapacidad                        |
| `GET`    | `/medical-leaves`                          | Listar (filtros sede, empleado, estado, mes) |
| `GET`    | `/medical-leaves/:id`                      | Detalle                                      |
| `PATCH`  | `/medical-leaves/:id/status`               | Cambiar estado                               |
| `POST`   | `/medical-leaves/:id/support-document`     | Upload adjunto                               |
| `GET`    | `/medical-leaves/:id/support-document/url` | URL prefirmada                               |
| `DELETE` | `/medical-leaves/:id`                      | Soft delete                                  |

### Seguridad

- `@UseGuards(JwtAuthGuard, RolesGuard)`
- Escritura: rol `NOMINA` (o permiso `medical-leaves.write`)
- `tenantId` desde JWT, nunca del body

### DTOs Swagger

- `CreateMedicalLeaveDto`, `UpdateMedicalLeaveStatusDto`, `ListMedicalLeavesQueryDto`, `MedicalLeaveResponseDto`
- Fechas como `YYYY-MM-DD` string → parse UTC en controller

### Tests

- `medical-leaves.controller.spec.ts` — mock service

---

## Out of scope

- GraphQL.
- Frontend.

---

## Files allowed

- `apps/api/src/medical-leaves/controller/**`
- `apps/api/src/medical-leaves/test/medical-leaves.controller.spec.ts`
- `apps/api/src/medical-leaves/medical-leaves.module.ts`

---

## Files forbidden

- `apps/web-app/**`
- `prisma/schema.prisma`

---

## Acceptance criteria

- [ ] Controller sin lógica de negocio (delega al service).
- [ ] Swagger documentado.
- [ ] Tests controller con service mock.

---

## Validation commands

```bash
pnpm --filter api test medical-leaves.controller
node scripts/validate-structure.js
```
