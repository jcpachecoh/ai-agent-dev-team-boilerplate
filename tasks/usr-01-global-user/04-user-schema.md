# USR-01 Task 04 — User Schema

## Goal

Add the global `User` model to `schema.prisma` with all USR-01 required fields, indexes, and relation to `Role`. Map to physical table `users` via `@@map("users")`. **AuditLog** and **PasswordResetToken** Prisma relations to `User` are deferred until auth repoint/backfill (post Task 08).

**Depends on:** Task 03 (`Role` and `DocumentType` exist in schema).

---

## Scope

- Add `User` model with all ticket-required fields.
- Wire relation: `User.roleId` → `Role`
- Keep `AuditLog.userId` and `PasswordResetToken.userId` as orphan string fields (no Prisma `@relation` to `User` yet).
- Add required indexes and unique constraints.
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

### Required `User` fields

| Field               | Type                          | Notes                                              |
| ------------------- | ----------------------------- | -------------------------------------------------- |
| `id`                | `String @id @default(cuid())` | Primary key                                        |
| `tenantId`          | `String`                      | Tenant scope                                       |
| `cedula`            | `String`                      | Unique per tenant; plain string per ticket         |
| `documentType`      | `DocumentType`                | CC, CE, PASAPORTE, TI, PEP                         |
| `email`             | `String`                      | Unique per tenant                                  |
| `passwordHash`      | `String`                      | bcrypt cost 12; never plain text                   |
| `roleId`            | `String`                      | FK → `Role`                                        |
| `loginAttempts`     | `Int @default(0)`             |                                                    |
| `lockedUntil`       | `DateTime?`                   |                                                    |
| `lastLoginAt`       | `DateTime?`                   |                                                    |
| `passwordChangedAt` | `DateTime?`                   |                                                    |
| `refreshToken`      | `String?`                     | Stored hashed at application layer                 |
| `isActive`          | `Boolean @default(true)`      |                                                    |
| `emailVerified`     | `Boolean @default(false)`     |                                                    |
| `createdAt`         | `DateTime @default(now())`    |                                                    |
| `updatedAt`         | `DateTime @updatedAt`         |                                                    |
| `deletedAt`         | `DateTime?`                   | Soft delete                                        |
| `createdBy`         | `String?`                     | Optional self-reference string; no FK in this task |

### Required indexes

- `@@unique([tenantId, email])`
- `@@unique([tenantId, cedula])`
- `@@index([tenantId, roleId])`
- `@@index([isActive])`
- `@@map("users")`

### Relations to add now

- `role Role @relation(...)`

### Relations deferred until auth repoint / backfill (Task 08+ / Task 06b)

- `auditLogs AuditLog[]` — `audit_logs.userId` currently stores UserTestLab IDs; DB FK targets `users_testlab`
- `passwordResetTokens PasswordResetToken[]` — `userId` stores UserTestLab IDs; no DB FK today

Wire these in a follow-up migration after `User` rows exist and auth repoints from `UserTestLab` to `User`.

### Relations explicitly deferred (models do not exist)

Do **not** add Prisma relations for:

- `EmployeeProfile` (1:1)
- `PayrollProfile` (1:1)
- `OperationalUser` (1:1) — added in task 05
- `BankAccount[]`
- `EmergencyContact[]`
- `UserPermission[]`
- `LoginAudit[]`

### Security note (schema level)

- `passwordHash` and `refreshToken` exist on the model for persistence.
- Application layers (task 08, 10) must never expose these in default query responses.

---

## Out of scope

- No migrations (task 06).
- No `OperationalUser.userId` link (task 05).
- No changes to `apps/api/src/`.
- No seed data.

---

## Allowed files

- `apps/api/prisma/schema.prisma` — add `User` model; do **not** add `AuditLog`/`PasswordResetToken` relations to `User`

---

## Forbidden files

- Any file under `apps/api/src/`
- Any file under `packages/`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- `apps/api/src/app.module.ts`

---

## Acceptance criteria

- [x] `User` model exists with all required fields listed above.
- [x] `@@unique([tenantId, email])` and `@@unique([tenantId, cedula])` defined.
- [x] `@@index([tenantId, roleId])` and `@@index([isActive])` defined.
- [x] `@@map("users")` on `User`.
- [x] `User.roleId` FK → `Role` with back-relation on `Role`.
- [x] `AuditLog.userId` remains orphan `String?` (no `@relation` to `User`).
- [x] `PasswordResetToken.userId` remains orphan `String` (no `@relation` to `User`).
- [x] No relations added for deferred models (EmployeeProfile, PayrollProfile, BankAccount, EmergencyContact, UserPermission, LoginAudit).
- [x] `OperationalUser` unchanged in this task.
- [x] `npx prisma format` exits 0.
- [x] `npx prisma validate` exits 0.
- [x] `npx prisma generate` exits 0.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```

---

## Risks

| Risk                                        | Notes                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Schema/DB drift                             | `users` table does not exist until task 06 — expected after task 02 drop   |
| `createdBy` self-FK omitted                 | Per task scope; add in future ticket if audit trail requires enforced FK   |
| Plain `cedula` storage                      | Compliance review in task 10                                               |
| Breaking `AuditLog` FK in DB                | DB FK still targets `users_testlab` until Task 06b repoints after backfill |
| Early AuditLog/PasswordResetToken → User FK | Deferred from Task 04 — wire after auth repoint (Task 08+)                 |

---

## Stop rule

**Stop after this task.** Report files changed and validation results. **Do not proceed to task 05 (OperationalUser link) without explicit approval.**
