# USR-01 Task 07 — Seed Update

## Goal

Update `apps/api/prisma/seed.ts` to seed `Role`, global `User`, and linked `OperationalUser` records for local dev and Postman fixtures. **Keep** `UserTestLab` seed until Task 08 repoints email auth.

**Depends on:** Task 06 (DB tables exist).

---

## Scope

- Keep `prisma.userTestLab.upsert` (auth still uses `users_testlab` until Task 08).
- Add seed for default `Role` records per operational tenant (e.g. `palos-de-lena`):
  - Codes aligned with `OperationalRole`: OWNER, SUPERVISOR, MANAGER, OPERATOR (and any admin roles needed for email auth test user).
- Add seed for global `User` record(s):
  - Email/password test user (replaces `test@restopsiq.dev` TestLab user) with `tenantId`, `cedula`, `documentType`, `passwordHash` (bcrypt cost 12), `roleId`, etc.
- Update MES operational user seed:
  - Create or update `User` row first, then `OperationalUser` with `userId` pointing to that `User`.
  - Keep `cedulaHash` and `pinHash` on `OperationalUser` for MES login compatibility.
  - Populate `User.cedula` with plain cédula matching seeded MES credentials (12345678, 87654321).
- Use deterministic CUIDs where existing Postman/env fixtures depend on them (update IDs in comments if they change).
- Update seed file header comments to reflect new auth model.
- Run `pnpm db:seed` successfully.

---

## Out of scope

- No changes to `apps/api/src/auth/**` (task 08).
- No Postman collection updates (task 10 or separate follow-up).
- No production data migration.
- No removal of `OperationalRole` from `OperationalUser` seed.

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

Suggested seed order:

1. Upsert `Role` rows for `OPERATIONAL_TENANT_ID`.
2. Upsert global `User` for email auth test account (`test@restopsiq.dev` or equivalent).
3. Upsert MES owner `User` + `OperationalUser` (linked via `userId`).
4. Upsert MES operator `User` + `OperationalUser` (linked via `userId`).
5. Existing supply category / supply item seed blocks remain unchanged.

Password hashing: use `SALT_ROUNDS = 12` (bcrypt), consistent with existing seed.

---

## Acceptance criteria

- [x] `UserTestLab` seed retained for email auth until Task 08.
- [x] `Role` records seeded for operational tenant (OWNER, SUPERVISOR, MANAGER, OPERATOR).
- [x] Global `User` rows seeded for MES owner and operator with valid `roleId`, `tenantId`, `cedula`, `documentType`, `passwordHash`.
- [x] MES owner and operator `OperationalUser` rows have `userId` linking to corresponding `User` rows.
- [x] `OperationalUser.cedulaHash` and `pinHash` still seeded for MES login.
- [x] `User.cedula` populated with plain cédula values for MES users.
- [x] `pnpm db:seed` exits 0 against a database with task 06 migration applied.

---

## Validation commands

```bash
cd apps/api
pnpm db:seed
```

---

## Risks

| Risk                                 | Notes                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Postman env IDs stale                | Document new user IDs in seed console output; update Postman in task 10 |
| `User.roleId` FK failure             | Seed roles before users                                                 |
| Duplicate email/cedula per tenant    | Use upsert with correct unique compound keys                            |
| Auth module still uses `UserTestLab` | Seed succeeds but email auth API broken until task 08                   |

---

## Stop rule

**Stop after this task.** Report seed output, new fixture IDs, and validation results. **Do not proceed to task 08 (auth repoint) without explicit approval.**
