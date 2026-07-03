# Task: Automated Postman Collection for the Full API

## Goal

Create a versioned, self-contained Postman collection (v2.1) that covers every live endpoint of the RestOpsIQ API, runs automated assertions on each request, supports chained dynamic variables between requests, and can be executed headlessly in CI via Newman.

---

## Background

The API surface has grown across several independent features (Auth, Testlab, Supply Items) without a unified, runnable contract test. The Swagger UI at `/api/docs` provides documentation, but it does not:

- Enforce response-shape assertions automatically.
- Capture IDs from creation responses and feed them into subsequent requests.
- Run in CI as a regression gate.

A Postman collection fills all three gaps without touching production code.

The collection must be committed under `postman/` in the repository root so it is version-controlled alongside the code it tests.

---

## Scope

- **One Postman collection file**: `postman/restopsiq-api.collection.json` (Postman v2.1 schema).
- **Two environment files**: `postman/local.environment.json` and `postman/staging.environment.json`.
- **One README**: `postman/README.md` explaining import, manual use, and Newman usage.
- **One Newman script**: `scripts/run-postman.sh` wrapping the Newman invocation.
- All 30 live endpoints covered with at least one request each.
- Automated `pm.test` assertions on every request (status code + shape).
- Dynamic variable capture for IDs produced by POST requests.
- Collection-level pre-request script for auto-login token refresh.

---

## Out of Scope

- Endpoints on `AuditController` and `LockController` — both are empty stubs with zero HTTP methods today. Add them when the controllers gain real routes.
- Load / performance testing (use k6 for that).
- Modifying any API source file (`apps/api/src/**`).
- Modifying Prisma schema or running migrations.
- Modifying `memory/progress.md` or `.eslintrc.json`.
- Touching `apps/testlab/` source.
- Adding npm dependencies to any `package.json`.
- Changing the current branch (`feature/supply-items-api`).

---

## Endpoint Inventory Summary

Global prefix: `/api`.
Auth mechanism: `JwtAuthGuard` applied globally as `APP_GUARD`.

### Health

| #   | Method | Path    | Auth             | x-tenant-id |
| --- | ------ | ------- | ---------------- | ----------- |
| 1   | GET    | `/api/` | none (`@Public`) | no          |

### Auth — `/api/auth`

| #   | Method | Path                | Auth                                                | x-tenant-id |
| --- | ------ | ------------------- | --------------------------------------------------- | ----------- |
| 2   | POST   | `/api/auth/signup`  | none (`@Public`)                                    | no          |
| 3   | POST   | `/api/auth/login`   | none (`@Public`)                                    | no          |
| 4   | POST   | `/api/auth/refresh` | refresh-token Bearer (`JwtRefreshGuard`, `@Public`) | no          |
| 5   | POST   | `/api/auth/logout`  | access-token Bearer                                 | no          |

### Supply Items — `/api/supply-items`

All 7 routes require `Authorization: Bearer {{accessToken}}` and `x-tenant-id: {{tenantId}}`.

| #   | Method | Path                                  |
| --- | ------ | ------------------------------------- |
| 6   | POST   | `/api/supply-items`                   |
| 7   | GET    | `/api/supply-items`                   |
| 8   | GET    | `/api/supply-items/:id`               |
| 9   | PATCH  | `/api/supply-items/:id`               |
| 10  | DELETE | `/api/supply-items/:id`               |
| 11  | GET    | `/api/supply-items/:id/suppliers`     |
| 12  | GET    | `/api/supply-items/:id/price-history` |

### Testlab — Projects — `/api/testlab/projects`

All require `Authorization: Bearer {{accessToken}}`.

| #   | Method | Path                        |
| --- | ------ | --------------------------- |
| 13  | POST   | `/api/testlab/projects`     |
| 14  | GET    | `/api/testlab/projects`     |
| 15  | GET    | `/api/testlab/projects/:id` |

### Testlab — Milestones

| #   | Method | Path                                              |
| --- | ------ | ------------------------------------------------- |
| 16  | POST   | `/api/testlab/projects/:projectId/milestones`     |
| 17  | GET    | `/api/testlab/projects/:projectId/milestones`     |
| 18  | GET    | `/api/testlab/projects/:projectId/milestones/:id` |

### Testlab — Requirements

| #   | Method | Path                                                |
| --- | ------ | --------------------------------------------------- |
| 19  | POST   | `/api/testlab/projects/:projectId/requirements`     |
| 20  | GET    | `/api/testlab/projects/:projectId/requirements`     |
| 21  | GET    | `/api/testlab/projects/:projectId/requirements/:id` |

### Testlab — Suites

