# USR-01 Task 02 — Drop TestLab Migration

## Goal

Create and apply a Prisma migration that drops all TestLab PostgreSQL tables, enums, and FK constraints — including the legacy `users` table owned by `UserTestLab` — so the `users` table name is free for the global `User` model in task 06.

**Depends on:** Task 01 (TestLab models removed from schema).

---

## Scope

- Create one migration under `apps/api/prisma/migrations/` that:
  - Drops FK constraints referencing `users(id)` from TestLab tables.
  - Drops TestLab tables in dependency-safe order.
  - Drops the legacy `users` table.
  - Drops TestLab-only PostgreSQL enums.
  - Drops `audit_logs_userId_fkey` (FK from `audit_logs` to `users`) if still present.
  - Keeps `audit_logs` table and `userId` column (nullable, no FK until task 06).
  - Keeps `operational_users`, `password_reset_tokens`, supply, supplier, and MES tables untouched.
- Run `prisma migrate dev` (or `prisma migrate dev --create-only` if applying separately) to produce the migration SQL.
- Run `prisma validate` after migration is created.

---

## Out of scope

- No addition of `User`, `Role`, or new `users` table (task 06).
- No changes to `schema.prisma` beyond what task 01 already did.
- No changes to `apps/api/src/`.
- No changes to `seed.ts` (will fail partially until task 07 — expected).

---

## Allowed files

- `apps/api/prisma/migrations/<timestamp>_drop_testlab_tables/migration.sql` — create (auto-generated)

---

## Forbidden files

- `apps/api/prisma/schema.prisma` — do not modify
- Any file under `apps/api/src/`
- Any file under `packages/`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Implementation notes

Suggested drop order (adjust to match actual FK graph):

1. `attachments`, `test_results`, `test_runs`, `test_plan_entries`, `test_plans`
2. `requirement_cases`, `case_milestones`, `test_cases`, `test_sections`, `test_suites`
3. `jira_links`, `requirements`, `milestones`, `project_members`, `projects`
4. `audit_logs` FK to `users` (drop constraint only, not table)
5. `users` table
6. TestLab enums: `ProjectRole`, `CasePriority`, `CaseType`, `CaseTemplate`, `RunStatus`, `ResultStatus`, `JiraEntityType`

Verify migration SQL contains **only** TestLab-related drops. No unrelated table alterations.

---

## Acceptance criteria

- [ ] Migration file exists under `apps/api/prisma/migrations/`.
- [ ] Migration drops legacy `users` table and all TestLab tables.
- [ ] Migration drops TestLab-only enums.
- [ ] Migration drops `audit_logs` → `users` FK without dropping `audit_logs`.
- [ ] `operational_users`, `password_reset_tokens`, and MES/supply tables are not dropped or altered.
- [ ] Migration applies cleanly on a database that had TestLab tables (`prisma migrate dev` or `prisma migrate deploy` in local dev).
- [ ] `npx prisma validate` exits 0.

---

## Validation commands

```bash
cd apps/api
npx prisma validate
npx prisma migrate dev --name drop_testlab_tables
# Or, if migration already created:
npx prisma migrate deploy
```

---

## Risks

| Risk                                      | Notes                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Data loss**                             | All TestLab data in `users` and related tables is permanently deleted — acceptable per TestLab deprecation decision |
| `pnpm db:seed` fails                      | `userTestLab.upsert` will fail until task 07 — expected                                                             |
| Email auth broken in running environments | No `users` table until task 06 — coordinate deployment window                                                       |
| Migration drift                           | Review generated SQL manually before commit; must not drop non-TestLab objects                                      |

---

## Stop rule

**Stop after this task.** Report migration file path, validation results, and data-loss confirmation. **Do not proceed to task 03 (Role + DocumentType schema) without explicit approval.**
