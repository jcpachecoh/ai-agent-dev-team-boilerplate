# AUTH-02 Task 07 — Operational Auth GraphQL

## Goal

Implement operational GraphQL auth via REST delegation: `loginOperational`, `meOperational`, `logoutOperational`.

**Depends on:** Tasks 01–03 (client, context, types).

---

## Scope

Wire Pothos operations:

| Operation           | Type     | REST                        | Headers                                  |
| ------------------- | -------- | --------------------------- | ---------------------------------------- |
| `loginOperational`  | mutation | `POST /api/mes/auth/login`  | `x-tenant-id` required                   |
| `meOperational`     | query    | `GET /api/mes/auth/me`      | `Authorization: Bearer {mesAccessToken}` |
| `logoutOperational` | mutation | `POST /api/mes/auth/logout` | `Authorization: Bearer {mesAccessToken}` |

Implementation rules:

- Input: `{ cedula, pin }` only — tenant from `x-tenant-id` header.
- Return `{ accessToken, refreshToken, operator }` matching REST `MesAuthTokens`.
- Postman convention: GraphQL clients may store `accessToken` as `mesAccessToken` in tests (task 10).
- Auth scopes: operational token required for `meOperational` / `logoutOperational`; reject global token.
- Forward IP and user-agent for LoginAudit on login/logout.
- **Do not** implement operational `refreshToken` GraphQL mutation (deferred — no REST route).

**Out of scope:** Removing legacy Prisma `login` mutation (task 08); Postman (task 10).

---

## Allowed files

- `apps/gateway/src/schema/auth/**`
- `apps/gateway/src/schema/user/user.query.ts` (if relocating `meOperational` here)
- `apps/gateway/src/services/api-client.ts`
- `apps/gateway/tests/resolvers/operational-auth.test.ts` (new)

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/src/services/auth.service.ts` (no new usage)
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] `loginOperational` delegates to `POST /api/mes/auth/login` — no Prisma PIN verification in gateway.
- [x] Successful login returns `accessToken`, `refreshToken`, and `operator` object matching REST.
- [x] `meOperational` delegates to `GET /api/mes/auth/me`.
- [x] `logoutOperational` delegates to `POST /api/mes/auth/logout` (refresh cleared + jti blacklist on API).
- [x] Global access token rejected on operational queries/mutations.
- [x] Resolver tests mock API client; assert header forwarding including `x-tenant-id`.
- [x] LoginAudit rows created via API on success/failure (manual smoke note in report).

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test -- --testPathPattern=operational-auth
```

Manual smoke:

```bash
curl -s -X POST http://localhost:4000/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-tenant-id: palos-de-lena' \
  -d '{"query":"mutation { loginOperational(input: { cedula: \"12345678\", pin: \"1234\" }) { accessToken refreshToken operator { id role tenantId } } }"}'
```

---

## Risks

| Risk                          | Notes                                                                  |
| ----------------------------- | ---------------------------------------------------------------------- |
| Legacy `login` still present  | Task 08 removes duplicate                                              |
| web-app uses REST login today | GraphQL operational login optional for web-app; Postman covers AUTH-02 |
| Cédula HMAC env on API only   | Delegation ensures API hashing is used                                 |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 08 without explicit approval.**
