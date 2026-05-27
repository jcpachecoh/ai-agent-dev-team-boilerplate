# RestOpsIQ — Postman Collection

Automated API test collection for the RestOpsIQ platform.

- **60 live endpoints** across Health, Auth, MES Auth, MES Plant, Supply Items, and Testlab modules.
- **Postman Collection v2.1** — importable into Postman Desktop or runnable via Newman CLI.
- **Dynamic variable capture** — POST create responses feed IDs into subsequent requests automatically.
- **Auto-login pre-request script** — access token is refreshed transparently before any protected request.

---

## Files

| File                            | Purpose                                             |
| ------------------------------- | --------------------------------------------------- |
| `restopsiq-api.collection.json` | Main Postman collection (v2.1) with all 60 requests |
| `local.environment.json`        | Environment variables for `http://localhost:3001`   |
| `README.md`                     | This file                                           |

---

## Prerequisites

### 1. API running locally

```bash
# From the monorepo root
cd apps/api
npm run start:dev
# or
npm run dev
```

The API must be reachable at `http://localhost:3001` (default `PORT`).

### 2. Seeded database

The collection requires three pieces of data to exist in the local database before a full run:

| Variable             | What it must be                                           | How to obtain                                        |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| `email` / `password` | A registered user (`test@restopsiq.dev` / `TestPass123!`) | Run `pnpm db:seed` from `apps/api/`                  |
| `tenantId`           | `palos-de-lena` (operational tenant)                      | Pre-populated in `local.environment.json` after seed |
| `mesTenantId`        | `palos-de-lena` (same as `tenantId`)                      | Pre-populated after seed                             |
| `categoryId`         | `bbbbbbbb-0000-0000-0000-000000000002`                    | Pre-populated after seed                             |
| `supplyItemId`       | `ffffffff-0000-0000-0000-000000000006` (optional)         | Seeded item; overwritten by Create Supply Item       |

> The signup request in the collection accepts both `201` (first run) and `409` (user already exists), so it is safe to run repeatedly.

**TestLab** uses email/password auth only (no tenant). **Supply items, MES, and plant** share the operational tenant `palos-de-lena`.

The `local.environment.json` ships with deterministic seed values:

```json
"tenantId":       "palos-de-lena"
"mesTenantId":    "palos-de-lena"
"categoryId":     "bbbbbbbb-0000-0000-0000-000000000002"
"supplyItemId":   "ffffffff-0000-0000-0000-000000000006"
"supplyItemCode": "SEED-ACEITE"
"testLabUserId":  "cccccccc-0000-0000-0000-000000000003"
"mesOwnerId":     "dddddddd-0000-0000-0000-000000000004"
"mesOperatorId":  "eeeeeeee-0000-0000-0000-000000000005"
"mesUserId":      "dddddddd-0000-0000-0000-000000000004"
```

Run `pnpm db:seed` from `apps/api/` and these values work immediately.

| Variable            | Seeded value (local/dev only) |
| ------------------- | ----------------------------- |
| `mesOwnerCedula`    | `12345678` (OWNER)            |
| `mesOwnerPin`       | `1234`                        |
| `mesOperatorCedula` | `87654321` (OPERATOR)         |
| `mesOperatorPin`    | `4321`                        |

MES credentials are **synthetic** and documented in `apps/api/prisma/seed.ts` — never use real production cédulas in Postman.

### 3. Newman installed (for CLI runs)

```bash
npm install -g newman
```

---

## Import into Postman Desktop

1. Open Postman Desktop.
2. Click **Import** → **Upload Files**.
3. Select both files:
   - `postman/restopsiq-api.collection.json`
   - `postman/local.environment.json` (or `postman/recipes-local.environment.json` — same values, name **RestOpsIQ — Recipes Local**)
4. In the top-right environment selector, choose **RestOpsIQ — Local**.
5. After `pnpm db:seed`, `tenantId`, `mesTenantId`, `categoryId`, and `supplyItemId` are pre-filled in the environment.
6. Click **Runner** → select the collection → **Run**.

---

## Run via Newman (CLI)

```bash
# From the repo root
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --reporters cli \
  --bail
```

`--bail` stops execution on the first failure, preventing cascading errors from broken ID captures.

To run a single folder:

