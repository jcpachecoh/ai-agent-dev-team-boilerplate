# RES-226 Task 11 — Postman / Manual API Validation

## Goal

Manually validate all four new auth email endpoints against a running local API instance with
Redis and a real or seeded user in the database. This task is documentation-only — no code
changes.

**Depends on:** Task 10 (fully wired application).

---

## Prerequisites

Before running:

1. Docker services running: `docker compose up -d` (PostgreSQL + Redis).
2. Migrations applied: `cd apps/api && npx prisma migrate dev`.
3. API running: `pnpm --filter=@restopsiq/api start:dev` or `pnpm dev`.
4. A test user exists in DB (use seeder or `POST /auth/signup`).

---

## Out of scope

- No code changes.
- No automated tests.
- No CI/CD pipeline configuration.

---

## Files allowed

- None (documentation-only task).

---

## Test scenarios

### 1. Signup a test user

```http
POST http://localhost:3001/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User",
  "password": "Password123"
}
```

Expected: `201` with `{ accessToken, refreshToken }`.

---

### 2. POST /auth/forgot-password — existing email

```http
POST http://localhost:3001/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

Expected: `200 { "message": "If the email exists, a reset link has been sent." }`

Verify: A `password_reset_tokens` row exists in DB with `usedAt: null`.

---

### 3. POST /auth/forgot-password — non-existing email

```http
POST http://localhost:3001/auth/forgot-password
Content-Type: application/json

{
  "email": "nobody@example.com"
}
```

Expected: `200 { "message": "If the email exists, a reset link has been sent." }` — same
response as above. No DB row created.

---

### 4. POST /auth/reset-password — valid token

Extract `rawToken` from the URL in the email (or query DB `tokenHash` and reverse-engineer via
test mode — in practice, read from email dev inbox like [Resend test mode](https://resend.com/docs/dashboard/emails/introduction)).

```http
POST http://localhost:3001/auth/reset-password
Content-Type: application/json

{
  "token": "<rawToken from email>",
  "newPassword": "NewPassword456"
}
```

Expected: `200 { "message": "Password updated successfully." }`

Verify: `usedAt` is set in `password_reset_tokens` row.

---

### 5. POST /auth/reset-password — reuse token

Repeat the request from scenario 4.

Expected: `400 { "message": "Reset token has already been used" }`.

---

### 6. POST /auth/reset-password — expired token

Manually set `expiresAt` in the past for the DB row, then attempt reset.

Expected: `400 { "message": "Reset token has expired" }`.

---

### 7. POST /auth/resend-verification

```http
POST http://localhost:3001/auth/resend-verification
Content-Type: application/json

{
  "email": "test@example.com"
}
```

Expected: `200 { "message": "If the email exists, a verification code has been sent." }`

Verify: Redis key `otp:{userId}` exists with a 6-digit value and TTL ≤ 900s.

---

### 8. POST /auth/verify-email — correct OTP (requires JWT)

First, login to get `accessToken`:

```http
POST http://localhost:3001/auth/login
{ "email": "test@example.com", "password": "Password123" }
```

Then verify:

```http
POST http://localhost:3001/auth/verify-email
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "otpCode": "<OTP from Redis or email>"
}
```

Expected: `200 { "message": "Email verified successfully." }`

Verify: Redis key `otp:{userId}` no longer exists.

---

### 9. POST /auth/verify-email — wrong OTP

```http
POST http://localhost:3001/auth/verify-email
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "otpCode": "000000"
}
```

Expected: `400 { "message": "Invalid or expired verification code" }`.

---

### 10. POST /auth/verify-email — without JWT

```http
POST http://localhost:3001/auth/verify-email
Content-Type: application/json

{
  "otpCode": "123456"
}
```

Expected: `401 Unauthorized` (endpoint is not `@Public()`).

---

## Acceptance criteria

- [ ] All 10 scenarios produce the expected HTTP status codes.
- [ ] `forgot-password` always returns 200, regardless of email existence.
- [ ] Reset token is single-use (reuse returns 400).
- [ ] Expired token returns 400 with descriptive message.
- [ ] OTP is stored in Redis and deleted after successful verification.
- [ ] `verify-email` without JWT returns 401.

---

## Validation commands

```bash
# Check Redis OTP key
redis-cli GET otp:<userId>

# Check DB reset token
psql $DATABASE_URL -c "SELECT id, token_hash, expires_at, used_at FROM password_reset_tokens;"
```