| #   | Method | Path                                          |
| --- | ------ | --------------------------------------------- |
| 22  | POST   | `/api/testlab/projects/:projectId/suites`     |
| 23  | GET    | `/api/testlab/projects/:projectId/suites`     |
| 24  | GET    | `/api/testlab/projects/:projectId/suites/:id` |

### Testlab — Cases

| #   | Method | Path                                                                |
| --- | ------ | ------------------------------------------------------------------- |
| 25  | POST   | `/api/testlab/projects/:projectId/suites/:suiteId/cases`            |
| 26  | GET    | `/api/testlab/projects/:projectId/suites/:suiteId/cases`            |
| 27  | PATCH  | `/api/testlab/projects/:projectId/suites/:suiteId/cases/:id/status` |

### Testlab — Runs

| #   | Method | Path                                        |
| --- | ------ | ------------------------------------------- |
| 28  | POST   | `/api/testlab/projects/:projectId/runs`     |
| 29  | GET    | `/api/testlab/projects/:projectId/runs`     |
| 30  | GET    | `/api/testlab/projects/:projectId/runs/:id` |

---

## Auth Strategy

### Problem

`JwtAuthGuard` is a global `APP_GUARD`. Every non-`@Public` request requires a valid short-lived access token.

### Solution: Collection-level pre-request script

A JavaScript pre-request script attached at the **collection root** checks whether `{{accessToken}}` is set. If it is missing or the token is expired (based on a stored `{{accessTokenExpiresAt}}` timestamp), it fires a synchronous `pm.sendRequest` to `POST /api/auth/login` using `{{email}}` and `{{password}}` variables, then stores the returned tokens:

```js
// Collection pre-request (pseudo-code — actual code goes in the JSON)
const expiry = pm.collectionVariables.get('accessTokenExpiresAt');
const now = Date.now();
if (!expiry || now >= Number(expiry)) {
  pm.sendRequest(
    {
      url: pm.collectionVariables.get('baseUrl') + '/api/auth/login',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          email: pm.collectionVariables.get('email'),
          password: pm.collectionVariables.get('password'),
        }),
      },
    },
    (err, res) => {
      const body = res.json();
      pm.collectionVariables.set('accessToken', body.accessToken);
      pm.collectionVariables.set('refreshToken', body.refreshToken);
      pm.collectionVariables.set('accessTokenExpiresAt', now + 14 * 60 * 1000); // 14 min
    },
  );
}
```

### Token usage

- Collection-level `Authorization` header: `Bearer {{accessToken}}`.
- The `POST /api/auth/refresh` request overrides to use `Bearer {{refreshToken}}`.
- `POST /api/auth/signup` and `POST /api/auth/login` override Authorization to `(none)`.

---

## Tenant Strategy

`x-tenant-id` is only consumed by the Supply Items module. It is sent as a collection-level header **scoped to the Supply Items folder only** (not collection root), so Testlab endpoints are unaffected.

Variable: `{{tenantId}}` — populated in the environment file with a seeded UUID known to exist in the target database.

> Risk: if the test database is empty or the `tenantId` does not match a real tenant record, all supply-items requests will fail with 403 or 404. The local seed script must create a deterministic tenant UUID and document it.

---

## Proposed Postman Folder Structure

```
RestOpsIQ API  (collection root)
│
│  Pre-request: auto-login token refresh (see Auth Strategy)
│  Auth: Bearer {{accessToken}}
│
├── 00 Health
│   └── GET /api/
│
├── 01 Auth
│   ├── POST signup
│   ├── POST login              → saves {{accessToken}}, {{refreshToken}}
│   ├── POST refresh            → saves new {{accessToken}} from refresh flow
│   └── POST logout
│
├── 02 Supply Items             (folder header: x-tenant-id: {{tenantId}})
│   ├── POST create             → saves {{supplyItemId}}
│   ├── GET list all
│   ├── GET find one            uses {{supplyItemId}}
│   ├── PATCH update            uses {{supplyItemId}}
│   ├── GET suppliers           uses {{supplyItemId}}
│   ├── GET price history       uses {{supplyItemId}}
│   └── DELETE remove           uses {{supplyItemId}}  ← last, so GET tests run first
│
└── 03 Testlab
    ├── Projects
    │   ├── POST create         → saves {{projectId}}
    │   ├── GET list
    │   └── GET find one        uses {{projectId}}
    ├── Milestones
    │   ├── POST create         → saves {{milestoneId}}
    │   ├── GET list            uses {{projectId}}
    │   └── GET find one        uses {{projectId}}, {{milestoneId}}
    ├── Requirements
    │   ├── POST create         → saves {{requirementId}}
    │   ├── GET list            uses {{projectId}}
    │   └── GET find one        uses {{projectId}}, {{requirementId}}
    ├── Suites
    │   ├── POST create         → saves {{suiteId}}
    │   ├── GET list            uses {{projectId}}
    │   └── GET find one        uses {{projectId}}, {{suiteId}}
    ├── Cases
    │   ├── POST create         → saves {{caseId}}
    │   ├── GET list            uses {{projectId}}, {{suiteId}}
    │   └── PATCH update status uses {{projectId}}, {{suiteId}}, {{caseId}}
    └── Runs
        ├── POST create         → saves {{runId}}
        ├── GET list            uses {{projectId}}
        └── GET find one        uses {{projectId}}, {{runId}}
```

