# USR-02 Task 09 — Validation & Closure

## Goal

Validate the complete **USR-02 foundation** epic: schema integrity, migration, seed (permissions + role matrix), permission resolver service, and tests. Confirm enforcement remains deferred. Document closure and follow-up epic (USR-02B / USR-03).

**Depends on:** Tasks 01–08 complete.

---

## Scope

- Run full validation command suite (see below).
- Verify DB state after seed (permission count, role-permission counts per role).
- Security checklist for resolver (tenant isolation, no secret leakage).
- Document known deferred items and recommended enforcement sequence.
- Update this file's **Execution results** section when run.

---

## Out of scope

- Controller/guard enforcement verification (not implemented).
- JWT payload verification (unchanged).
- MES auth regression beyond ensuring no accidental changes.
- Gateway validation.
- Postman updates (enforcement epic).

---

## Allowed files

- `tasks/usr-02-rbac/09-validation.md` (this file — append results section only when executing)

---

## Forbidden files

- `apps/api/prisma/schema.prisma` (unless hotfix explicitly approved)
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- Any file under `apps/api/src/` (unless hotfix explicitly approved)
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Validation checklist

### Schema & migration

| Check                        | Expected                                                           |
| ---------------------------- | ------------------------------------------------------------------ |
| `Permission` model in schema | Global catalog, unique `code`                                      |
| `RolePermission` join        | FKs to `Role`, `Permission`                                        |
| `UserPermission` join        | `PermissionEffect` ALLOW/DENY                                      |
| Migration applied            | `permissions`, `role_permissions`, `user_permissions` tables exist |
| USR-01 tables untouched      | `roles`, `users`, `operational_users` intact                       |

### Seed

| Check               | Expected              |
| ------------------- | --------------------- |
| Permission count    | 13 active permissions |
| OWNER grants        | 13 role_permissions   |
| MANAGER grants      | 11 (no mes.users.\*)  |
| SUPERVISOR grants   | 11 (same as MANAGER)  |
| OPERATOR grants     | 2                     |
| UserPermission rows | 0 in default seed     |

### Application

| Check                      | Expected                               |
| -------------------------- | -------------------------------------- |
| `PermissionsModule` exists | Under `apps/api/src/permissions/`      |
| Not in `AppModule`         | No import in `app.module.ts`           |
| Resolution formula         | Tests prove `(role ∪ allow) \ deny`    |
| DENY overrides ALLOW       | Test passes                            |
| Fail closed                | `hasPermission` false for unknown code |

### Regression

| Check                | Expected                                   |
| -------------------- | ------------------------------------------ |
| MES auth unchanged   | `MesRolesGuard`, MES JWT payload unchanged |
| Email auth unchanged | Auth JWT payload unchanged                 |
| Auth/mes tests       | All pass                                   |

### Explicitly deferred (must remain true)

| Item                                       | Status                       |
| ------------------------------------------ | ---------------------------- |
| No `@RequirePermissions` on controllers    | Deferred to USR-02B / USR-03 |
| `MesRolesGuard` not replaced               | Deferred                     |
| JWT payloads unchanged                     | Deferred                     |
| Supply-items unauthorized access unchanged | Deferred (known gap)         |
| Gateway RBAC unchanged                     | Deferred                     |
| `OperationalRole` enum unchanged           | Deferred                     |

---

## Validation commands

```bash
cd apps/api
pnpm prisma validate
pnpm prisma migrate deploy
pnpm prisma generate
pnpm db:seed

node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=permissions
pnpm --filter=@restopsiq/api test -- --testPathPattern='auth|mes/auth'
pnpm --filter=@restopsiq/api run test:cov
```

