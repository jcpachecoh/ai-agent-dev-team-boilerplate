# RES-226 Task 01 — Prisma Schema: PasswordResetToken

## Goal

Add the `PasswordResetToken` model to `apps/api/prisma/schema.prisma`, run `prisma format`,
`prisma validate`, and `prisma generate` to confirm the schema is valid and the Prisma client
is regenerated.

---

## Scope

- Add `PasswordResetToken` model to `schema.prisma`.
- Run format, validate, and generate.
- Nothing else.

---

## Out of scope

- No migrations (`prisma migrate dev` is forbidden in this task).
- No service, repository, or controller code.
- No changes to the `User` model or any existing model.
- No changes to `package.json` or `pnpm-lock.yaml`.

---

## Files allowed

- `apps/api/prisma/schema.prisma` — add model only

---

## Files forbidden

- Any file in `apps/api/src/`
- Any file in `packages/`
- `package.json` / `pnpm-lock.yaml`
- Any migration file

---

## Implementation notes

Add this model at the end of `schema.prisma`, after the `AuditLog` model:

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET TOKENS
// ─────────────────────────────────────────────────────────────────────────────

model PasswordResetToken {
  id        String    @id @default(cuid())
  tenantId  String
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([tenantId, userId])
  @@map("password_reset_tokens")
}
```

**Design decisions:**

- No `@relation` to `User` — avoids touching the `User` model and keeps this ticket self-contained.
- `tenantId` is a plain `String`, consistent with the rest of the codebase.
- `tokenHash` is `@unique` — enables fast single-field lookup without compound key.
- `usedAt` is nullable — `null` means token is unused; non-null means consumed.
- No `removeAfterUse` — expired/used tokens are cleaned up by `AuthEmailRepository.deleteExpiredResetTokens()`.

---

## Acceptance criteria

- [ ] `apps/api/prisma/schema.prisma` contains the `PasswordResetToken` model.
- [ ] `npx prisma format` exits 0 with no changes (or reformats correctly).
- [ ] `npx prisma validate` exits 0.
- [ ] `npx prisma generate` exits 0 and regenerates Prisma client.
- [ ] No other model or file was changed.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
