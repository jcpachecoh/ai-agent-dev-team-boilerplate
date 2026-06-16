# MES-02 — REST API: Plant Master Data (Workstations, Recipes, Phases, Inputs)

**Ticket:** MES-02  
**Branch:** `feature/mes-plant-core` (based on MES-AUTH-01 + MES-01 schema)  
**Status:** Planned  
**Priority:** High

---

## Goal

Implement a NestJS REST API for MES plant master data: work stations, production recipes (with nested phases and phase inputs), phase reordering, and phase input management. All endpoints are tenant-scoped via the MES operational JWT and follow the workspace module structure under `apps/api/src/mes/plant/`.

---

## Scope

- New `PlantModule` at `apps/api/src/mes/plant/` with interfaces, repository, service, controller, DTOs, and tests.
- Workstation CRUD with soft delete and active-execution guard.
- Production recipe CRUD with nested create transaction, versioning by name, clone, detail with `totalStandardMinutes`, soft delete.
- Phase reorder endpoint (drag-and-drop).
- Phase input add/remove with supply catalog validation.
- Register module in `app.module.ts`.
- Postman collection updates (final task only).
- Unit tests for service and controller layers.

**Prerequisites (already on branch):**

- MES-01 Prisma models: `WorkStation`, `ProductionRecipe`, `ProductionPhase`, `PhaseInput`, `PhaseExecution`, etc.
- MES-AUTH-01: `MesJwtGuard`, `MesJwtPayload`, `OperationalUser`.

---

## Out of Scope

- Prisma schema or migration changes.
- Changes to `mes/auth` implementation (guards may be **imported/re-exported**, not modified).
- Changes to `supplyitems` implementation (reuse `SupplyItemsService` only).
- Production orders, operator sessions, or phase execution runtime APIs (MES-03+).
- `finishedProductId` FK to a product catalog (remains plain `String`).
- `supplyItemId` Prisma relation on `PhaseInput` (remains plain `String`; validated via service).
- Platform JWT / `x-tenant-id` for plant routes (MES JWT only).
- Seed data for plant masters (optional follow-up).
- `lint:fix` or repo-wide formatting.

---

## Architecture Decisions

| Decision          | Choice                                      | Rationale                                                                                 |
| ----------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Module path**   | `apps/api/src/mes/plant/`                   | Aligns with `mes/auth`; `validate-structure.js` validates `mes/plant` as feature `plant`. |
| **Module file**   | `plant.module.ts`                           | Feature folder name = `plant`.                                                            |
| **Route prefix**  | `@Controller('plant')`                      | Public URLs: `/api/plant/...` (global prefix `api` in `main.ts`).                         |
| **Tenant source** | `req.user.tenantId` from MES JWT            | Prevents tenant spoofing; consistent with protected `mes/auth` routes.                    |
| **Auth pattern**  | `@Public()` + `@UseGuards(MesJwtGuard)`     | Bypasses global `JwtAuthGuard`; validates MES token via `mes-jwt` strategy.               |
| **Optional RBAC** | `MesRolesGuard` on write routes (follow-up) | Ticket does not mandate roles; document in risks.                                         |

---

## Route Contracts

All routes require `Authorization: Bearer <MES access token>` unless noted. Tenant is taken from JWT (`req.user.tenantId`), not from headers.

### WorkStations

| Method | Path                          | Description                       |
| ------ | ----------------------------- | --------------------------------- |
| POST   | `/api/plant/workstations`     | Create workstation                |
| GET    | `/api/plant/workstations`     | List workstations (tenant-scoped) |
| PATCH  | `/api/plant/workstations/:id` | Update workstation                |
| DELETE | `/api/plant/workstations/:id` | Soft delete (`isActive: false`)   |

### ProductionRecipes

| Method | Path                           | Description                                                 |
| ------ | ------------------------------ | ----------------------------------------------------------- |
| POST   | `/api/plant/recipes`           | Create recipe + nested phases + inputs (single transaction) |
| GET    | `/api/plant/recipes`           | List recipes                                                |
| GET    | `/api/plant/recipes/:id`       | Detail: recipe + phases + inputs + `totalStandardMinutes`   |
| PATCH  | `/api/plant/recipes/:id`       | Update recipe metadata                                      |
| POST   | `/api/plant/recipes/:id/clone` | Clone recipe with all phases and inputs                     |
| DELETE | `/api/plant/recipes/:id`       | Soft delete (`isActive: false`)                             |

### ProductionPhases (reorder)

| Method | Path                                    | Description                                         |
| ------ | --------------------------------------- | --------------------------------------------------- |
| PATCH  | `/api/plant/recipes/:id/phases/reorder` | Body: `[{ phaseId, newOrder }]` — update order only |

### PhaseInputs

| Method | Path                                    | Description             |
| ------ | --------------------------------------- | ----------------------- |
| POST   | `/api/plant/phases/:id/inputs`          | Add input to phase      |
| DELETE | `/api/plant/phases/:id/inputs/:inputId` | Remove input from phase |

**Nest route ordering:** Register static paths before parameterized ones (e.g. `recipes/:id/phases/reorder` before `recipes/:id` if using one controller).

---

## Domain Rules

### WorkStation

- Unique `(tenantId, code)` enforced by DB.
- Soft delete: set `isActive: false` (no hard delete).
- **Deactivate guard:** Cannot set `isActive: false` if the station has **active phase executions** (see definition below).
- List/detail scoped by `tenantId` from JWT.

### ProductionRecipe

- **Create with nested graph:** One Prisma `$transaction` creates recipe, all phases, and all phase inputs.
- **Versioning:** On create, if an **active** recipe (`isActive: true`) with the same `name` exists for the tenant:
  1. Deactivate the existing recipe (`isActive: false`).
  2. New recipe `version = existing.version + 1`.
  3. If none exists, `version = 1` (default).