---

## Environment Variables

Both `local.environment.json` and `staging.environment.json` must define these variables:

| Variable               | Description                                  | Example value           |
| ---------------------- | -------------------------------------------- | ----------------------- |
| `baseUrl`              | API base (no trailing slash)                 | `http://localhost:3001` |
| `email`                | Seeded user email for auto-login             | `test@restopsiq.dev`    |
| `password`             | Seeded user password                         | `TestPass123!`          |
| `tenantId`             | Known UUID from seed data                    | `<uuid>`                |
| `accessToken`          | Populated at runtime by pre-request script   | _(blank)_               |
| `refreshToken`         | Populated at runtime by login                | _(blank)_               |
| `accessTokenExpiresAt` | Unix ms timestamp, set by pre-request script | _(blank)_               |
| `supplyItemId`         | Populated at runtime by POST create          | _(blank)_               |
| `projectId`            | Populated at runtime by POST create          | _(blank)_               |
| `milestoneId`          | Populated at runtime by POST create          | _(blank)_               |
| `requirementId`        | Populated at runtime by POST create          | _(blank)_               |
| `suiteId`              | Populated at runtime by POST create          | _(blank)_               |
| `caseId`               | Populated at runtime by POST create          | _(blank)_               |
| `runId`                | Populated at runtime by POST create          | _(blank)_               |

Secrets (`email`, `password`) must **not** be committed with real values. Use placeholder strings in the committed file; override via CI environment secrets.

---

## Automated Test Strategy

Every request must have a `Tests` tab with at minimum:

```js
pm.test('Status is 2xx', () => {
  pm.response.to.be.success;
});
```

Richer assertions per request type:

| Request type      | Additional assertions                                                 |
| ----------------- | --------------------------------------------------------------------- |
| POST create       | `pm.response.to.have.status(201)`, `id` field is a non-empty string   |
| GET list          | `pm.response.to.have.status(200)`, response is an Array               |
| GET find one      | `pm.response.to.have.status(200)`, `id === {{capturedId}}`            |
| PATCH             | `pm.response.to.have.status(200)`, patched field equals sent value    |
| DELETE            | `pm.response.to.have.status(200)`, returned `id === {{supplyItemId}}` |
| PATCH case status | `pm.response.to.have.status(200)`                                     |
| POST login        | `accessToken` and `refreshToken` present in body                      |
| POST refresh      | new `accessToken` present, different from old value                   |
| POST logout       | `pm.response.to.have.status(200)`                                     |

For 404 edge cases, add a **second request** in each find-one group named `GET find one — 404` that uses a hard-coded fake UUID and asserts `pm.response.to.have.status(404)`.

---

## Dynamic Variable Capture Strategy

Every `POST` that creates a resource must capture the returned `id` in its `Tests` script:

```js
// Example: POST /api/testlab/projects
const body = pm.response.json();
pm.collectionVariables.set('projectId', body.id);
```

Order dependency across the Testlab module (must run top-to-bottom):

```
POST projects  →  projectId
POST milestones(projectId)  →  milestoneId
POST requirements(projectId)  →  requirementId
POST suites(projectId)  →  suiteId
POST cases(projectId, suiteId)  →  caseId
POST runs(projectId)  →  runId
```

Supply Items are independent of Testlab but `supplyItemId` must be captured before any `GET :id`, `PATCH`, or `DELETE` requests in that folder.

DELETE is placed last in the Supply Items folder so the item exists for all preceding reads.

---

## Newman Execution Strategy

### Local run

```bash
# scripts/run-postman.sh
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --reporters cli,json \
  --reporter-json-export postman/results/newman-report.json \
  --bail
```

`--bail` stops on the first failure, preventing cascading failures from broken ID capture.

### CI (GitHub Actions)

Add a `postman-tests` job to the existing pipeline:

```yaml
postman-tests:
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 20 }
    - run: npm install -g newman
    - run: bash scripts/run-postman.sh
      env:
        POSTMAN_BASE_URL: ${{ vars.STAGING_URL }}
        POSTMAN_EMAIL: ${{ secrets.TEST_EMAIL }}
        POSTMAN_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        POSTMAN_TENANT_ID: ${{ secrets.TEST_TENANT_ID }}
```

