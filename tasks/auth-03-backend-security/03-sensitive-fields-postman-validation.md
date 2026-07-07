# AUTH-03 Task 03 — Sensitive Fields, GraphQL Review, Postman, Closure

## Goal

Ensure no sensitive fields leak in REST/GraphQL responses; confirm gateway delegates security to API; add Postman negative cases; run final validation for AUTH-03.

**Depends on:** Tasks 01 and 02 complete.

---

## Scope

### Sensitive field protection (API)

- Audit `AuthRepository` selects, `AuthService` return types, `AuthController` / `mes-auth` controller responses, `me` DTOs.
- Confirm responses never include: `passwordHash`, `refreshToken`, `pinHash`, `cedulaHash`, raw reset tokens.
- Confirm `AuditService.redact` covers auth-related payloads (existing blacklist — extend only if gap found).
- Add/strengthen tests: `not.toHaveProperty` for secrets on login, signup, me, refresh, MES login/me.

### GraphQL delegation security review

- Verify `apps/gateway/src/schema/auth/**` resolvers use `ApiClient` only (no Prisma auth, no local bcrypt/JWT issue).
- Verify GraphQL output types exclude secrets (`auth.types.ts`).
- Verify REST error mapping (401/409/400) preserved for auth mutations.
- Add tests only if gaps found (e.g. signup error mapping, me response shape).

### Postman (`postman/restopsiq-api.collection.json` + `README.md`)

Add or tighten **01 — Global Auth** (and folder **10 — GraphQL Auth** mirrors where useful):

| Case                                    | Expected                                          |
| --------------------------------------- | ------------------------------------------------- |
| Signup duplicate **email**              | 409, safe body, no `passwordHash`                 |
| Signup duplicate **cédula** (new email) | 409                                               |
| Signup **weak password** (≤ 8 chars)    | 400                                               |
| Login **5× wrong password** → lockout   | 401; optional note to check `login_audits` LOCKED |
| Login / Me / Signup                     | response lacks `passwordHash`, `refreshToken`     |
| GraphQL login/me (folder 10)            | same leak checks on `data.*`                      |

Document limitations: expired JWT manual test (edit token or wait TTL).

### Final validation

- Run full auth-related test suites (API + gateway).
- Postman collection JSON valid (syntax).
- Update `00-analysis-decisions.md` status section to **Done** per requirement (checkboxes only in tasks folder).

**Out of scope:** New features beyond leak prevention and Postman; schema changes.

---

## Allowed files

- `apps/api/src/auth/repository/auth.repository.ts`
- `apps/api/src/auth/service/auth.service.ts`
- `apps/api/src/auth/controller/auth.controller.ts`
- `apps/api/src/auth/controller/dto/me-response.dto.ts`
- `apps/api/src/auth/interfaces/auth.interfaces.ts`
- `apps/api/src/auth/test/*.spec.ts`
- `apps/api/src/mes/auth/controller/dto/mes-auth-response.dto.ts`
- `apps/api/src/mes/auth/service/mes-auth.service.ts`
- `apps/api/src/mes/auth/repository/mes-auth.repository.ts`
- `apps/api/src/mes/auth/test/*.spec.ts`
- `apps/api/src/audit/service/audit.service.ts`
- `apps/api/src/audit/test/audit.service.spec.ts`
- `apps/gateway/src/schema/auth/**`
- `apps/gateway/src/services/api-client.ts`
- `apps/gateway/tests/resolvers/global-auth.test.ts`
- `apps/gateway/tests/resolvers/auth-delegation.integration.test.ts`
- `apps/gateway/tests/resolvers/operational-auth.test.ts`
- `postman/restopsiq-api.collection.json`
- `postman/README.md`
- `tasks/auth-03-backend-security/00-analysis-decisions.md`

---

## Forbidden files

- `apps/api/prisma/schema.prisma` / `migrations/**`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `scripts/validate-structure.js`
- Unrelated modules (suppliers, plant, etc.)

---

## Acceptance criteria

- [x] No auth REST or GraphQL response exposes `passwordHash`, `refreshToken`, `pinHash`, or `cedulaHash`.
- [x] Gateway auth resolvers delegate to REST; no new security logic in gateway.
- [x] Postman includes duplicate email, duplicate cédula, weak password, and sensitive-field assertions.
- [x] Postman documents lockout test steps (and JWT expiry limitation).
- [x] Unit tests assert secret fields absent on key endpoints.
- [x] All validation commands pass.
- [x] `00-analysis-decisions.md` updated with final implementation status.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern="auth|mes-auth|audit\.service"
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/gateway test -- --testPathPattern="auth|api-client"
pnpm --filter=@restopsiq/gateway typecheck
node -e "JSON.parse(require('fs').readFileSync('postman/restopsiq-api.collection.json','utf8')); console.log('Postman JSON OK')"
```

---

## Risks

| Risk                               | Mitigation                                                 |
| ---------------------------------- | ---------------------------------------------------------- |
| Lockout Postman flaky on shared DB | Use dedicated test user or reset `loginAttempts` in README |
| Over-broad Postman edits           | Only auth folders 01, 02 (if needed), 10                   |
| GraphQL folder duplicates REST     | Cross-reference README                                     |

---

## Stop rule

AUTH-03 epic complete after this task. Do not open follow-up implementation without a new ticket.
