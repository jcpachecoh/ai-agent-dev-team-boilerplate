# USR-01 Task 01b — Remap UserTestLab Table (Bridge)

## Goal

Free the physical PostgreSQL table name `users` for the future global `User` model by renaming TestLab's table to `users_testlab`, while keeping the Prisma model name `UserTestLab` and all auth code (`prisma.userTestLab`) unchanged.

**Replaces:** Superseded tasks 01 (remove TestLab schema) and 02 (drop TestLab migration).

**Depends on:** Task 03 (`Role`, `DocumentType` in schema).

---

## Scope

- Change `UserTestLab` from `@@map("users")` to `@@map("users_testlab")`.
- Create one migration that renames physical table `users` → `users_testlab`.
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Verify typecheck passes (auth unchanged).

---

## Out of scope

- No changes to TestLab model definitions beyond `@@map`.
- No dropping TestLab tables or models.
- No global `User` model (task 04).
- No changes to `OperationalUser`, `Role`, or `DocumentType`.
- No changes to `apps/api/src/**` or `seed.ts`.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — change `UserTestLab` `@@map` only
- `apps/api/prisma/migrations/<timestamp>_remap_user_testlab_table/migration.sql` — create

---

## Forbidden files

- Any file under `apps/api/src/`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Design decisions

- Prisma model stays `UserTestLab`; only the physical table name changes.
- PostgreSQL `ALTER TABLE ... RENAME TO ...` updates FK constraints referencing `users(id)` automatically — TestLab FKs remain valid.
- `AuditLog.user` → `UserTestLab` relation unchanged at Prisma level; FK target table becomes `users_testlab`.
- Physical table `users` is free for a future `User` model migration (task 06).

---

## Acceptance criteria

- [x] `UserTestLab` uses `@@map("users_testlab")`.
- [x] All TestLab models and enums remain in schema.
- [x] `AuditLog.user` relation to `UserTestLab` unchanged.
- [x] Migration renames `users` → `users_testlab` only (no drops).
- [x] `Role` and `DocumentType` unchanged.
- [x] No global `User` model added.
- [x] `pnpm prisma format` / `validate` / `generate` exit 0.
- [x] `pnpm --filter=@restopsiq/api typecheck` exits 0.

---

## Validation commands

```bash
cd apps/api
pnpm prisma format
pnpm prisma validate
pnpm prisma generate
pnpm --filter=@restopsiq/api typecheck
```

---

## Risks

| Risk                                            | Notes                                                                                     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Migration applied on DB without `users` table   | Fails safely; dev must have TestLab migrations applied                                    |
| Seed still references old table name via client | Prisma client uses `users_testlab` after generate — seed uses `userTestLab` delegate (OK) |
| Partial deploy                                  | Apply migration before deploying schema that expects `users_testlab`                      |

---

## Stop rule

**Stop after this task.** Do not proceed to task 04 (User schema) without explicit approval.
