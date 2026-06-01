# USR-01 Task 01 — Remove TestLab Schema

**Status:** ⛔ Reverted / superseded — do not implement.

## Reversal note

Task 01 was implemented and then **reverted** on branch `feature/usr-01-global-user-identity`. Strategy changed: **keep TestLab models** and free the physical `users` table via a **table rename** (`UserTestLab` → `@@map("users_testlab")`) rather than deleting TestLab schema. See `00-analysis-decisions.md` § "Strategy update (post Task 01 reversal)".

---

## Goal

Remove all TestLab-related Prisma models and enums from `schema.prisma` so the `users` table name is no longer occupied by `UserTestLab`. Temporarily orphan `AuditLog.userId` (no Prisma relation) until the global `User` model is added in task 04.

**Depends on:** Task 00 (analysis approved).

---

## Scope

- Delete `UserTestLab` and every TestLab domain model from `schema.prisma`.
- Delete TestLab-only enums from `schema.prisma`.
- Remove `AuditLog.user` relation to `UserTestLab`; keep `userId String?` column definition on `AuditLog`.
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

### Models to remove

- `UserTestLab`
- `Project`, `JiraLink`, `ProjectMember`
- `TestSuite`, `TestSection`, `TestCase`
- `TestPlan`, `TestPlanEntry`, `TestRun`, `TestResult`
- `Milestone`, `Requirement`, `RequirementCase`, `CaseMilestone`, `Attachment`

### Enums to remove (if unused after model removal)

- `JiraEntityType`, `ProjectRole`, `CasePriority`, `CaseType`, `CaseTemplate`, `RunStatus`, `ResultStatus`

### Models that must remain unchanged

- `AuditLog` (relation removed only; model kept)
- `PasswordResetToken`
- `OperationalUser` and all MES / supply / supplier models

---

## Out of scope

- No migrations (`prisma migrate dev` is forbidden in this task).
- No changes to `apps/api/src/` (auth code will break against generated client until task 08 — expected).
- No changes to `seed.ts`.
- No addition of `User`, `Role`, or `OperationalUser.userId` yet.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — remove TestLab section only

---

## Forbidden files

- Any file under `apps/api/src/`
- Any file under `packages/`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [ ] ~~Task superseded — criteria not applicable~~

---

## Acceptance criteria (historical — superseded)

- [x] ~~`UserTestLab` model is absent from `schema.prisma`.~~ Reverted.
- [x] ~~All TestLab models listed above are absent from `schema.prisma`.~~ Reverted.
- [x] ~~TestLab-only enums listed above are absent from `schema.prisma`.~~ Reverted.
- [x] ~~`AuditLog` model exists with `userId String?` but **no** `@relation` to a user model.~~ Reverted.
- [x] ~~`OperationalUser`, `PasswordResetToken`, supply, supplier, and MES models are unchanged.~~
- [x] ~~No `User` or `Role` model added yet.~~
- [x] ~~`npx prisma format` exits 0.~~
- [x] ~~`npx prisma validate` exits 0.~~
- [x] ~~`npx prisma generate` exits 0.~~

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```

---

## Risks

| Risk                                        | Notes                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Generated client removes `UserTestLab` type | Expected; `apps/api/src/auth/**` will not compile until task 08 — do not merge application code between tasks 01 and 08 without coordination |
| `AuditLog` FK still exists in DB            | Schema/client diverge from DB until task 02 migration drops the FK                                                                           |
| Accidental deletion of non-TestLab models   | Verify `OperationalUser`, `AuditLog`, `PasswordResetToken` remain intact before validate                                                     |

---

## Stop rule

**Stop after this task.** Report files changed, validation results, and known deviations. **Do not proceed to task 02 (drop TestLab migration) without explicit approval.**
