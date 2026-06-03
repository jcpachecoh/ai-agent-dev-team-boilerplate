# RestOpsIQ — Postman Collection

Automated API test collection for the RestOpsIQ platform.

- **~61 live HTTP requests** plus **13 GraphQL auth requests** (plus **3 documentation-only** requests and **18 legacy TestLab** requests marked DO NOT RUN).
- **Postman Collection v2.1** — importable into Postman Desktop or runnable via Newman CLI.
- **Dynamic variable capture** — POST create responses feed IDs into subsequent requests automatically.
- **Auto-login pre-request script** — global `accessToken` is refreshed transparently; `x-tenant-id` is injected on tenant-scoped routes.

---

## Files

| File                            | Purpose                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `restopsiq-api.collection.json` | Main Postman collection (v2.1)                                            |
| `local.environment.json`        | Single local environment for `http://localhost:3001` and `{{graphqlUrl}}` |
| `README.md`                     | This file                                                                 |

---

## Prerequisites

### 1. API running locally

```bash
cd apps/api
pnpm run start:dev
```

The API must be reachable at `http://localhost:3001` (default `PORT`).

### 2. GraphQL gateway (folder **10 — GraphQL Auth** only)

```bash
cd apps/gateway
pnpm run dev
```

The gateway must be reachable at `http://localhost:4000/graphql` (`{{graphqlUrl}}` in the environment). GraphQL auth mutations/queries delegate to the same REST auth endpoints on `:3001` — **both processes must be running** for folder 10.

### 3. Seeded database

```bash
cd apps/api && pnpm db:seed
```

| Variable       | Seeded value                           | Used for                 |
| -------------- | -------------------------------------- | ------------------------ |
| `tenantId`     | `palos-de-lena`                        | Primary tenant header    |
| `email`        | `mes-owner@palos-de-lena.dev`          | Global Auth Login        |
| `password`     | `TestPass123!`                         | Global Auth Login        |
| `categoryId`   | `bbbbbbbb-0000-0000-0000-000000000002` | Supply Items create      |
| `supplyItemId` | `ffffffff-0000-0000-0000-000000000006` | Seed item / phase inputs |

> After `pnpm db:seed`, **`local.environment.json`** is pre-filled with the values above plus operational cédula/PIN, seeded User/OperationalUser ids, and `categoryId`. **Tokens stay empty** until you run Login requests or the collection pre-request script fills `accessToken`.
>
> **USR-01:** Global auth uses `users` + `x-tenant-id`. `test@restopsiq.dev` is **TestLab-only** (legacy folder 99) and will **not** work for `/api/auth/login`.

---

## Import into Postman Desktop

1. Open Postman → **Import** → select `restopsiq-api.collection.json` and `local.environment.json`.
2. Select environment **RestOpsIQ — Local** (top-right).
3. Run **00 — Setup / Health → GET Health**, then **01 — Global Auth → Login**, then **02 — Operational Auth / Plant Floor Login → Login Owner**.

### Separate token/ID state (optional, local only)

`local.environment.json` is the **only** committed local environment. If you want separate captured tokens or IDs for plant/recipes work vs supply-items (without overwriting the same variables), duplicate **RestOpsIQ — Local** inside the Postman UI (Environments → ⋮ → Duplicate). Use that copy only on your machine — **do not commit** duplicated environment exports.

---

## Run via Newman (CLI)

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --reporters cli \
  --bail
```

Run a single folder:

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "04 — Supply Items" \
  --bail
```

GraphQL auth only (requires API **and** gateway):

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "10 — GraphQL Auth" \
  --bail
