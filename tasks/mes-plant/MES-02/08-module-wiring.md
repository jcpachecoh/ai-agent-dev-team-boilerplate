# MES-02 Task 08 — Module Wiring

## Goal

Create `PlantModule`, register it in `AppModule`, and ensure dependencies (`PrismaModule`, `SupplyItemsModule`, MES guards) are wired. Run structure validation.

**Depends on:** Tasks 02–07.

---

## Scope

- Create `apps/api/src/mes/plant/plant.module.ts`.
- Add `PlantModule` to `apps/api/src/app.module.ts` imports only.
- Export or import `MesJwtGuard` as needed for controller (without changing auth behavior).

---

## Out of Scope

- New tests (task 09).
- Postman (task 10).
- Changes to `MesAuthService`, `MesJwtStrategy`, or auth repository.
- `package.json` dependency changes.

---

## Files allowed

- `apps/api/src/mes/plant/plant.module.ts` — create
- `apps/api/src/app.module.ts` — add `PlantModule` import only

---

## Files forbidden

- `apps/api/src/mes/auth/**` — prefer **no edits**; if `MesJwtGuard` must be exported, minimal export-only change in `mes-auth.module.ts` is allowed **only if required** and documented as deviation
- `apps/api/src/supplyitems/**` (no edits)
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Implementation notes

### PlantModule sketch

```typescript
@Module({
  imports: [PrismaModule, SupplyItemsModule],
  controllers: [PlantController],
  providers: [PlantRepository, PlantService],
})
export class PlantModule {}
```

### MesJwtGuard

- Option A: Register `MesJwtGuard` + `MesJwtStrategy` as imports from `MesAuthModule` if exported.
- Option B: Import `MesAuthModule` in `PlantModule` (if exports guards/strategy).
- **Do not** duplicate or modify JWT strategy logic.

### AppModule

```typescript
import { PlantModule } from './mes/plant/plant.module';
// imports: [ ..., PlantModule ]
```

### validate-structure

- Feature folder `mes/plant` validates as module name `plant`.
- Requires: `plant.module.ts`, interfaces, repository, service, controller, dto/, test/ (tests added in task 09 — run validate after 09 or accept temporary failure until 09).

---

## Acceptance criteria

- [ ] `PlantModule` registers controller, service, repository.
- [ ] `SupplyItemsModule` imported for `SupplyItemsService` injection.
- [ ] `AppModule` imports `PlantModule`.
- [ ] Application boots without DI errors.
- [ ] `node scripts/validate-structure.js` passes (after task 09 test files exist).
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
```
