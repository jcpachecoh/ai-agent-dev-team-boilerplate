# AUTH-02 Task 11 — Global Email Auth GraphQL

## Goal

Add GraphQL parity for remaining global email/auth REST endpoints: `forgotPassword`, `resetPassword`, `resendVerification`.

**Depends on:** Tasks 04–10 (global auth GraphQL + Postman folder 10).

---

## Scope

| GraphQL mutation     | REST delegate                        | Headers                |
| -------------------- | ------------------------------------ | ---------------------- |
| `forgotPassword`     | `POST /api/auth/forgot-password`     | `x-tenant-id` required |
| `resetPassword`      | `POST /api/auth/reset-password`      | no `x-tenant-id`       |
| `resendVerification` | `POST /api/auth/resend-verification` | `x-tenant-id` required |

Input types: `ForgotPasswordInput` (email), `ResetPasswordInput` (token, newPassword), `ResendVerificationInput` (email).

Update Postman folder **10 — GraphQL Auth** with three requests and README parity notes.

**Out of scope:** Operational `refreshToken` (no REST route); `apps/api/**` changes.

---

## Acceptance criteria

- [x] Mutations `forgotPassword`, `resetPassword`, `resendVerification` delegate via `ApiClient`.
- [x] Tenant header rules match REST.
- [x] Outputs are `MessagePayload` only (no secrets).
- [x] Gateway tests cover delegation, missing tenant, and API error mapping.
- [x] Postman folder 10 includes the three new requests.
- [x] README documents full global auth/email GraphQL coverage.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/gateway typecheck
pnpm --filter=@restopsiq/gateway test
node scripts/validate-structure.js
node -e "JSON.parse(require('fs').readFileSync('postman/restopsiq-api.collection.json','utf8')); console.log('OK')"
```

---

## Stop rule

Stop after this task. Do not implement operational refresh GraphQL.
