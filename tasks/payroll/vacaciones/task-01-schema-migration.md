# OS-589 Task 01 — Schema Prisma y migración

**Domain:** `[BACKEND]` `[PRISMA]`  
**Status:** `pending`  
**Depends on:** —  
**Epic:** [OS-589](./00-epic-and-decisions.md)

---

## Goal

Agregar al schema Prisma los modelos y enums de **vacaciones** (`VacationBalance`, `VacationRequest`, `VacationType`, `VacationStatus`) con refinamientos del epic (doble aprobación, storage de carta, índices multi-tenant) y generar la migración SQL correspondiente.

---

## Scope

### Modelos (`prisma/schema.prisma`)

Implementar según epic sección "Modelo de datos", con estas decisiones para esta task:

| Decisión                            | Valor en esta task                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Q2 soft delete en `VacationRequest` | Usar `isActive Boolean @default(true)` + `@@index([tenantId, isActive])` (convención del repo). **No** usar `deletedAt`. |
| `employeeId` FK                     | Referencia `EmployeeDetails.id` (no `User.id`).                                                                          |
| Campos de aprobación                | `level1ApprovedBy`, `level1ActedAt`, `level2ApprovedBy`, `level2ActedAt`, `rejectionReason`                              |
| Carta PDF                           | `letterStorageObjectId String?` (FK opcional a `StorageObject`)                                                          |
| Días                                | `Decimal @db.Decimal(6, 2)` en todos los campos de días                                                                  |

### Enums

```prisma
enum VacationType {
  DISFRUTE
  COMPENSACION
}

enum VacationStatus {
  SOLICITADA
  APROBADA_NIVEL_1
  APROBADA
  RECHAZADA
}
```

### Relaciones mínimas

- `VacationBalance` → `EmployeeDetails` (por `employeeId`, `onDelete: Restrict`).
- `VacationRequest` → `EmployeeDetails` (por `employeeId`, `onDelete: Restrict`).
- `VacationRequest.letterStorageObjectId` → `StorageObject` opcional (`onDelete: SetNull`).

### Migración

- Crear migración con nombre descriptivo: `vacation_balance_and_requests`.
- SQL debe incluir **solo** tablas/enums de esta task.
- Revisar SQL generado antes de considerar la task completa.

### Seed (opcional, mínimo)

- Si se toca `prisma/seed.ts`, solo upsert de saldo de prueba para **un** empleado seed existente (idempotente). No seed masivo.

---

## Out of scope

- Repository, service, controller, resolver.
- Job de acumulación mensual.
- Cambios en módulos de asistencia o nómina.
- Backfill de saldos históricos.
- `prisma migrate dev` en CI del agente (solo crear archivo de migración).

---

## Files allowed

- `prisma/schema.prisma` — modify
- `prisma/migrations/**` — create (solo migración de vacaciones)
- `prisma/seed.ts` — modify (opcional, mínimo)

---

## Files forbidden

- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `apps/api/src/**` (código NestJS — tasks posteriores)
- `apps/web-app/**`
- `packages/**`
- `scripts/validate-structure.js`

---

## Implementation notes

- `@@unique([tenantId, employeeId])` en `VacationBalance` además de `employeeId @unique` si aplica patrón multi-tenant del repo.
- Índices obligatorios: `@@index([tenantId])`, `@@index([tenantId, employeeId])`, `@@index([tenantId, status])`, `@@index([tenantId, isActive])`.
- `@@map("vacation_balances")` y `@@map("vacation_requests")`.
- `lastAccrualDate`: primer día del último mes calendario acreditado (`YYYY-MM-01`); ver D3.

---

## Acceptance criteria

- [ ] Modelos `VacationBalance` y `VacationRequest` en `schema.prisma` con `tenantId`, timestamps y convenciones del repo.
- [ ] Enums `VacationType` y `VacationStatus` con estado intermedio `APROBADA_NIVEL_1`.
- [ ] Campos de doble aprobación (PC-2) y `letterStorageObjectId` (D5) presentes.
- [ ] Migración SQL creada y revisada (solo vacaciones).
- [ ] `pnpm prisma format` y `pnpm prisma validate` pasan.
- [ ] `pnpm prisma generate` ejecutado localmente (cliente regenerado).

---

## Validation commands

```bash
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
```