```bash
# Auth folder only
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "01 Auth"

# Supply Items only
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "02 Supply Items"

# MES Auth only
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "MES Auth"

# MES Plant only (run MES Auth / Login Owner first)
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "MES Plant"
```

To save a JSON report:

```bash
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --reporters cli,json \
  --reporter-json-export postman/results/newman-report.json \
  --bail
```

> `postman/results/` is gitignored and not committed.

---

## Collection Structure

```
RestOpsIQ API
│
│  Pre-request: auto-login (skipped for /mes/*, /plant/*, and /auth/* public routes)
│  Auth: Bearer {{accessToken}} (MES + Plant override with {{mesAccessToken}})
│
├── 00 Health          (1 request)
│   └── GET /api/
│
├── 01 Auth            (12 requests)
│   ├── POST /api/auth/signup
│   ├── POST /api/auth/login                → captures accessToken, refreshToken
│   ├── POST /api/auth/refresh              → uses refreshToken, captures new accessToken
│   ├── POST /api/auth/logout
│   ├── POST /api/auth/forgot-password      → public, always 200 (anti-enumeration)
│   ├── POST /api/auth/reset-password       → public, consumes {{resetToken}}
│   ├── POST /api/auth/reset-password (invalid token — negative)
│   ├── POST /api/auth/reset-password (reused token — negative)
│   ├── POST /api/auth/resend-verification  → public, always 200 (anti-enumeration)
│   ├── POST /api/auth/verify-email         → public, consumes {{otpCode}}
│   ├── POST /api/auth/verify-email (invalid OTP — negative)
│   └── ── RES-226 email endpoints require Redis + BullMQ queue running ──
│
├── MES Auth           (6 requests — separate from TestLab auth)
│   ├── POST /api/mes/auth/login (Owner)     → x-tenant-id: {{mesTenantId}}, captures mesAccessToken
│   ├── GET  /api/mes/auth/me                → Bearer {{mesAccessToken}}
│   ├── GET  /api/mes/users/:id/role         → Bearer {{mesAccessToken}}, uses {{mesUserId}}
│   ├── POST /api/mes/auth/logout            → Bearer {{mesAccessToken}}
│   ├── POST /api/mes/auth/login (wrong PIN) → negative, 401
│   └── POST /api/mes/auth/login (no tenant) → negative, 400
│
├── MES Plant          (16 requests — Bearer {{mesAccessToken}} only, no x-tenant-id)
│   ├── POST   /api/plant/workstations              → captures workstationId
│   ├── GET    /api/plant/workstations
│   ├── POST   /api/plant/recipes (nested)          → captures recipeId
│   ├── GET    /api/plant/recipes
│   ├── GET    /api/plant/recipes/:id               → totalStandardMinutes, phaseId1/2
│   ├── PATCH  /api/plant/recipes/:id/phases/reorder
│   ├── PATCH  /api/plant/recipes/:id
│   ├── POST   /api/plant/recipes/:id/clone         → captures clonedRecipeId
│   ├── POST   /api/plant/phases/:id/inputs (invalid) → negative 404
│   ├── POST   /api/plant/phases/:id/inputs
│   ├── DELETE /api/plant/phases/:id/inputs/:inputId
│   ├── DELETE /api/plant/recipes/:id
│   ├── PATCH  /api/plant/workstations/:id
│   └── DELETE /api/plant/workstations/:id          ← last (may 409 if active executions)
│
├── 02 Supply Items    (7 requests — x-tenant-id: {{tenantId}} on every request)
│   ├── POST   /api/supply-items              → captures supplyItemId
│   ├── GET    /api/supply-items
│   ├── GET    /api/supply-items/:id
│   ├── PATCH  /api/supply-items/:id
│   ├── GET    /api/supply-items/:id/suppliers
│   ├── GET    /api/supply-items/:id/price-history
│   └── DELETE /api/supply-items/:id          ← last (so reads run first)
│
└── 03 Testlab         (18 requests across 6 sub-folders)
    ├── Projects        POST → captures projectId
    ├── Milestones      POST uses projectId → captures milestoneId
    ├── Requirements    POST uses projectId → captures requirementId
    ├── Suites          POST uses projectId → captures suiteId
    ├── Cases           POST uses projectId+suiteId → captures caseId
    └── Runs            POST uses projectId → captures runId
```

---

## Auth Strategy

### Collection-level Bearer token