```

**Do not** include folder `99 — Legacy / Deprecated` in CI/Newman full runs — TestLab routes were removed (USR-01).

---

## Collection Structure

Numeric neutral folders follow the E2E story:

```
RestOpsIQ API
│
│  Pre-request: inject x-tenant-id + auto-login (global User only)
│  Default auth: Bearer {{accessToken}}
│  Plant/operational override: Bearer {{mesAccessToken}}
│
├── 00 — Setup / Health          (1 live)
│   └── GET /api/
│
├── 01 — Global Auth             (14 live — USR-01 email/password)
│   ├── 01 Session               Signup, Login, Refresh, Logout (POST /api/auth/logout)
│   ├── 02 Email Verification    Resend, Verify, Invalid OTP
│   ├── 03 Password Reset        Forgot, Reset, invalid/reused token
│   └── 04 Login Audit Triggers  Invalid password, unknown email (USR-05)
│
├── 02 — Operational Auth / Plant Floor Login  (8 live — cédula + PIN)
│   ├── 01 Login & Session       Login Owner, Login Operator, Me, Logout (POST /api/mes/auth/logout)
│   ├── 02 User Management       Get User Role, Create User
│   └── 03 Negative Cases        Wrong PIN, missing x-tenant-id
│
├── 03 — Users / Operational Users   (1 doc — USR-01 / USR-06)
│
├── 04 — Supply Items            (7 live — Bearer {{accessToken}} + x-tenant-id)
│
├── 05 — Plant Masters           (16 live — Bearer {{mesAccessToken}})
│
├── 06 — Production Orders       (10 live — MES-05 lifecycle)
│
├── 07 — Incidents & Alarms (MES-08)  (6 live — operator + supervisor tokens)
│
├── 08 — Audit Verification      (1 doc — SQL only, USR-05)
│
├── 09 — RBAC Foundation         (1 doc — seeded permissions, USR-02)
│
├── 10 — GraphQL Auth            (13 live — POST {{graphqlUrl}}, AUTH-02)
│   └── Global session + email (signup/login/me/refresh/change/verify/forgot/reset/resend/logout)
│       Operational (loginOperational, meOperational, logoutOperational)
│
└── 99 — Legacy / Deprecated     (18 live TestLab — DO NOT RUN)
    └── TestLab — DO NOT RUN     /api/testlab/* removed from API
```

---

## Hybrid Auth Architecture

RestOpsIQ uses **two separate login flows**. USR-01 added a global `User` (email/password); operational plant login (`OperationalUser`, cédula/PIN) was **not removed**.

| Flow                 | Identity               | Login                                  | Token variable       | Routes                         |
| -------------------- | ---------------------- | -------------------------------------- | -------------------- | ------------------------------ |
| **Global Auth**      | `User` (tenant-scoped) | Email + password via `/api/auth/*`     | `{{accessToken}}`    | Supply items, back-office APIs |
| **Operational Auth** | `OperationalUser`      | Cédula + PIN via `/api/mes/auth/login` | `{{mesAccessToken}}` | `/api/plant/*`, `/api/mes/*`   |

**Important:**

- `{{accessToken}}` and `{{mesAccessToken}}` are **not interchangeable** (different JWT strategies, payloads, and `sub` IDs).
- `OperationalUser.userId` may link to `User.id` in the database, but you still log in separately for each flow.
- Global logout: `POST /api/auth/logout` with `Bearer {{accessToken}}`.
- Operational logout: `POST /api/mes/auth/logout` with `Bearer {{mesAccessToken}}`.

---

## x-tenant-id Requirements

The collection pre-request script injects `x-tenant-id` from `pm.variables.get('tenantId')` with fallback `palos-de-lena` (local/dev only).

| Requires `x-tenant-id`                                           | Does **not** require `x-tenant-id` |
| ---------------------------------------------------------------- | ---------------------------------- |
| `POST /api/auth/signup`                                          | `POST /api/auth/refresh`           |
| `POST /api/auth/login`                                           | `POST /api/auth/logout`            |
| `POST /api/auth/forgot-password`                                 | `POST /api/auth/reset-password`    |
| `POST /api/auth/resend-verification`                             | `POST /api/auth/verify-email`      |
| `POST /api/mes/auth/login` (except negative missing-tenant test) | `GET /api/mes/auth/me`             |
| All `/api/supply-items/*`                                        | `/api/mes/users/*`                 |
|                                                                  | All `/api/plant/*`                 |

**Troubleshooting missing tenant:** If Forgot Password or Login returns `400 x-tenant-id header is required`, ensure `tenantId` is set in the active environment (`palos-de-lena`) and re-import the collection (pre-request injection). The negative test **Login — Missing x-tenant-id** intentionally skips injection.

`{{mesTenantId}}` is a **legacy alias** of `{{tenantId}}` — prefer `tenantId`.

---

## Token Strategy

| Variable             | Identity          | Set by                                                | Used for                                                           |
| -------------------- | ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| `accessToken`        | Global `User`     | **01 — Global Auth → Login** / pre-request auto-login | `/api/auth/*` (protected), **04 — Supply Items** (`+ x-tenant-id`) |
| `refreshToken`       | Global `User`     | Global Login                                          | `POST /api/auth/refresh`                                           |
| `globalUserId`       | Global `User`     | Global Login JWT `sub`                                | Reference — `users.id`                                             |
| `mesAccessToken`     | `OperationalUser` | **02 — Operational Auth → Login Owner**               | `/api/plant/*`, `/api/mes/*` (no `x-tenant-id`)                    |
| `mesTokenOwner`      | `OperationalUser` | Login Owner (same JWT as `mesAccessToken`)            | Explicit owner session alias                                       |
| `mesTokenSupervisor` | `OperationalUser` | Login Owner (alias of `mesAccessToken`)               | MES-08 supervisor+ requests (list/resolve incidents)               |
| `mesTokenOperator`   | `OperationalUser` | Login Operator                                        | MES-08 operator requests (create incident)                         |
| `mesRefreshToken`    | `OperationalUser` | Login Owner                                           | Operational session reference (no refresh HTTP route)              |
| `operationalUserId`  | `OperationalUser` | Login Owner JWT `sub`                                 | `/api/mes/users/*` URLs                                            |
| `mesUserId`          | `OperationalUser` | Legacy alias of `operationalUserId`                   | Backward compatibility                                             |

**Rules:**

- Never send `{{accessToken}}` to `/api/plant/*` or `/api/mes/*`.
- Never send `{{mesAccessToken}}` to `/api/supply-items/*`.
- Operational/plant routes are excluded from global auto-login so they never overwrite `mesAccessToken`.
- Operational login response field is `accessToken` in JSON — the collection stores it in `mesAccessToken`, not `accessToken`.
- **GraphQL (folder 10):** same token variables as REST folders 01/02 — `data.login.accessToken` → `{{accessToken}}`; `data.loginOperational.accessToken` → `{{mesAccessToken}}`. Global GraphQL requests never use `mesAccessToken`; operational GraphQL requests never use `accessToken`.

---

## AUTH-02 — GraphQL Auth (folder 10)

Folder **10 — GraphQL Auth** exercises auth through `{{graphqlUrl}}` (`http://localhost:3001/graphql` on `apps/api`). Each request is a GraphQL POST using the same auth services as folders **01 — Global Auth** and **02 — Operational Auth**.

**Global auth/email parity:** GraphQL now covers the full global auth surface from REST folder **01** (session + email flows). Operational **refresh** is still REST-only — there is no `POST /api/mes/auth/refresh` endpoint.

| Request             | GraphQL operation             | Auth header                 | Notes                                                    |
| ------------------- | ----------------------------- | --------------------------- | -------------------------------------------------------- |
| Signup              | `mutation signup`             | `x-tenant-id: {{tenantId}}` | optional tokens                                          |
| Login               | `mutation login`              | `x-tenant-id: {{tenantId}}` | `accessToken`, `refreshToken`, `globalUserId`            |
| Me                  | `query me`                    | `Bearer {{accessToken}}`    | —                                                        |
| Refresh Token       | `mutation refreshToken`       | `Bearer {{refreshToken}}`   | new tokens                                               |
| Change Password     | `mutation changePassword`     | `Bearer {{accessToken}}`    | —                                                        |
| Resend Verification | `mutation resendVerification` | `x-tenant-id: {{tenantId}}` | anti-enumeration message                                 |
| Verify Email        | `mutation verifyEmail`        | none                        | manual `{{otpCode}}`                                     |
| Forgot Password     | `mutation forgotPassword`     | `x-tenant-id: {{tenantId}}` | manual `{{resetToken}}` from email                       |
| Reset Password      | `mutation resetPassword`      | none                        | `input.token` = `{{resetToken}}`                         |
| Logout              | `mutation logout`             | `Bearer {{accessToken}}`    | —                                                        |
| Login Operational   | `mutation loginOperational`   | `x-tenant-id: {{tenantId}}` | `mesAccessToken`, `mesRefreshToken`, `operationalUserId` |
| Me Operational      | `query meOperational`         | `Bearer {{mesAccessToken}}` | —                                                        |
| Logout Operational  | `mutation logoutOperational`  | `Bearer {{mesAccessToken}}` | —                                                        |

**Prerequisites:** Start **both** `apps/api` (`:3001`) and `apps/gateway` (`:4000`). Seed the database as usual. Email flows (forgot/reset/resend/verify) need Redis + email worker when testing end-to-end delivery (same as REST folder 01).

**Auto-login:** The collection pre-request script that refreshes global `{{accessToken}}` for REST routes **does not run** for URLs containing `/graphql`. Run **Login** and **Login Operational** explicitly inside folder 10 (or rely on tokens already captured from REST folders 01/02).

**Suggested run order:** top-to-bottom inside folder 10 after seed. **Verify Email** and **Reset Password** skip strict assertions when `otpCode` / `resetToken` are empty — set them manually from email when testing those flows.

**Newman:**

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "10 — GraphQL Auth" \
  --bail
```

## USR-01 — Global User Identity

Email/password auth targets the tenant-scoped `users` table. Every signup/login/forgot/resend call needs `x-tenant-id: {{tenantId}}`.

| Account                    | Email                            | Password                  |
| -------------------------- | -------------------------------- | ------------------------- |
| MES owner (global User)    | `mes-owner@palos-de-lena.dev`    | `TestPass123!`            |
| MES operator (global User) | `mes-operator@palos-de-lena.dev` | `TestPass123!`            |
| TestLab only (legacy)      | `test@restopsiq.dev`             | N/A for `/api/auth/login` |

Signup generates unique `signupEmail` / `signupCedula` per run (201 or 409).

---

## USR-06 — OperationalUser Link

Operational Auth uses `OperationalUser` (cédula + PIN). `OperationalUser.userId` is nullable and links to global `users.id` when backfilled — this does **not** merge the login flows or tokens.

| Seeded role | Global User id                         | OperationalUser id                     |
| ----------- | -------------------------------------- | -------------------------------------- |
| OWNER       | `11111111-0000-0000-0000-000000000004` | `dddddddd-0000-0000-0000-000000000004` |
| OPERATOR    | `11111111-0000-0000-0000-000000000005` | `eeeeeeee-0000-0000-0000-000000000005` |

See folder **03 — Users / Operational Users** for full documentation.

---

## USR-02 — RBAC Foundation (not enforced)

Seed creates 13 permission codes and a role-permission matrix (OWNER: all 13; MANAGER/SUPERVISOR: 11; OPERATOR: 2). **PermissionGuard is not active** — do not expect 403 permission tests. See folder **09 — RBAC Foundation**.

---

## USR-05 — Audit Verification (SQL only)

There is no audit read API. After running auth and supply-items requests, verify rows in PostgreSQL using SQL in folder **08 — Audit Verification**.

Key points:

- **login_audits** — password login (Global Auth) and PIN login (Operational Auth).
- **MES LoginAudit FK caveat:** `login_audits.userId` references `users.id`. MES auth may pass `OperationalUser.id`; if not linked to a global User, persistence may be skipped (P2003). Check API logs.
- **Double audit on Supply Items writes:** interceptor row (`entityType: supply-items`) plus service snapshot row (`entityType: SupplyItem` with `oldValue`/`newValue`).
- **Redaction:** `passwordHash`, `pinHash`, tokens must appear as `[REDACTED]` or null in audit JSON.

Run **01 — Global Auth → 04 Login Audit Triggers** and **02 — Operational Auth / Plant Floor Login** login/negative cases before running SQL.

---

## Operational Auth / Plant Floor Login

Run in order inside **02 — Operational Auth / Plant Floor Login**:

1. **Login Owner** — `POST /api/mes/auth/login`; sets `mesAccessToken`, `mesTokenOwner`, `operationalUserId`, `mesRefreshToken`.
2. **Login Operator** — sets `mesTokenOperator` (does not overwrite owner token).
3. **Me** — validates operational session (`GET /api/mes/auth/me`).
4. **Get User Role** / **Create User** — OWNER-only (`/api/mes/users/*`).
5. **Logout** — `POST /api/mes/auth/logout` with `Bearer {{mesAccessToken}}`.

Synthetic credentials (local/dev only): owner cédula `12345678` / PIN `1234`; operator `87654321` / PIN `4321`.

---

## Plant & Production Orders

1. Run **02 — Operational Auth / Plant Floor Login → Login Owner**.
2. Run **05 — Plant Masters** or **06 — Production Orders** top-to-bottom.

Plant routes use `Bearer {{mesAccessToken}}` only — tenant scope comes from the JWT.

Cross-module: **Add Phase Input** needs a valid `{{supplyItemId}}` from seed or **04 — Supply Items → Create** (run Global Login first).

---

## Plant — Alarms & Incidents (MES-08)

Folder **07 — Incidents & Alarms (MES-08)** covers the incidents HTTP API and RBAC smoke tests. Alarm cron, BullMQ worker, WebSocket `alarm:triggered`, and 30-minute deduplication remain **manual** (see `tasks/mes-plant/MES-08-alarms-incidents/10-manual-testing.md`).

### HTTP routes

| Method | Path                               | Role        | Notes                                                               |
| ------ | ---------------------------------- | ----------- | ------------------------------------------------------------------- |
| POST   | `/api/plant/incidents`             | Operator+   | Creates incident; emits `incident:created`                          |
| GET    | `/api/plant/incidents`             | Supervisor+ | Filters: `orderId`, `workStationId`, `type`, `severity`, `resolved` |
| PATCH  | `/api/plant/incidents/:id/resolve` | Supervisor+ | Body: `{ "resolution": "..." }`                                     |

### Postman flow

1. **02 — Operational Auth → Login Owner** — sets `mesTokenSupervisor` (and `mesAccessToken`).
2. **02 — Operational Auth → Login Operator** — sets `mesTokenOperator`.
3. **06 — Production Orders** — sets `workStationId`, `orderId`, `executionId`.
4. Run **07 — Incidents & Alarms (MES-08)** top-to-bottom.

### Tokens

| Request group   | Bearer token             |
| --------------- | ------------------------ |
| Create incident | `{{mesTokenOperator}}`   |
| List / resolve  | `{{mesTokenSupervisor}}` |

**Newman:**

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "07 — Incidents & Alarms (MES-08)" \
  --bail
```

---

## 99 — Legacy TestLab

All `/api/testlab/*` routes were removed with USR-01. The 18 requests remain under **99 — Legacy / Deprecated → TestLab — DO NOT RUN** for reference only.

Legacy environment variables (do not use for live flows):

`testLabEmail`, `testLabUserId`, `projectId`, `projectSlug`, `milestoneId`, `requirementId`, `suiteId`, `caseId`, `runId`.

---

## Environment Variables Reference

| Variable                               | Required                      | Set by                                                         |
| -------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `baseUrl`                              | Yes                           | Environment (`http://localhost:3001`)                          |
| `graphqlUrl`                           | Yes (folder 10)               | Environment (`http://localhost:4000/graphql`)                  |
| `tenantId`                             | Yes                           | Environment (`palos-de-lena`)                                  |
| `email` / `password`                   | Yes                           | Environment (global User)                                      |
| `authEmail` / `operatorEmail`          | Optional                      | Environment                                                    |
| `accessToken` / `refreshToken`         | Auto                          | Login / pre-request                                            |
| `globalUserId`                         | Auto (blank until login)      | Login JWT `sub` — see `globalOwnerUserId` for seeded reference |
| `mesAccessToken` / `mesTokenOwner`     | Auto (blank until login)      | Login Owner                                                    |
| `mesTokenOperator`                     | Auto (blank until login)      | Login Operator                                                 |
| `operationalUserId`                    | Pre-filled OWNER seed id      | Login Owner / Me overwrites JWT `sub`                          |
| `mesUserId`                            | Legacy alias                  | Same as `operationalUserId`                                    |
| `mesTenantId`                          | Legacy alias                  | Same as `tenantId`                                             |
| `signupEmail` / `signupCedula`         | Auto (blank in env)           | Signup pre-request generates per run                           |
| `documentType` / `roleCode`            | Pre-filled (`CC`, `OPERATOR`) | Signup reference only                                          |
| `categoryId` / `supplyItemId`          | Yes (supply)                  | Seed / Create Supply Item                                      |
| `workstationId` / `workStationId`      | Auto                          | Create Work Station                                            |
| `recipeId` / `orderId` / `executionId` | Auto                          | Plant flows                                                    |
| `phaseExecutionId`                     | Auto                          | Alias of `executionId`                                         |
| `incidentId`                           | Auto                          | **07 — Incidents & Alarms** → Create Incident                  |
| `mesTokenSupervisor`                   | Auto                          | Login Owner (supervisor+ alias)                                |
| `permissionCode`                       | Reference                     | RBAC docs                                                      |
| `resetToken` / `otpCode`               | Manual                        | Email flows (RES-226)                                          |

TestLab variables are marked **LEGACY (99 TestLab — DO NOT RUN)** in environment files.

---

## Troubleshooting

| Symptom                                              | Likely cause                                 | Fix                                                                              |
| ---------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------- |
| `400 x-tenant-id header is required` on Login/Forgot | Header not injected or empty `tenantId`      | Set `tenantId=palos-de-lena`; re-import collection                               |
| Supply Items 403/404                                 | Wrong token or tenant                        | Use `{{accessToken}}` + `x-tenant-id: {{tenantId}}`                              |
| Plant 401                                            | Missing MES login                            | Run **Login Owner** first                                                        |
| GraphQL `ECONNREFUSED` / fetch failed                | Gateway not running                          | Start `apps/gateway` on `:4000`                                                  |
| GraphQL auth 401 with valid REST token               | Stale token or wrong variable                | Re-run folder 10 **Login** / **Login Operational** (no auto-login on `/graphql`) |
| Login 401 with `test@restopsiq.dev`                  | TestLab user, not global User                | Use `mes-owner@palos-de-lena.dev`                                                |
| Newman fails on TestLab                              | Legacy routes removed                        | Exclude folder `99 — Legacy / Deprecated`                                        |
| No login_audits rows after MES login                 | FK mismatch (OperationalUser.id vs users.id) | See **08 — Audit Verification** SQL docs                                         |
| Two audit_logs per supply update                     | Expected USR-05 behavior                     | Query `entityType = 'SupplyItem'` for snapshot                                   |

---

## RES-226 Email Endpoints

Forgot Password, Reset Password, Resend Verification, and Verify Email require Redis + BullMQ worker.

1. Run Forgot Password or Resend Verification.
2. Extract `resetToken` or `otpCode` from email (raw token is not in DB).
3. Run Reset Password or Verify Email within TTL (reset: 60 min, OTP: 15 min).
