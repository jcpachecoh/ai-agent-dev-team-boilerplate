# AUTH-02 Task 08 — Deprecate Legacy Gateway Prisma Auth

## Goal

Remove or replace legacy GraphQL auth that uses Prisma-direct operational login and no-op logout/refresh, ensuring AUTH-02 operations are the only auth entry points on the gateway schema.

**Depends on:** Tasks 04, 06, 07 (replacement operations implemented).

---

## Scope

- Remove or replace in `apps/gateway/src/schema/auth/auth.mutation.ts`:
  - Legacy `login(cedula, pin, tenantId)` → use `loginOperational` only
  - Legacy no-op `logout` → use `logout` (global) and `logoutOperational`
  - Legacy `refreshToken` (local re-sign) → use global `refreshToken` delegate
- Update `apps/gateway/src/schema/user/user.query.ts`:
  - Legacy `me` (OperationalUser via Prisma) → `meOperational` delegate OR remove if duplicate of task 07
- Stop using `GatewayAuthService.loginWithPin` from GraphQL resolvers.
- Remove dead auth paths from `apps/gateway/src/services/auth.service.ts` **only if** no other gateway code depends on them; if suppliers/recipes still import it, leave service file but remove login/logout auth methods or mark unused with tests proving no GraphQL path calls Prisma auth.
- Update `apps/gateway/tests/resolvers/auth.test.ts` to target new delegate behavior or remove obsolete tests.
- Update web-app breaking references **only if** compile fails in monorepo typecheck — prefer documenting breaking change for follow-up unless trivial import fix in allowed files.

**Out of scope:** Migrating non-auth gateway Prisma services (suppliers, etc.); Postman (task 10).

---

## Allowed files

- `apps/gateway/src/schema/auth/**`
- `apps/gateway/src/schema/user/user.query.ts`
- `apps/gateway/src/services/auth.service.ts` (remove auth login methods if safe)
- `apps/gateway/tests/resolvers/auth.test.ts`
- `apps/gateway/src/utils/validation.ts` (remove legacy `LoginSchema` if unused)

---

## Forbidden files

- `apps/api/**`
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`
- Non-auth gateway services (supplier, recipe, etc.) unless required to remove broken imports from auth.service

---

## Acceptance criteria

- [x] No GraphQL resolver calls `GatewayAuthService.loginWithPin` or Prisma for auth.
- [x] No GraphQL field named `login` accepts cédula/PIN unless renamed to `loginOperational`.
- [x] Global and operational auth fields match task 00 naming (`login`, `logout`, `refreshToken`, `me` vs `loginOperational`, `logoutOperational`, `meOperational`).
- [x] Legacy no-op `logout` and local JWT re-sign `refreshToken` removed.
- [x] Gateway tests updated; obsolete Prisma auth tests removed or rewritten.
- [x] `pnpm --filter=@restopsiq/gateway test` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test
```

Grep guard (manual check in report):

```bash
rg "loginWithPin|operationalUser\.findUnique" apps/gateway/src/schema/auth apps/gateway/src/schema/user
```

Expect no matches in auth resolver paths.

---

## Risks

| Risk                                         | Notes                                       |
| -------------------------------------------- | ------------------------------------------- |
| web-app relied on old GraphQL `login`        | web-app uses REST login per epic — low risk |
| Other code imports `GatewayAuthService`      | Narrow removal to GraphQL auth usage only   |
| Breaking change for external GraphQL clients | Document in task 10 README                  |

---

## Stop rule

**Stop after this task.** Report files changed, grep results, and validation. **Do not proceed to task 09 without explicit approval.**
