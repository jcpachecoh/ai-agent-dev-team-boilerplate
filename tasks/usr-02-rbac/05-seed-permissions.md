# USR-02 Task 05 — Seed Permissions

## Goal

Seed the global `Permission` catalog in `seed.ts` with the base permission codes defined in task 00. Idempotent upserts by `code`.

**Depends on:** Task 04 (DB tables exist).

---

## Scope

- Add `seedPermissions()` (or equivalent) to `apps/api/prisma/seed.ts`.
- Upsert all base permission rows by unique `code`.
- Use deterministic IDs (CUID constants) for permissions referenced in tests or task 06 — document in seed header comments.
- Set `module` field for grouping (`mes`, `plant`, `supply`).
- Set `isActive: true` on all seeded permissions.
- Invoke from `main()` **before** role-permission seed (task 06).
- Run `pnpm db:seed` successfully.

### Required permission codes

| code                          | module | name (display)             |
| ----------------------------- | ------ | -------------------------- |
| `mes.users.create`            | mes    | Create operational user    |
| `mes.users.role.read`         | mes    | Read operational user role |
| `plant.workstations.manage`   | plant  | Manage workstations        |
| `plant.recipes.manage`        | plant  | Manage recipes             |
| `plant.orders.read`           | plant  | Read production orders     |
| `plant.orders.create`         | plant  | Create production order    |
| `plant.orders.plan`           | plant  | Plan production order      |
| `plant.orders.pause`          | plant  | Pause production order     |
| `plant.orders.resume`         | plant  | Resume production order    |
| `plant.orders.cancel`         | plant  | Cancel production order    |
| `plant.executions.qa_approve` | plant  | QA approve execution       |
| `supply.items.read`           | supply | Read supply items          |
| `supply.items.manage`         | supply | Manage supply items        |

---

## Out of scope

- No `RolePermission` seeding (task 06).
- No `UserPermission` seed rows (overrides are exceptional — none in dev seed).
- No changes to `apps/api/src/`.
- No changes to schema or migrations.

---

## Allowed files

- `apps/api/prisma/seed.ts`

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- Any file under `apps/api/src/`
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Implementation notes

- Use `prisma.permission.upsert({ where: { code }, create, update })`.
- Update block should refresh `name`, `description`, `module`, `isActive` for idempotent re-runs.
- Export permission code → id map from seed function if task 06 needs it in the same file.

---

## Acceptance criteria

- [x] All 13 permission codes from task 00 seeded.
- [x] Upsert is idempotent (re-run `pnpm db:seed` succeeds).
- [x] Deterministic permission IDs documented in seed header or constants.
- [x] `seedPermissions()` called from `main()` before role-permission seed.
- [x] No `RolePermission` or `UserPermission` rows created in this task.
- [x] `pnpm db:seed` exits 0 against DB with task 04 migration applied.

---

## Validation commands

```bash
cd apps/api
pnpm db:seed
# Optional verify:
# psql $DATABASE_URL -c 'SELECT code, module FROM permissions ORDER BY code;'
```

---

## Risks

| Risk              | Notes                                                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| Code typos        | Matrix in task 06 depends on exact codes — use constants shared in seed file |
| Missing migration | Seed fails if task 04 not applied                                            |

---

## Stop rule

**Stop after this task.** Report seed output and permission count. **Do not proceed to task 06 (seed role-permissions) without explicit approval.**