All requests inherit `Authorization: Bearer {{accessToken}}` from the collection root.

**Exceptions (explicit overrides):**

- `Signup` and `Login` — auth type `noauth` (endpoints are `@Public`).
- `Refresh` — auth type `bearer` with `{{refreshToken}}` (uses `JwtRefreshGuard`).
- `Forgot Password`, `Reset Password`, `Resend Verification`, `Verify Email` — auth type `noauth` (all four are `@Public` per RES-226).

### Auto-login pre-request script

The collection-level pre-request script fires before every non-auth request:

1. Checks if `{{accessToken}}` is still valid (via `accessTokenExpiresAt` timestamp).
2. If expired or missing, fires a synchronous `POST /api/auth/login` using `{{email}}` and `{{password}}`.
3. Stores the returned `accessToken`, `refreshToken`, and a 14-minute expiry window.

This means the **Login request in the `01 Auth` folder is also the canonical setup step** — running it first ensures all subsequent requests have a valid token without relying on the pre-request script alone.

MES routes (`/mes/auth/*`, `/mes/users/*`) and plant routes (`/plant/*`) are **excluded** from the auto-login script so they never overwrite `{{mesAccessToken}}` with a TestLab token.

---

## MES Auth

MES (Manufacturing Execution System) auth uses **cédula + PIN** for operational users. It is independent of TestLab email/password auth.

### Prerequisites

1. API running at `{{baseUrl}}` (default `http://localhost:3001`).
2. Redis running (rate limiting and JWT blacklist).
3. Database seeded with MES operational users:

   ```bash
   cd apps/api && npx prisma db seed
   ```

### Local test flow

Run these requests **in order** inside the **MES Auth** folder:

1. **Login Owner** — sends `x-tenant-id: {{mesTenantId}}` and owner cédula/PIN; sets `mesAccessToken`, `mesRefreshToken`, and `mesUserId`.
2. **Me** — `GET /api/mes/auth/me` with `Authorization: Bearer {{mesAccessToken}}`.
3. **Get User Role** — `GET /api/mes/users/{{mesUserId}}/role` (OWNER role required).
4. **Logout** — `POST /api/mes/auth/logout`.

Negative cases (wrong PIN, missing `x-tenant-id`) can be run independently; they use `noauth` and do not require a prior login.

### Headers and tokens

- **`x-tenant-id`** is required on `POST /api/mes/auth/login`. Use `{{mesTenantId}}` (`palos-de-lena` after seed).
- Protected MES endpoints use **`Bearer {{mesAccessToken}}`**, not `{{accessToken}}`.
- Login requests use **`noauth`** so the collection-level TestLab bearer token is not sent.

### Credentials

All MES Postman credentials are **synthetic local/dev values** from the seed script. Do not hardcode or use real production cédulas.

---

## MES Plant (master data)

Plant routes use the **MES JWT** only. Tenant scope comes from the token (`palos-de-lena` after seed), not from `x-tenant-id`.

### Flow

1. Run **MES Auth → Login Owner** (sets `{{mesAccessToken}}`).
2. Run the **MES Plant** folder in order (workstation → recipe → reorder → cleanup).

### Headers

| Route group                | Auth                                                   | Tenant                        |
| -------------------------- | ------------------------------------------------------ | ----------------------------- |
| `POST /api/mes/auth/login` | `noauth` + `x-tenant-id: {{mesTenantId}}`              | `palos-de-lena` (header)      |
| `/api/plant/*`             | `Bearer {{mesAccessToken}}`                            | JWT claim (`palos-de-lena`)   |
| `/api/supply-items/*`      | `Bearer {{accessToken}}` + `x-tenant-id: {{tenantId}}` | `palos-de-lena` (same tenant) |

### Phase inputs and supply items

`POST /api/plant/phases/:id/inputs` validates `supplyItemId` with `SupplyItemsService.findOne` using the tenant from the MES JWT. Use `{{supplyItemId}}` from the seed or from **02 Supply Items → Create** (both under `palos-de-lena`).

The collection includes:

- **Add Phase Input — invalid supply (negative)** — always expects 404.
- **Add Phase Input** — expects 201 when `{{supplyItemId}}` exists for the operational tenant.

### Smoke checklist (manual)

