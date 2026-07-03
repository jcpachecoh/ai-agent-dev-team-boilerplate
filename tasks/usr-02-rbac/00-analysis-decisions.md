# USR-02 Task 00 — Analysis & Decisions

## Goal

Document the analysis, architectural decisions, and task sequence for **USR-02 — RBAC: Role + Permission + RolePermission + UserPermission**. No implementation in this task.

**Depends on:** USR-01 complete (tenant-scoped `Role`, global `User` with `roleId`, linked `OperationalUser.userId` optional).

**Status:** Complete (foundation epic closed 2026-05-29; enforcement deferred to USR-02B or USR-03).

---

## Scope

- Record current-state RBAC findings post USR-01.
- Record approved model and resolution rules for the foundation epic.
- Define the ordered task sequence (tasks 01–09).
- Capture decisions downstream tasks must follow.

---

## Out of scope

- Any code, schema, or migration changes.
- Controller/guard enforcement.
- JWT payload changes.
- MES auth behavior changes.
- Gateway changes.

---

## Allowed files

- `tasks/usr-02-rbac/00-analysis-decisions.md` (this file)
- Other files under `tasks/usr-02-rbac/` (task definitions only)

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- Any file under `apps/api/src/`
- Any file under `packages/`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Current state summary (post USR-01)

### Identity & roles

| Layer      | Model                                | Role representation                 |
| ---------- | ------------------------------------ | ----------------------------------- |
| Email auth | global `User`                        | `roleId` → tenant-scoped `Role`     |
| MES auth   | `OperationalUser`                    | `OperationalRole` enum on row       |
| Link       | `OperationalUser.userId` → `User.id` | Optional; seeded for owner/operator |

Four tenant roles seeded for `palos-de-lena`: `OWNER`, `SUPERVISOR`, `MANAGER`, `OPERATOR` (codes align with `OperationalRole`).

### Authorization today

| Mechanism                  | Where               | What it checks                        |
| -------------------------- | ------------------- | ------------------------------------- |
| `JwtAuthGuard`             | Global `APP_GUARD`  | Email JWT valid; no role/permission   |
| `MesJwtGuard`              | MES/plant routes    | MES JWT valid + Redis blacklist       |
| `MesRolesGuard` + `@Roles` | Selected MES routes | `req.user.role` ∈ `OperationalRole[]` |

**No** `Permission`, `RolePermission`, or `UserPermission` models exist.

**Gaps:** Email JWT payload is `{ sub, email }` only. Supply-items routes have no role check. Most plant master-data routes (workstations, recipes) require only `MesJwtGuard` — any authenticated MES user including `OPERATOR` can mutate.

### JWT payloads (unchanged in USR-02 foundation)

| Auth  | Payload fields                                           |
| ----- | -------------------------------------------------------- |
| Email | `sub`, `email`                                           |
| MES   | `sub`, `cedulaHash`, `role`, `sedeId`, `tenantId`, `jti` |

---

## Approved decisions (foundation epic)

### 1. `Role` remains tenant-scoped

Keep existing USR-01 `Role` model (`tenantId` + `code` unique). Do not introduce a global role catalog in USR-02.

### 2. `Permission` is a global catalog

Permission codes are system-defined and identical across tenants (e.g. `plant.orders.create`). No `tenantId` on `Permission`.

### 3. `RolePermission` is effectively tenant-scoped through `Role`

Join table `(roleId, permissionId)`. Tenant boundary comes from `Role.tenantId`. No redundant `tenantId` on `RolePermission` in v1.

### 4. `UserPermission` is tenant-scoped through `User`

Join table `(userId, permissionId)`. Tenant boundary comes from `User.tenantId`. Resolver must verify caller tenant matches user tenant when invoked from HTTP (enforcement epic).

### 5. `UserPermission` supports `ALLOW` and `DENY`

Use `PermissionEffect` enum: `ALLOW` | `DENY`.

### 6. Effective permission formula

```
effective = (rolePermissions ∪ userAllows) \ userDenies
```

Where:

- `rolePermissions` = permission codes granted via `User.roleId` → `RolePermission`
- `userAllows` = `UserPermission` rows with `effect = ALLOW`
- `userDenies` = `UserPermission` rows with `effect = DENY`

### 7. DENY overrides ALLOW

If the same permission appears in both user ALLOW and user DENY, **DENY wins**.

### 8. Unlisted permission means denied

Fail closed: if a permission code is not in the effective set, treat as **denied**.

### 9. Enforcement guards deferred

USR-02 foundation adds schema, seed, and resolver only. **Do not** wire `@RequirePermissions`, replace `MesRolesGuard`, change JWT payloads, or modify controller authorization in this epic. Enforcement belongs to **USR-02B** or **USR-03**.

### 10. `OperationalRole` enum remains unchanged

Do not remove or replace `OperationalUser.role` enum in USR-02. MES JWT and `MesRolesGuard` continue using `OperationalRole` until a future migration epic.

### 11. Permission naming convention

