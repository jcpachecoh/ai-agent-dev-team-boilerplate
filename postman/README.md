# RestOpsIQ — Postman Collection

Automated API test collection for the RestOpsIQ platform.

- **38 live endpoints** across Health, Auth, Supply Items, and Testlab modules.
- **Postman Collection v2.1** — importable into Postman Desktop or runnable via Newman CLI.
- **Dynamic variable capture** — POST create responses feed IDs into subsequent requests automatically.
- **Auto-login pre-request script** — access token is refreshed transparently before any protected request.

---

## Files

| File                            | Purpose                                             |
| ------------------------------- | --------------------------------------------------- |
| `restopsiq-api.collection.json` | Main Postman collection (v2.1) with all 38 requests |
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
| `tenantId`           | `aaaaaaaa-0000-0000-0000-000000000001`                    | Pre-populated in `local.environment.json` after seed |
| `categoryId`         | `bbbbbbbb-0000-0000-0000-000000000002`                    | Pre-populated in `local.environment.json` after seed |

> The signup request in the collection accepts both `201` (first run) and `409` (user already exists), so it is safe to run repeatedly.

The `local.environment.json` already ships with the deterministic seed values:

```json
"tenantId":   "aaaaaaaa-0000-0000-0000-000000000001"
"categoryId": "bbbbbbbb-0000-0000-0000-000000000002"
```

These match the fixed IDs in `apps/api/prisma/seed.ts`. Run `pnpm db:seed` and these values will work immediately.

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
   - `postman/local.environment.json`
4. In the top-right environment selector, choose **RestOpsIQ — Local**.
5. Set `tenantId` and `categoryId` in the environment to real values from your local DB.
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
│  Pre-request: auto-login (skipped for /auth/* public routes)
│  Auth: Bearer {{accessToken}}
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

---

## Dynamic Variable Capture

Every `POST` create request captures the returned `id` in its `Tests` script:

| Request                                         | Variable set    |
| ----------------------------------------------- | --------------- |
| POST /api/supply-items                          | `supplyItemId`  |
| POST /api/testlab/projects                      | `projectId`     |
| POST /api/testlab/projects/:id/milestones       | `milestoneId`   |
| POST /api/testlab/projects/:id/requirements     | `requirementId` |
| POST /api/testlab/projects/:id/suites           | `suiteId`       |
| POST /api/testlab/projects/:id/suites/:id/cases | `caseId`        |
| POST /api/testlab/projects/:id/runs             | `runId`         |

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

| Variable               | Required before run               | Set by                                                   |
| ---------------------- | --------------------------------- | -------------------------------------------------------- |
| `baseUrl`              | Yes                               | `local.environment.json`                                 |
| `email`                | Yes                               | `local.environment.json`                                 |
| `password`             | Yes                               | `local.environment.json`                                 |
| `tenantId`             | Yes                               | `local.environment.json` (manual)                        |
| `categoryId`           | Yes (for Supply Items)            | `local.environment.json` (manual)                        |
| `authEmail`            | Yes (for RES-226 email endpoints) | `local.environment.json` (defaults to seeded user)       |
| `resetToken`           | Manual (for Reset Password)       | Extracted from password-reset email URL                  |
| `otpCode`              | Manual (for Verify Email)         | Extracted from verification email or Redis               |
| `newPassword`          | Yes (for Reset Password)          | `local.environment.json` (defaults to `NewPassword456!`) |
| `accessToken`          | Auto                              | Pre-request script / Login test                          |
| `refreshToken`         | Auto                              | Login test                                               |
| `accessTokenExpiresAt` | Auto                              | Pre-request script / Login test                          |
| `supplyItemId`         | Auto                              | Create Supply Item test                                  |
| `supplyItemCode`       | Auto                              | Create Supply Item pre-request                           |
| `projectId`            | Auto                              | Create Project test                                      |
| `projectSlug`          | Auto                              | Create Project pre-request                               |
| `milestoneId`          | Auto                              | Create Milestone test                                    |
| `requirementId`        | Auto                              | Create Requirement test                                  |
| `suiteId`              | Auto                              | Create Suite test                                        |
| `caseId`               | Auto                              | Create Case test                                         |
| `runId`                | Auto                              | Create Run test                                          |

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

| Symptom                                  | Likely cause                                             | Fix                                                     |
| ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| All supply-items requests return 403/404 | `tenantId` is wrong or empty                             | Set a real tenant UUID in the environment               |
| `Create Supply Item` returns 400         | `categoryId` is wrong or empty                           | Set a real SupplyCategory UUID for the same tenant      |
| `Create Supply Item` returns 409         | `codigoInterno` already exists (timestamp collision)     | Extremely unlikely; re-run                              |
| Testlab GET returns 404                  | POST create ran after GET (wrong order)                  | Run collection in folder order                          |
| `Refresh` returns 401                    | `refreshToken` is stale or was invalidated by Logout     | Run Login again before Refresh                          |
| Pre-request auto-login silently fails    | `email`/`password` vars are empty or DB has no such user | Seed the user and set correct env vars                  |
| `Reset Password` returns 400 (not found) | `{{resetToken}}` is empty or already used                | Re-run Forgot Password, extract fresh token from email  |
| `Verify Email` returns 400 (expired)     | `{{otpCode}}` is expired (TTL 15 min) or already used    | Re-run Resend Verification, copy fresh OTP from email   |
| Email requests succeed but no email sent | Redis is not running or BullMQ worker is not started     | `docker compose up -d redis` and start the email worker |