| Scenario                                      | How to verify                                                                     |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| Nested recipe + `totalStandardMinutes`        | Create Recipe → Get Recipe Detail asserts `totalStandardMinutes === 40` (15 + 25) |
| Phase reorder                                 | Reorder Phases → Get Recipe Detail (after reorder) checks swapped `order`         |
| Invalid supply on input                       | Add Phase Input — invalid supply → 404                                            |
| Workstation soft delete with active execution | Create execution in DB, then DELETE workstation → expect 409                      |

---

## Dynamic Variable Capture

Every `POST` create request captures the returned `id` in its `Tests` script:

| Request                                         | Variable set           |
| ----------------------------------------------- | ---------------------- |
| POST /api/supply-items                          | `supplyItemId`         |
| POST /api/testlab/projects                      | `projectId`            |
| POST /api/testlab/projects/:id/milestones       | `milestoneId`          |
| POST /api/testlab/projects/:id/requirements     | `requirementId`        |
| POST /api/testlab/projects/:id/suites           | `suiteId`              |
| POST /api/testlab/projects/:id/suites/:id/cases | `caseId`               |
| POST /api/testlab/projects/:id/runs             | `runId`                |
| POST /api/plant/workstations                    | `workstationId`        |
| POST /api/plant/recipes                         | `recipeId`             |
| POST /api/plant/recipes/:id/clone               | `clonedRecipeId`       |
| GET /api/plant/recipes/:id                      | `phaseId1`, `phaseId2` |
| POST /api/plant/phases/:id/inputs               | `phaseInputId`         |

**Uniqueness note:**

- `Create Supply Item` generates `{{supplyItemCode}}` as `SI-<timestamp>` before each request so the `@@unique([tenantId, codigoInterno])` constraint is never violated across repeated runs.
- `Create Project` generates `{{projectSlug}}` as `proj-<timestamp>` to avoid the `409 Slug already exists` error on repeated runs.

---

## Run Order

The collection **must** be executed in folder order when running via Newman or the Postman Collection Runner. Parallel or out-of-order execution will break ID capture chains.

Dependency chain:

```
Login
  └── supplyItemId (Create Supply Item)
  └── projectId (Create Project)
        ├── milestoneId  (Create Milestone)
        ├── requirementId (Create Requirement)
        ├── suiteId      (Create Suite)
        │     └── caseId (Create Case)
        └── runId        (Create Run)
```

---

## Environment Variables Reference

| Variable                | Required before run               | Set by                                                     |
| ----------------------- | --------------------------------- | ---------------------------------------------------------- |
| `baseUrl`               | Yes                               | `local.environment.json`                                   |
| `email`                 | Yes                               | `local.environment.json`                                   |
| `password`              | Yes                               | `local.environment.json`                                   |
| `tenantId`              | Yes                               | `local.environment.json` (`palos-de-lena` after seed)      |
| `categoryId`            | Yes (for Supply Items)            | `local.environment.json` (seed id)                         |
| `supplyItemId`          | Yes (MES phase input)             | `local.environment.json` (seed id)                         |
| `supplyItemCode`        | Auto / seed reference             | `SEED-ACEITE`; pre-request uses `SI-<timestamp>` on create |
| `testLabUserId`         | Reference                         | Seeded `UserTestLab` id                                    |
| `mesOwnerId`            | Reference / MES role tests        | Seeded OWNER id                                            |
| `mesOperatorId`         | Reference                         | Seeded OPERATOR id                                         |
| `authEmail`             | Yes (for RES-226 email endpoints) | `local.environment.json` (defaults to seeded user)         |
| `resetToken`            | Manual (for Reset Password)       | Extracted from password-reset email URL                    |
| `otpCode`               | Manual (for Verify Email)         | Extracted from verification email or Redis                 |
| `newPassword`           | Yes (for Reset Password)          | `local.environment.json` (defaults to `NewPassword456!`)   |
| `accessToken`           | Auto                              | Pre-request script / Login test                            |
| `refreshToken`          | Auto                              | Login test                                                 |
| `accessTokenExpiresAt`  | Auto                              | Pre-request script / Login test                            |
| `projectId`             | Auto                              | Create Project test                                        |
| `projectSlug`           | Auto                              | Create Project pre-request                                 |
| `milestoneId`           | Auto                              | Create Milestone test                                      |
| `requirementId`         | Auto                              | Create Requirement test                                    |
| `suiteId`               | Auto                              | Create Suite test                                          |
| `caseId`                | Auto                              | Create Case test                                           |
| `runId`                 | Auto                              | Create Run test                                            |
| `mesTenantId`           | Yes (MES login)                   | `local.environment.json`                                   |
| `mesOwnerCedula`        | Yes (MES login)                   | `local.environment.json` (synthetic, dev only)             |
| `mesOwnerPin`           | Yes (MES login)                   | `local.environment.json` (synthetic, dev only)             |
| `mesOperatorCedula`     | Optional (operator login)         | `local.environment.json` (synthetic, dev only)             |
| `mesOperatorPin`        | Optional (operator login)         | `local.environment.json` (synthetic, dev only)             |
| `mesAccessToken`        | Auto                              | MES Login Owner test                                       |
| `mesRefreshToken`       | Auto                              | MES Login Owner test                                       |
| `mesUserId`             | Auto                              | MES Login Owner / Me test                                  |
| `workstationId`         | Auto                              | MES Plant / Create Work Station                            |
| `recipeId`              | Auto                              | MES Plant / Create Recipe                                  |
| `clonedRecipeId`        | Auto                              | MES Plant / Clone Recipe                                   |
| `phaseId1` / `phaseId2` | Auto                              | MES Plant / Get Recipe Detail                              |
| `phaseInputId`          | Auto                              | MES Plant / Add Phase Input                                |
| `plantWorkStationCode`  | Auto                              | MES Plant pre-request (unique code)                        |
| `plantRecipeName`       | Auto                              | MES Plant pre-request (unique name)                        |

