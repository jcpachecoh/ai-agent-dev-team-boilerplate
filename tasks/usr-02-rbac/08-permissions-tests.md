# USR-02 Task 08 — Permissions Tests

## Goal

Add unit tests for permission resolution: repository mocks at service layer, service behavior for role grants, user ALLOW/DENY overrides, DENY-wins rule, inactive user rejection, and tenant mismatch.

**Depends on:** Task 07 (`PermissionsService` implemented).

---

## Scope

- Add tests under `apps/api/src/permissions/test/`:
  - `permissions.service.spec.ts` — mock repository; assert resolution formula
  - `permissions.repository.spec.ts` — optional; mock Prisma if valuable
- Test scenarios (minimum):

| #   | Scenario                                        | Expected                                                       |
| --- | ----------------------------------------------- | -------------------------------------------------------------- |
| 1   | User with OPERATOR role only                    | Returns role's seeded permission set (2 codes)                 |
| 2   | User with OWNER role                            | Returns full role permission set (13 codes)                    |
| 3   | User ALLOW override adds permission not in role | Permission present in effective set                            |
| 4   | User DENY override removes role permission      | Permission absent from effective set                           |
| 5   | Same permission ALLOW + DENY on user            | DENY wins — permission absent                                  |
| 6   | Inactive permission on role                     | Excluded from effective set                                    |
| 7   | User not found                                  | `NotFoundException`                                            |
| 8   | User `tenantId` ≠ argument `tenantId`           | `NotFoundException` or `ForbiddenException` — document in test |
| 9   | User `deletedAt` set                            | Treated as not found / denied                                  |
| 10  | `hasPermission` returns false for unlisted code | Fail closed                                                    |

- Use `TestingModule` importing `PermissionsModule` (module not in `app.module.ts`).
- Mock `PrismaService` or repository interface per project conventions.

---

## Out of scope

- No controller or guard integration tests (deferred).
- No e2e / Postman tests (task 09).
- No changes to schema, seed, migrations.
- No changes to MES or auth test suites unless compilation requires (should not).

---

## Allowed files

- `apps/api/src/permissions/test/**`

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/mes/**`
- `apps/api/src/auth/**` (unless compilation blocker — stop and report)
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Acceptance criteria

- [x] Service tests cover role-only resolution for at least OPERATOR and OWNER fixtures.
- [x] ALLOW override test passes.
- [x] DENY override test passes.
- [x] DENY-over-ALLOW test passes.
- [x] Inactive user / tenant mismatch / deleted user tests pass.
- [x] `hasPermission` fail-closed test passes.
- [x] All new tests pass in isolation:
  ```bash
  pnpm --filter=@restopsiq/api test -- --testPathPattern=permissions
  ```
- [x] Existing auth/mes test suites still pass (no regressions from module addition).

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=permissions
pnpm --filter=@restopsiq/api test -- --testPathPattern='auth|mes/auth'
```

---

## Risks

| Risk                  | Notes                                            |
| --------------------- | ------------------------------------------------ |
| Fixture drift vs seed | Use inline mock data in tests, not live DB       |
| Over-mocking          | Test resolution logic in service, not Prisma SQL |

---

## Stop rule

**Stop after this task.** Report test count and validation results. **Do not proceed to task 09 (validation) without explicit approval.**
