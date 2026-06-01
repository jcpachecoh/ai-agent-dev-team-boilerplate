# USR-01 Task 09 — Backfill Operational Users

## Goal

Backfill `OperationalUser.userId` for any existing production or staging rows that were created before the seed/link pattern in task 07. Create corresponding global `User` records where missing, linking MES operational profiles to centralized identity.

**Depends on:** Task 06 (migration applied), Task 07 (seed pattern established). Task 08 may run in parallel if no production deployment yet — for environments with pre-existing `operational_users` rows, this task is required before enforcing NOT NULL on `userId`.

---

## Scope

- Provide a one-time backfill script or migration SQL that, for each `operational_users` row where `userId IS NULL`:
  1. Creates a `User` row with:
     - Matching `tenantId`
     - `cedula` — **cannot be recovered from `cedulaHash`** in production; requires manual mapping, ops input, or placeholder strategy documented below
     - `documentType` — default `CC` if unknown
     - `email` — synthetic or ops-provided (`{cedula}@{tenantId}.internal` only if ticket allows; document decision)
     - `passwordHash` — random bcrypt placeholder (user must reset) or ops-provided
     - `roleId` — mapped from `OperationalUser.role` → `Role.code` for same tenant
     - Auth lifecycle fields copied or defaulted from `OperationalUser` where appropriate
  2. Sets `operational_users.userId` to the new `User.id`.
- For **local dev** environments re-seeded via task 07, backfill may be a no-op (all rows already linked).
- Optionally add a follow-up migration to enforce `userId NOT NULL` on `operational_users` after backfill completes.
- Document backfill strategy for environments where plain `cedula` is unknown.

---

## Out of scope

- No MES auth service refactor (still uses `cedulaHash` + `pinHash` on `OperationalUser`).
- No removal of `cedulaHash`, `pinHash`, or `OperationalRole`.
- No gateway changes.
- No changes to `apps/api/src/auth/**` unless backfill script lives elsewhere (prefer script in allowed path below).

---

## Allowed files

- `apps/api/prisma/migrations/<timestamp>_backfill_operational_user_links/migration.sql` — if SQL-only backfill
- **OR** `scripts/backfill-operational-users.ts` — if TypeScript script approach (create; not listed as forbidden)
- `tasks/usr-01-global-user/09-backfill-operational-users.md` — update with execution notes / runbook section only

If using a script approach, also allow:

- `apps/api/prisma/seed.ts` — only if extending seed to idempotently link orphans (prefer separate script)

---

## Forbidden files

- `apps/api/prisma/schema.prisma` — do not modify (NOT NULL migration is separate SQL in migrations/)
- `apps/api/src/mes/**` — do not modify MES auth logic
- `apps/api/src/auth/**`
- `apps/api/src/app.module.ts`
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Implementation notes

### Cédula recovery limitation

`cedulaHash` is one-way. Backfill cannot derive plain `cedula` for existing rows unless:

- Source data exists outside DB (CSV from ops), or
- Only dev/staging environments are in scope (re-seed instead of backfill), or
- Placeholder `cedula` values are acceptable temporarily with forced update workflow.

Document the chosen strategy in the task report before executing in production.

### Role mapping

Map `OperationalUser.role` enum value → `Role.code` for the same `tenantId`. Seed roles (task 07) must exist before backfill.

### Idempotency

Backfill must skip rows that already have `userId` set.

---

## Acceptance criteria

- [x] Backfill script exists and is documented (`scripts/backfill-operational-user-links.ts`, `scripts/backfill-operational-users.ts`).
- [x] Seed fixtures linked via Task 07 upsert; seed invokes idempotent backfill at end.
- [x] Dev known cédula mappings for `12345678` / `87654321` (palos-de-lena).
- [x] Backfill is idempotent (skips rows with `userId` already set).
- [x] MES login regression tests pass (`mes-auth` suite unchanged).
- [x] Email auth login regression test for seeded global User passes.
- [ ] All production `operational_users` rows with only `cedulaHash` require ops JSON mapping — see runbook below.

---

## Runbook (Task 09)

### Local dev

```bash
cd apps/api
pnpm db:seed   # seeds + runs backfill hook
# Or run backfill alone:
npx tsx ../../scripts/backfill-operational-users.ts
```

### Production / staging (requires cédula mapping)

1. Export orphan rows: `SELECT id, "tenantId", "cedulaHash", role FROM operational_users WHERE "userId" IS NULL;`
2. Build JSON mapping with ops-provided plain cédulas (cannot derive from hash).
3. Run: `cd apps/api && npx tsx ../../scripts/backfill-operational-users.ts --mapping ./ops-cedula-map.json`
4. Verify: `SELECT COUNT(*) FROM operational_users WHERE "userId" IS NULL;`

### Cédula strategy

| Environment         | Strategy                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Local dev (re-seed) | Task 07 seed links fixtures; backfill links orphans only when hash matches known dev cédulas |
| Production          | **Blocked** without external CSV/JSON mapping — `cedulaHash` is one-way                      |

Orphan rows without mapping remain with `userId IS NULL` (nullable per Task 05). Do **not** enforce NOT NULL until all rows mapped.

---

## Validation commands

```bash
# After backfill — verify no orphan operational users
cd apps/api
npx prisma db execute --stdin <<'SQL'
SELECT COUNT(*) AS orphans FROM operational_users WHERE "userId" IS NULL;
SQL

# MES auth smoke (manual or existing test suite)
pnpm --filter=@restopsiq/api test -- --testPathPattern=mes-auth
```

---

## Risks

| Risk                                      | Notes                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| **Cannot recover plain cedula from hash** | Blocker for production backfill without external data                          |
| Synthetic emails violate uniqueness       | Ensure unique `(tenantId, email)` per row                                      |
| Placeholder passwords                     | Users locked out of email auth until reset — acceptable for MES-only operators |
| NOT NULL too early                        | Enforce only after all rows backfilled                                         |

---

## Stop rule

**Stop after this task.** Report backfill counts, cédula strategy, and validation results. **Do not proceed to task 10 (validation & security) without explicit approval.**