### RES-226 email endpoint manual setup

The `reset-password` and `verify-email` happy-path requests depend on tokens delivered out-of-band (via email). Before running them:

1. **Forgot Password / Resend Verification** — run either request to trigger token generation.
2. **Retrieve `resetToken`** — open the email dev inbox (Resend test mode) or query the DB:
   ```sql
   SELECT id, user_id, token_hash, expires_at FROM password_reset_tokens ORDER BY created_at DESC LIMIT 1;
   ```
   The raw token is not stored in the DB — it is embedded in the email link URL. Copy the token query-parameter value and paste it into `{{resetToken}}`.
3. **Retrieve `otpCode`** — check the email or inspect Redis:
   ```bash
   # List OTP keys (hashed keys — for audit only)
   redis-cli KEYS 'otp:*'
   ```
   The OTP code is delivered in the email body. Copy the 6-digit value and paste it into `{{otpCode}}`.
4. Run `Reset Password` or `Verify Email` within the token TTL (reset: 60 min, OTP: 15 min).

---

## Troubleshooting

| Symptom                                  | Likely cause                                             | Fix                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| All supply-items requests return 403/404 | `tenantId` is wrong or empty                             | Use `palos-de-lena` (same as `mesTenantId`) after seed                                                                              |
| `Create Supply Item` returns 400         | `x-tenant-id` ≠ `palos-de-lena` (category tenant in DB)  | Set `tenantId` = `palos-de-lena` in **active** environment; re-import `recipes-local.environment.json` if you use **Recipes Local** |
| `Create Supply Item` 400 after seed      | Old env still has `tenantId: aaaaaaaa-...`               | Open environment → `tenantId` must be `palos-de-lena`; check `debugResolvedTenantId` after running request (Console + env vars)     |
| `Create Supply Item` returns 409         | `codigoInterno` already exists (timestamp collision)     | Extremely unlikely; re-run                                                                                                          |
| Testlab GET returns 404                  | POST create ran after GET (wrong order)                  | Run collection in folder order                                                                                                      |
| `Refresh` returns 401                    | `refreshToken` is stale or was invalidated by Logout     | Run Login again before Refresh                                                                                                      |
| Pre-request auto-login silently fails    | `email`/`password` vars are empty or DB has no such user | Seed the user and set correct env vars                                                                                              |
| `Reset Password` returns 400 (not found) | `{{resetToken}}` is empty or already used                | Re-run Forgot Password, extract fresh token from email                                                                              |
| `Verify Email` returns 400 (expired)     | `{{otpCode}}` is expired (TTL 15 min) or already used    | Re-run Resend Verification, copy fresh OTP from email                                                                               |
| Email requests succeed but no email sent | Redis is not running or BullMQ worker is not started     | `docker compose up -d redis` and start the email worker                                                                             |