Environment file values for `email`, `password`, `baseUrl`, and `tenantId` are injected at runtime by Newman's `--env-var` flags (or via a CI-specific environment JSON that is **not** committed).

### Newman output artifact

Newman JSON report is uploaded as a GitHub Actions artifact for inspection after CI runs.

---

## Subtasks

| #   | Task                                                                              | Files                                          |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Create `postman/` directory and `postman/README.md`                               | `postman/README.md`                            |
| 2   | Write `postman/local.environment.json` with placeholder secrets                   | `postman/local.environment.json`               |
| 3   | Write `postman/staging.environment.json`                                          | `postman/staging.environment.json`             |
| 4   | Write `postman/restopsiq-api.collection.json` — Health + Auth folder (5 requests) | `postman/restopsiq-api.collection.json`        |
| 5   | Extend collection — Supply Items folder (7 requests + 2 404 edge cases)           | `postman/restopsiq-api.collection.json`        |
| 6   | Extend collection — Testlab/Projects folder (3 requests + 1 404)                  | `postman/restopsiq-api.collection.json`        |
| 7   | Extend collection — Testlab/Milestones, Requirements, Suites (3×3 requests)       | `postman/restopsiq-api.collection.json`        |
| 8   | Extend collection — Testlab/Cases, Runs (3+3 requests)                            | `postman/restopsiq-api.collection.json`        |
| 9   | Write `scripts/run-postman.sh`                                                    | `scripts/run-postman.sh`                       |
| 10  | Add `newman` to CI workflow and document in `postman/README.md`                   | `.github/workflows/*.yml`, `postman/README.md` |
| 11  | Add `postman/results/` to `.gitignore`                                            | `.gitignore`                                   |

---

## Acceptance Criteria

- [ ] `postman/restopsiq-api.collection.json` is valid Postman v2.1 JSON (importable without errors).
- [ ] `newman run postman/restopsiq-api.collection.json --environment postman/local.environment.json` exits with code 0 against a running local API with a seeded database.
- [ ] All 30 live endpoints have at least one request in the collection.
- [ ] Every request has at least one `pm.test` assertion.
- [ ] All POST-create requests capture the returned `id` into a collection variable.
- [ ] DELETE `/api/supply-items/:id` is the last request in the Supply Items folder.
- [ ] No hardcoded credentials appear in committed files (`email`, `password` are placeholder strings).
- [ ] Newman run produces a JSON report at `postman/results/newman-report.json` (gitignored).
- [ ] `postman/results/` is in `.gitignore`.
- [ ] No API source file was modified.
- [ ] The collection passes with zero test failures in CI.

---

## Risks and Unknowns

| #   | Risk                                                                                                                          | Severity | Mitigation                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **`tenantId` must match a real DB record** — wrong value causes silent 403/404 on all supply-items calls                      | High     | Document the seed script UUID; add a seed fixture that always creates the same deterministic tenant UUID |
| 2   | **Token expiry during long Newman runs** — access tokens may expire mid-run                                                   | High     | Collection pre-request script checks expiry and re-logs in automatically before each request             |
| 3   | **Testlab requests are order-dependent** — any ID capture failure cascades silently                                           | Medium   | Use `--bail` in Newman so the run stops at the first failure                                             |
| 4   | **`supplyitems` tag missing from Swagger `addTag` in `main.ts`** — cannot generate collection from Swagger export             | Medium   | Hand-author the collection; optionally add the tag to Swagger in a separate clean-up task                |
| 5   | **`AuditController` and `LockController` have no routes** — collection will drift when they gain endpoints                    | Low      | Add a note to each controller's task to update the collection; use a placeholder folder with a comment   |
| 6   | **Newman not yet in dev dependencies** — `run-postman.sh` will fail in a clean CI environment without `npm install -g newman` | Low      | Document the global install step; optionally add `newman` as a dev dependency at the root workspace      |
| 7   | **No existing database seed for Testlab** — POST requests may fail if foreign key constraints require pre-existing data       | Medium   | Inspect existing seed scripts; document any prerequisite seed step in `postman/README.md`                |

---

## Validation Commands

After implementation:

```bash
# Verify the collection JSON is parseable
node -e "JSON.parse(require('fs').readFileSync('postman/restopsiq-api.collection.json','utf8')); console.log('valid JSON')"

# Run the full collection against a local API
bash scripts/run-postman.sh

# Run only the Auth folder to validate token flow
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "01 Auth"

# Run only Supply Items to validate x-tenant-id header
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --folder "02 Supply Items"

# Dry-run with no actual server (check collection structure only)
newman run postman/restopsiq-api.collection.json \
  --environment postman/local.environment.json \
  --dry-run
```
