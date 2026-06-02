# AUTH-02 Task 10 — Postman GraphQL Auth

## Goal

Add Postman folder **`10 — GraphQL Auth`** with GraphQL requests against `http://localhost:4000/graphql`, reusing existing token variables and documenting parity with REST token semantics.

**Depends on:** Tasks 04–08 (GraphQL operations live); task 09 recommended before Postman finalization.

---

## Scope

Update Postman collection and README:

### Collection (`postman/restopsiq-api.collection.json`)

Add folder **`10 — GraphQL Auth`** with requests (GraphQL POST body):

| Request            | Operation                    | Headers                                    | Captures                                                 |
| ------------------ | ---------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| Signup             | `mutation Signup`            | `x-tenant-id: {{tenantId}}`                | optional tokens                                          |
| Login              | `mutation Login`             | `x-tenant-id: {{tenantId}}`                | `accessToken`, `refreshToken`, `globalUserId`            |
| Me                 | `query Me`                   | `Authorization: Bearer {{accessToken}}`    | —                                                        |
| Refresh Token      | `mutation RefreshToken`      | `Authorization: Bearer {{refreshToken}}`   | new tokens                                               |
| Logout             | `mutation Logout`            | `Authorization: Bearer {{accessToken}}`    | —                                                        |
| Verify Email       | `mutation VerifyEmail`       | none                                       | —                                                        |
| Change Password    | `mutation ChangePassword`    | `Authorization: Bearer {{accessToken}}`    | —                                                        |
| Login Operational  | `mutation LoginOperational`  | `x-tenant-id: {{tenantId}}`                | `mesAccessToken`, `mesRefreshToken`, `operationalUserId` |
| Me Operational     | `query MeOperational`        | `Authorization: Bearer {{mesAccessToken}}` | —                                                        |
| Logout Operational | `mutation LogoutOperational` | `Authorization: Bearer {{mesAccessToken}}` | —                                                        |

**Task 11 extension** adds: Forgot Password, Reset Password, Resend Verification (see `11-global-email-auth-graphql.md`).

### Environment (`postman/local.environment.json`)

- Add `graphqlUrl` = `http://localhost:4000/graphql` (if not present).
- Reuse: `tenantId`, `accessToken`, `refreshToken`, `mesAccessToken`, `mesTokenOwner`, `mesTokenOperator`, `globalUserId`, `operationalUserId`.

### README (`postman/README.md`)

- Document folder `10 — GraphQL Auth`.
- Prerequisites: **both** `apps/api` (`:3001`) and `apps/gateway` (`:4000`) running.
- State explicitly: GraphQL token fields match REST (`accessToken` / `refreshToken`); operational GraphQL stores access token in `mesAccessToken` variable (same as REST folder 02).
- Note: GraphQL pre-request auto-login for global REST does **not** apply to GraphQL folder — run Login requests explicitly or add folder-level scripts.
- Newman example for GraphQL folder only.

**Out of scope:** Newman CI wiring; web-app env changes.

---

## Allowed files

- `postman/restopsiq-api.collection.json`
- `postman/local.environment.json`
- `postman/README.md`

---

## Forbidden files

- `apps/api/**`
- `apps/gateway/**`
- `apps/web-app/**`
- `apps/api/prisma/**`
- `package.json` / `pnpm-lock.yaml`

---

## Acceptance criteria

- [x] Folder `10 — GraphQL Auth` exists with all listed requests.
- [x] All requests target `{{graphqlUrl}}` or `http://localhost:4000/graphql`.
- [x] Global requests use `{{accessToken}}` / `{{refreshToken}}` — never `mesAccessToken`.
- [x] Operational requests use `{{mesAccessToken}}` — never `accessToken` for plant/MES semantics.
- [x] Test scripts capture tokens from `data.login`, `data.loginOperational`, etc.
- [x] README documents dual-server prerequisite and token parity with REST folders 01/02.
- [x] Collection JSON remains valid Postman v2.1 (importable).

---

## Validation commands

Manual import validation:

1. Import collection + environment in Postman.
2. Start API + gateway.
3. Run folder `10 — GraphQL Auth` top-to-bottom after seed.

Optional Newman:

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "10 — GraphQL Auth" \
  --bail
```

JSON sanity:

```bash
node -e "JSON.parse(require('fs').readFileSync('postman/restopsiq-api.collection.json','utf8')); console.log('OK')"
```

---

## Risks

| Risk                                  | Notes                                                               |
| ------------------------------------- | ------------------------------------------------------------------- |
| GraphQL field names differ from draft | Align mutation/query names with implemented schema from tasks 04–07 |
| Verify email needs seeded OTP         | Document manual OTP step or skip automated assert                   |
| Signup creates duplicate users        | Use unique email in pre-request script or document one-time run     |

---

## Stop rule

**Stop after this task.** Report Postman files changed and manual/Newman run results. **AUTH-02 epic complete — do not start unrelated work.**