Pattern: `{domain}.{resource}.{action}` — lowercase, dot-separated, stable DB codes.

Examples: `mes.users.create`, `plant.orders.read`, `plant.orders.plan`, `supply.items.manage`.

### 12. Resolver identity anchor

`PermissionsService.resolveEffectivePermissions(userId, tenantId)` resolves from **global `User.id`**. For MES-only operational profiles without `userId`, bridging via enum → role code is **out of scope** for foundation (document for enforcement epic).

---

## Proposed permission catalog (seed reference)

| Code                          | Description                       |
| ----------------------------- | --------------------------------- |
| `mes.users.create`            | Create operational user           |
| `mes.users.role.read`         | Read operational user role        |
| `plant.workstations.manage`   | CRUD workstations                 |
| `plant.recipes.manage`        | CRUD recipes                      |
| `plant.orders.read`           | List/read production orders       |
| `plant.orders.create`         | Create production order           |
| `plant.orders.plan`           | Plan order                        |
| `plant.orders.pause`          | Pause order                       |
| `plant.orders.resume`         | Resume order                      |
| `plant.orders.cancel`         | Cancel order                      |
| `plant.executions.qa_approve` | QA approve execution              |
| `supply.items.read`           | Read supply items                 |
| `supply.items.manage`         | Create/update/delete supply items |

### Role matrix (palos-de-lena seed — task 06)

| Permission                              | OWNER | MANAGER | SUPERVISOR | OPERATOR |
| --------------------------------------- | :---: | :-----: | :--------: | :------: |
| `mes.users.*`                           |   ✓   |    —    |     —      |    —     |
| `plant.workstations.manage`             |   ✓   |    ✓    |     ✓      |    —     |
| `plant.recipes.manage`                  |   ✓   |    ✓    |     ✓      |    —     |
| `plant.orders.read`                     |   ✓   |    ✓    |     ✓      |    ✓     |
| `plant.orders.create`                   |   ✓   |    ✓    |     ✓      |    —     |
| `plant.orders.plan/pause/resume/cancel` |   ✓   |    ✓    |     ✓      |    —     |
| `plant.executions.qa_approve`           |   ✓   |    ✓    |     ✓      |    —     |
| `supply.items.read`                     |   ✓   |    ✓    |     ✓      |    ✓     |
| `supply.items.manage`                   |   ✓   |    ✓    |     ✓      |    —     |

MANAGER and SUPERVISOR share the same matrix in v1 (matches current `SUPERVISOR_ROLES` grouping in plant controller).

---

## Task sequence

| Task | Title                                        |
| ---- | -------------------------------------------- |
| 01   | `Permission` schema                          |
| 02   | `RolePermission` schema                      |
| 03   | `UserPermission` schema + `PermissionEffect` |
| 04   | RBAC migration                               |
| 05   | Seed permission catalog                      |
| 06   | Seed role-permission matrix                  |
| 07   | Permissions module (repository + service)    |
| 08   | Permission resolution tests                  |
| 09   | Validation & closure                         |

---

## Acceptance criteria

- [x] Current RBAC state documented.
- [x] All eleven approved decisions recorded above.
- [x] Task sequence 01–09 defined with clear boundaries.
- [x] Enforcement explicitly deferred to USR-02B / USR-03.
- [x] No forbidden files modified.

---

## Epic closure (Task 09 — 2026-05-29)

USR-02 foundation is **complete**. Delivered:

- Global `Permission` catalog (13 codes)
- `RolePermission` and `UserPermission` join tables + migration `20260530001907_usr_02_rbac_foundation`
- Idempotent seed: permissions + `palos-de-lena` role matrix (37 role-permission rows)
- `PermissionsModule` with `PermissionsService.resolveEffectivePermissions` / `hasPermission`
- 25 unit tests covering resolver formula and edge cases

**Not delivered (deferred):**

- `@RequirePermissions` decorator / `PermissionsGuard`
- `PermissionsModule` registration in `AppModule`
- HTTP endpoint enforcement on controllers
- JWT payload enrichment (`tenantId`, `roleCode`, permission claims)
- Replacement of `MesRolesGuard` with permission checks
- MES-only operational user → global User permission bridging
- Supply-items / plant master-data authorization alignment with seed matrix
- Gateway RBAC
- Postman collection updates for permission-gated routes

---

## Validation commands

Planning task — no runtime validation. Confirm task files exist:

```bash
ls tasks/usr-02-rbac/
```

---

## Risks

| Risk                                   | Notes                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Dual role sources                      | `User.roleId` vs `OperationalUser.role` enum can diverge until unified     |
| Seed matrix vs live guards             | Seed may be stricter than current `MesRolesGuard` coverage                 |
| Resolver without enforcement           | Foundation delivers data + API internally; no user-visible behavior change |
| `PermissionsModule` not in `AppModule` | Forbidden until enforcement epic — tests use `TestingModule`               |

---

## Stop rule

**Stop after this task.** Report task files created. **Do not proceed to task 01 (Permission schema) without explicit approval.**