Optional DB verification:

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM permissions;"
psql "$DATABASE_URL" -c "SELECT r.code, COUNT(*) FROM role_permissions rp JOIN roles r ON r.id = rp.\"roleId\" WHERE r.\"tenantId\" = 'palos-de-lena' GROUP BY r.code ORDER BY r.code;"
```

---

## Acceptance criteria

- [x] All validation commands exit 0.
- [x] Seed produces expected permission and role-permission counts.
- [x] Permission resolution tests pass (task 08).
- [x] No auth/mes regressions.
- [x] `app.module.ts` does not import `PermissionsModule`.
- [x] Deferred enforcement items documented.
- [x] Epic closure recommendation recorded.

---

## Epic closure recommendation (template)

When all checks pass:

> USR-02 foundation complete. Global permission catalog, role and user join tables, seed matrix for `palos-de-lena`, and `PermissionsService` resolver with tests. Authorization enforcement in HTTP layer deferred to USR-02B or USR-03.

---

## Follow-up epic (USR-02B / USR-03) — planning reference only

Suggested enforcement sequence (not in scope):

1. `@RequirePermissions()` decorator + `PermissionsGuard`
2. Register `PermissionsModule` in `AppModule`
3. Pilot: `mes-auth` OWNER routes
4. Plant order mutations (replace `@Roles` gradually)
5. Email JWT enrichment (`tenantId`, `roleCode`)
6. Supply-items mutations
7. MES operational user → global User permission bridging

---

## Risks

| Risk                      | Notes                                                           |
| ------------------------- | --------------------------------------------------------------- |
| False sense of security   | Foundation adds DB + resolver but no HTTP enforcement yet       |
| Seed stricter than guards | Operators still mutate plant master data until enforcement epic |
| Test coverage gap         | No integration test against real DB — acceptable for foundation |

---

## Stop rule

**Stop after this task.** Report validation results and epic closure recommendation. **Do not start USR-02B enforcement without explicit approval.**

---

## Execution results

Executed: **2026-05-29**

### Command results

| Command                                                                      | Result                                    |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| `cd apps/api && pnpm prisma validate`                                        | Pass                                      |
| `cd apps/api && pnpm prisma migrate deploy`                                  | Pass — 16 migrations applied, no pending  |
| `cd apps/api && pnpm prisma generate`                                        | Pass                                      |
| `cd apps/api && pnpm prisma db seed`                                         | Pass                                      |
| `node scripts/validate-structure.js`                                         | Pass — 7 modules (includes `permissions`) |
| `pnpm --filter=@restopsiq/api typecheck`                                     | Pass                                      |
| `pnpm --filter=@restopsiq/api test -- --testPathPattern='permissions\|rbac'` | Pass — 3 suites, **25 tests**             |
| `pnpm --filter=@restopsiq/api test -- --testPathPattern='auth\|mes/auth'`    | Pass — 19 suites, **228 tests**           |
| `pnpm --filter=@restopsiq/api run test:cov`                                  | Pass — 39 suites, **440 tests**           |

### DB state after seed

| Table / metric     | Expected | Actual |
| ------------------ | -------- | ------ |
| `permissions`      | 13       | **13** |
| `role_permissions` | 37       | **37** |
| `user_permissions` | 0        | **0**  |
| OWNER grants       | 13       | **13** |
| MANAGER grants     | 11       | **11** |
| SUPERVISOR grants  | 11       | **11** |
| OPERATOR grants    | 2        | **2**  |

### PermissionsService behavior (Task 08 tests)

| Scenario                                          | Verified |
| ------------------------------------------------- | -------- |
| Role grants only (OPERATOR 2, OWNER 13)           | Pass     |
| User ALLOW adds permission                        | Pass     |
| User DENY removes role permission                 | Pass     |
| DENY overrides user ALLOW                         | Pass     |
| DENY overrides role grant + ALLOW                 | Pass     |
| Inactive permissions excluded (repository filter) | Pass     |
| Inactive / deleted / wrong-tenant user rejected   | Pass     |
| Empty role + no overrides → empty set             | Pass     |
| Duplicate codes deduplicated                      | Pass     |
| `hasPermission` fail-closed for unlisted code     | Pass     |

Coverage: `permissions.service.ts` **100%** statements/lines; `permissions.repository.ts` **100%** statements/lines.

### Enforcement deferred (verified)

| Check                                     | Result                 |
| ----------------------------------------- | ---------------------- |
| No `RequirePermissions` decorator         | Confirmed (grep)       |
| No `PermissionGuard` / `PermissionsGuard` | Confirmed (grep)       |
| `PermissionsController` has no routes     | Empty placeholder only |
| `PermissionsModule` not in `AppModule`    | Confirmed (grep)       |
| `MesRolesGuard` unchanged                 | Auth/mes tests pass    |
| JWT payloads unchanged                    | Auth/mes tests pass    |

### Epic closure recommendation

> **USR-02 foundation complete.** Global permission catalog, role and user join tables, seed matrix for `palos-de-lena`, and `PermissionsService` resolver with tests. Authorization enforcement in the HTTP layer deferred to **USR-02B** or **USR-03**.

**USR-02 can be closed.**
