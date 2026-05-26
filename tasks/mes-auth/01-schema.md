# MES-AUTH-01 Task 01 — Prisma Schema: `OperationalUser` + `OperationalRole`

## Goal

Add the `OperationalRole` enum and `OperationalUser` model to `apps/api/prisma/schema.prisma`
for the MES cédula + PIN authentication flow. Run format, validate, and generate to confirm
the schema is valid and the Prisma client is updated.

**Status:** ✅ Done

---

## Scope

- Add `OperationalRole` enum and `OperationalUser` model to `schema.prisma`.
- Run `prisma format`, `prisma validate`, `prisma generate`.
- Nothing else.

---

## Out of scope

- No migrations (`prisma migrate dev` is forbidden in this task).
- No service, repository, controller, or DTO code.
- No changes to `UserTestLab` or any existing model.
- No changes to `package.json` or `pnpm-lock.yaml`.

---

## Files allowed

- `apps/api/prisma/schema.prisma` — append enum + model only

---

## Files forbidden

- Any file in `apps/api/src/`
- Any file in `packages/`
- `package.json` / `pnpm-lock.yaml`
- Any migration file

---

## Implementation

Added at the end of `schema.prisma`, after `PasswordResetToken`:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// MES OPERATIONAL USERS (cédula + PIN auth)
// ─────────────────────────────────────────────────────────────────────────────

enum OperationalRole {
  OWNER
  SUPERVISOR
  MANAGER
  OPERATOR
}

model OperationalUser {
  id            String          @id @default(cuid())
  cedulaHash    String          @unique
  pinHash       String
  role          OperationalRole
  tenantId      String
  sedeId        String?
  loginAttempts Int             @default(0)
  lockedUntil   DateTime?
  refreshToken  String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@index([tenantId])
  @@index([tenantId, role])
  @@map("operational_users")
}
```

**Design decisions:**

- `cedulaHash` is SHA-256 of the raw cédula — used as lookup key (`@unique`), not bcrypt, so
  it can be computed and searched deterministically.
- `pinHash` is bcrypt — used only for comparison, never for lookup.
- `loginAttempts` + `lockedUntil` — managed by the service, not the DB. The repository only
  reads/writes these fields; no lockout logic lives here.
- No `@relation` to any existing model — fully isolated from the TestLab domain.
- `@@index([tenantId])` — supports listing all users of a tenant.
- `@@index([tenantId, role])` — supports role-scoped queries (e.g., list all operators for a sede).

---

## Acceptance criteria

- [x] `apps/api/prisma/schema.prisma` contains `OperationalRole` enum and `OperationalUser` model.
- [x] `npx prisma format` exits 0.
- [x] `npx prisma validate` exits 0.
- [x] `npx prisma generate` exits 0 and regenerates Prisma client.
- [x] `UserTestLab` model was not modified.
- [x] No migration was created.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