- No DB unique on `(tenantId, name)` — enforced in service.
- **Clone:** New recipe row; copy all phases and inputs in one transaction; apply versioning/name rules as documented in task 04.
- **Detail:** Include `phases` (ordered by `order`), each with `inputs`; add computed `totalStandardMinutes = SUM(phases.standardMinutes)` (not stored in DB).
- Soft delete: `isActive: false`.

### ProductionPhase (reorder)

- Body: array of `{ phaseId, newOrder }`.
- All `phaseId` values must belong to the recipe and tenant.
- `newOrder` values must be unique and form a valid sequence (e.g. 1..n).
- Update **only** the `order` field — do not recreate phases; preserves `workStationId` and input links.

### PhaseInput

- **Supply validation:** Reuse `SupplyItemsService.findOne(tenantId, supplyItemId)` — throws `NotFoundException` if missing or wrong tenant (same pattern as supply-items category check).
- Phase must exist and belong to tenant before add/remove.
- Delete removes the `PhaseInput` row (hard delete on join table is acceptable per ticket).

### Active execution (workstation soft delete)

An execution is **active** when:

```
tenantId matches
phase.workStationId = workstationId
startedAt IS NOT NULL
completedAt IS NULL
```

Repository: `hasActiveExecutionsForWorkStation(tenantId, workStationId): Promise<boolean>`.

### Transaction strategy (nested recipe create)

In **repository** (service validates first):

```text
prisma.$transaction(async (tx) => {
  1. Optionally deactivate prior active recipe (same name) + compute version
  2. tx.productionRecipe.create(...)
  3. For each phase (in order): tx.productionPhase.create(...)
  4. For each input: tx.phaseInput.create(...)
})
```

### SupplyItem validation strategy

- Inject `SupplyItemsModule` → `SupplyItemsService`.
- Call `findOne(tenantId, supplyItemId)` before creating/updating phase inputs.
- Do not duplicate Prisma queries in plant repository for supply items.

---

## Acceptance Criteria (Epic-level)

- [ ] `POST /api/plant/recipes` creates recipe + phases + inputs in a **single transaction**.
- [ ] `GET /api/plant/recipes/:id` returns phases, inputs, and `totalStandardMinutes = SUM(phases.standardMinutes)`.
- [ ] `PATCH /api/plant/recipes/:id/phases/reorder` updates order only; workstation and input links unchanged.
- [ ] `POST /api/plant/phases/:id/inputs` rejects invalid `supplyItemId` for tenant.
- [ ] `DELETE /api/plant/workstations/:id` soft-deletes unless active executions exist on that station.
- [ ] Duplicate active recipe name on create triggers auto-versioning (old deactivated, new version incremented).
- [ ] All plant routes use MES JWT tenant (`req.user.tenantId`), not `x-tenant-id`.
- [ ] `node scripts/validate-structure.js` passes for `plant` module.
- [ ] Service and controller unit tests pass.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.
- [ ] No changes to Prisma schema, `mes/auth` logic, or `supplyitems` logic.

---

## Testing Strategy

| Layer      | Approach                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| Service    | Mock `IPlantRepository` and `SupplyItemsService`; assert business rules, exceptions, versioning, active-execution guard. |
| Controller | Mock `PlantService`; assert route delegation and `req.user.tenantId` passed to service.                                  |
| Repository | Optional focused tests for transactions (if not covered by service mocks); prefer service-level coverage for epic.       |
| E2E        | Postman/manual in task 10; not required in unit test tasks.                                                              |

---

## Validation Commands (Epic)

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=plant
```

---

## Subtask Breakdown

| File                                        | Title                                |
| ------------------------------------------- | ------------------------------------ |
| `MES-02/00-epic-and-acceptance.md`          | Epic checklist                       |
| `MES-02/01-interfaces.md`                   | `IPlantRepository` / `IPlantService` |
| `MES-02/02-repository-transactions.md`      | Prisma + `$transaction`              |
| `MES-02/03-service-workstations.md`         | Workstation service rules            |
| `MES-02/04-service-recipes.md`              | Recipes, versioning, clone, detail   |
| `MES-02/05-service-phases-inputs.md`        | Reorder + phase inputs               |
| `MES-02/06-dtos-validation.md`              | DTOs + class-validator               |
| `MES-02/07-controller-routes.md`            | `PlantController`                    |
| `MES-02/08-module-wiring.md`                | `PlantModule` + `AppModule`          |
| `MES-02/09-tests.md`                        | Complete test coverage               |
| `MES-02/10-postman-and-final-validation.md` | Postman + final gates                |

---

## Risks / Follow-ups

- **MesJwtGuard export:** `PlantModule` may need `MesAuthModule` to export `MesJwtGuard` / `MesRolesGuard`, or duplicate provider registration — resolve in task 08 without modifying auth behavior.
- **RBAC:** Ticket does not specify which roles may mutate masters; default to any authenticated MES user unless product adds `@Roles(...)`.
- **Inactive supply items:** Clarify whether `findOne` on inactive items should fail for phase inputs.
- **Clone naming:** Product decision for cloned recipe `name` (suffix vs same name + version).
- **List filters:** GET list endpoints may need `?isActive=true` filter (optional enhancement).
- **validate-structure:** Feature name `plant` under `mes/plant/` — confirm script maps folder `plant` correctly (not `mes-plant`).

---

## References

- Analysis: MES-02 planning session (module path, JWT tenant, transactions, versioning).
- Schema: `apps/api/prisma/schema.prisma` (MES production master data section).
- Patterns: `apps/api/src/supplyitems/`, `apps/api/src/mes/auth/`.
