# USR-01 Task 05 — OperationalUser 1:1 Link to User

## Goal

Add a 1:1 relation from `OperationalUser` to the global `User` model via `userId`. Keep `cedulaHash` and `pinHash` on `OperationalUser` temporarily so MES cédula + PIN auth continues to work unchanged until a future MES auth refactor.

**Depends on:** Task 04 (`User` model exists in schema).

---

## Scope

- Add `userId String? @unique` on `OperationalUser` (nullable until task 09 backfill).
- Add `@relation` from `OperationalUser` to `User` (1:1).
- Add back-relation on `User`: `operationalProfile OperationalUser?`.
- Keep all existing `OperationalUser` fields unchanged, including:
  - `cedulaHash` — MES login lookup key (temporary)
  - `pinHash` — MES PIN verification (temporary)
  - `role OperationalRole` — inline enum (temporary; not replaced by `User.roleId` in this task)
  - `tenantId`, `sedeId`, lockout fields, `refreshToken`
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

### Design decisions

1. **Do not rename `OperationalUser` to `User`.** It remains an operational profile table mapped to `operational_users`.
2. **`userId` is required in schema** once backfill (task 09) is complete; consider making it optional (`String?`) in schema until backfill if existing DB rows would block migration — document choice in task 06 migration notes.
3. **`OperatorSession.operatorUserId`** continues to reference `OperationalUser.id` — no change in this task.
4. Auth fields duplicated between `User` and `OperationalUser` (`loginAttempts`, `lockedUntil`, `lastLoginAt`, `refreshToken`, `isActive`) remain on both models temporarily. Consolidation is a future MES auth epic — out of scope here.

---

## Out of scope

- No migrations (task 06 creates `userId` column).
- No data backfill (task 09).
- No changes to MES auth service, repository, or JWT strategy.
- No removal of `cedulaHash`, `pinHash`, or `OperationalRole`.
- No changes to `apps/api/src/`.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — add `userId` + relations on `OperationalUser` and `User` only

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

- [x] `OperationalUser.userId` exists as nullable `String?` with `@unique` constraint.
- [x] `OperationalUser` has `@relation` to `User`.
- [x] `User.operationalProfile OperationalUser?` back-relation exists.
- [x] `cedulaHash`, `pinHash`, and `OperationalRole` remain on `OperationalUser`.
- [x] `OperatorSession` relation to `OperationalUser` is unchanged.
- [x] No other model changes.
- [x] `npx prisma format` exits 0.
- [x] `npx prisma validate` exits 0.
- [x] `npx prisma generate` exits 0.

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

| Risk                                                   | Notes                                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Required `userId` blocks migration on existing rows    | Use nullable `userId` in schema + migration if needed; enforce NOT NULL after task 09 backfill |
| Duplicate auth state on two models                     | Document as temporary; MES continues using `OperationalUser` fields until refactor             |
| `User.tenantId` vs `OperationalUser.tenantId` mismatch | Backfill (task 09) must ensure both match                                                      |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 06 (User migration) without explicit approval.**
