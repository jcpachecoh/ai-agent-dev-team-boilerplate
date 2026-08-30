# AUTH-02 Task 03 — GraphQL Auth Types

## Goal

Define Pothos GraphQL object types, input types, and enums for global and operational auth responses — without exposing secrets.

**Depends on:** Task 02 (auth scopes available for field wiring in later tasks).

---

## Scope

Add schema types under `apps/gateway/src/schema/auth/` (new files as needed):

### Output types

- `GlobalAuthTokens` — `{ accessToken, refreshToken }`
- `GlobalUser` — safe profile fields (id, tenantId, email, cedula, documentType, emailVerified, isActive, roleCode, createdAt)
- `OperationalAuthTokens` — `{ accessToken, refreshToken, operator }`
- `OperationalUser` — align with REST `MesMeResponse` + safe fields (no `pinHash`, `cedulaHash`, `refreshToken`)
- `MessagePayload` — `{ message }` for verifyEmail / changePassword

### Input types

- `SignupInput` — email, password, cedula, documentType, optional roleCode
- `GlobalLoginInput` — email, password
- `RefreshTokenInput` — optional if refresh passed via header only (document chosen approach)
- `VerifyEmailInput` — otpCode (6 chars)
- `ChangePasswordInput` — currentPassword, newPassword (resolver wired in task 06)
- `OperationalLoginInput` — cedula, pin

### Enums

- `DocumentType` — mirror Prisma/API enum values used in signup

Rename or namespace existing `AuthResponse` / `UserObject` if they conflict with global types (e.g. keep `UserObject` for operational profile until task 08, or introduce `GlobalUserObject` now).

**Out of scope:** Resolver implementations that call API; deprecating legacy mutations (task 08).

---

## Allowed files

- `apps/gateway/src/schema/auth/**` (new type modules, e.g. `auth.types.ts`)
- `apps/gateway/src/schema/user/user.ts` (rename/clarify operational type only if required for schema consistency)
- `apps/gateway/src/schema/index.ts` (imports only)
- `apps/gateway/src/utils/validation.ts` (Zod schemas for new inputs only)

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/src/services/auth.service.ts`
- `apps/gateway/src/context/**` (unless compile fix from task 02)
- `postman/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] All target input/output types registered in Pothos schema (introspection shows them).
- [x] No field exposes `passwordHash`, `pinHash`, `cedulaHash`, stored `refreshToken`, or raw secrets.
- [x] `GlobalAuthTokens` and `OperationalAuthTokens` both expose `accessToken` + `refreshToken` matching REST JSON shape.
- [x] `GlobalUser` and operational profile types are distinct GraphQL types.
- [x] Schema builds without resolver implementations (stub resolvers or no root fields yet is OK if schema compiles — prefer minimal placeholder fields only if required by Pothos).
- [x] Gateway typecheck passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test -- --passWithNoTests
```

---

## Risks

| Risk                                             | Notes                                                      |
| ------------------------------------------------ | ---------------------------------------------------------- |
| Name collision with existing `User` GraphQL type | Use `GlobalUser` vs `OperationalUser` naming per decisions |
| Registering mutations prematurely                | Types-only task; wire resolvers in tasks 04–07             |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 04 without explicit approval.**
