# AUTH-02 Task 09 — Tests & Validation

## Goal

Consolidate gateway test coverage for AUTH-02 GraphQL auth delegation and run full gateway validation suite.

**Depends on:** Tasks 01–08 complete.

---

## Scope

- Ensure test files exist and pass:
  - `apps/gateway/tests/services/api-client.test.ts`
  - `apps/gateway/tests/context.test.ts` (dual JWT)
  - `apps/gateway/tests/resolvers/global-auth.test.ts`
  - `apps/gateway/tests/resolvers/global-me.test.ts`
  - `apps/gateway/tests/resolvers/operational-auth.test.ts`
- Add integration-style test (optional, mocked fetch) verifying end-to-end resolver → API path mapping for at least one global and one operational flow.
- Remove or update stale tests that assert Prisma auth behavior.
- Document manual smoke checklist in task report:
  - API on `:3001`, gateway on `:4000`
  - Global login → me → logout
  - Operational loginOperational → meOperational → logoutOperational
  - Verify LoginAudit rows via SQL or existing Postman audit docs (reference only)

**Out of scope:** Postman collection (task 10); API test changes unless task 05 tests already cover REST.

---

## Allowed files

- `apps/gateway/tests/**`
- `apps/gateway/jest.config.js` (only if test path config needed)

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/src/**` (unless fixing test-only compile issues — prefer no production code changes)
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] All AUTH-02 gateway test files pass.
- [x] `pnpm --filter=@restopsiq/gateway test` passes (full gateway suite).
- [x] `pnpm --filter=@restopsiq/gateway typecheck` passes.
- [x] No tests assert Prisma-direct auth login behavior.
- [x] Manual smoke checklist documented in implementation report.
- [x] No production code changes unless strictly required for test compilation (report if any).

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test
pnpm --filter=@restopsiq/gateway test:cov
```

Cross-check API auth still green (no API changes expected in this task):

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth
```

---

## Risks

| Risk                         | Notes                                        |
| ---------------------------- | -------------------------------------------- |
| Flaky fetch mocks            | Use deterministic mock responses             |
| Coverage gaps on error paths | At least one test per mutation error mapping |

---

## Stop rule

**Stop after this task.** Report test results and manual smoke checklist. **Do not proceed to task 10 without explicit approval.**
