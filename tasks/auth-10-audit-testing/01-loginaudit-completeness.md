# AUTH-10 Task 01 — LoginAudit Completeness

## Goal

Fix MES LoginAudit `userId` mapping, align GraphQL IP/User-Agent forwarding with REST, and extend unit tests so auth audit behavior is correct and measurable.

**Depends on:** Task 00. **Blocks:** Task 02 (DB-backed integration assertions).

---

## Scope

### MES `userId` mapping

In `MesAuthService`, every `auditService.logLogin` call must set:

```text
userId = operationalUser.userId ?? null
```

Never pass `OperationalUser.id` into `LoginAudit.userId`.

Apply to: format failure, rate limit, not found, inactive, locked, wrong PIN, success, logout.

### Preserve existing audit semantics

- `authMethod`: `PIN` for MES login/logout.
- `identifier`: masked cédula on login paths (`maskCedula`).
- `status`: `SUCCESS`, `FAILED`, `LOCKED`, `LOGOUT` unchanged.
- Rate limit remains `FAILED` with `failureReason: 'Rate limit exceeded'`.

### Global auth

- **No** change to global `userId` mapping (already `User.id`).
- **No** signup / password-reset LoginAudit unless explicitly required — out of scope.

### GraphQL IP / User-Agent (low-risk)

- `AuthResolver`: pass `getClientIpFromContext` / `getUserAgentFromContext` into `login`, `refresh`, `logout` service calls (match REST).
- `MesAuthResolver.logoutOperational`: pass IP/UA into `mesAuthService.logout` (match REST + `loginOperational`).

### Unit tests

- Update `mes-auth.service.spec.ts` expectations: `userId` from `OperationalUser.userId`, not `id`.
- Add cases:
  - Pure operational user (`userId: null`) → audit payload `userId: null`.
  - Linked operational user (`userId: '<global-user-id>'`) → audit payload uses global id.
- Update `auth.resolver.spec.ts` / `mes-auth.resolver.spec.ts` for IP/UA delegation (mock context headers).
- Optional: `audit.repository.spec.ts` — assert P2003 still swallowed (no behavior change).

### Out of scope

- Prisma schema / migrations.
- Changing `AuditRepository` P2003 swallow policy.
- Global progressive lockout (`loginAttempts` increment).
- Logout `identifier` format change (cedulaHash vs masked) unless trivially improved without new PII exposure.
- Postman / E2E (Task 02).

## Allowed files

- `apps/api/src/mes/auth/service/mes-auth.service.ts`
- `apps/api/src/mes/auth/test/mes-auth.service.spec.ts`
- `apps/api/src/auth/resolver/auth.resolver.ts`
- `apps/api/src/auth/test/auth.resolver.spec.ts`
- `apps/api/src/mes/auth/resolver/mes-auth.resolver.ts`
- `apps/api/src/mes/auth/test/mes-auth.resolver.spec.ts`
- `apps/api/src/common/graphql/tenant-from-context.ts` — **only if** helper adjustments required (prefer no change)

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/service/auth.service.ts` — unless a one-line import of shared helper is rejected; prefer all MES changes in mes-auth only
- `apps/api/src/audit/**` — no repository swallow changes in this task
- `postman/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`

## Acceptance criteria

- [x] MES login success writes `LoginAudit` with `userId = OperationalUser.userId ?? null` (unit test).
- [x] MES login failure paths use the same `userId` rule (wrong PIN, locked, inactive).
- [x] Unknown cédula audit has `userId: null` (not operational id).
- [x] Linked seed-style user (`userId` set) audit persists global `User.id` in payload (unit test).
- [x] GraphQL global `login` / `refresh` / `logout` forward IP and user-agent when present in context.
- [x] GraphQL `logoutOperational` forwards IP and user-agent.
- [x] Existing MES/global audit status enums unchanged.
- [x] No raw cédula or PIN in `identifier` on login paths.

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern='mes-auth\.service|auth\.resolver|mes-auth\.resolver'
pnpm --filter=@restopsiq/api exec jest --coverage \
  --testPathPattern='(auth|audit|mes/auth)/test/' \
  --collectCoverageFrom='auth/service/auth.service.ts' \
  --collectCoverageFrom='mes/auth/service/mes-auth.service.ts' \
  --collectCoverageFrom='audit/service/audit.service.ts' \
  --collectCoverageFrom='audit/repository/audit.repository.ts' \
  --coveragePathIgnorePatterns='test/' \
  --coverageReporters=text-summary
```

Record coverage summary in task completion report. Target **≥90% lines** on `mes-auth.service.ts` and `audit.service.ts` / `audit.repository.ts`.

## Risks

| Risk                                                          | Mitigation                                                       |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Tests still assert `userId: baseUser.id`                      | Update all `logLogin` expectations in `mes-auth.service.spec.ts` |
| GraphQL `getClientIpFromContext` returns `'unknown'` in tests | Set `x-forwarded-for` in mock context                            |
| Linked user tests need fixture                                | Extend `baseUser` with optional `userId` field in spec           |

## Stop rule

Stop after validation passes and completion report is delivered. Do not start Task 02 (integration/E2E/Postman) in this task.
