# Epic: MES Auth — Cédula + PIN Authentication

**Linear:** MES-AUTH-01  
**Branch:** `feature/mes-auth-01-cedula-pin-role`  
**Status:** In Progress  
**Priority:** High

---

## Goal

Implement a separate operational authentication flow for plant-floor users (operators, supervisors, managers, owners) that authenticates via **cédula** (8–11 digits) + **PIN** (4–6 digits) instead of email + password.

This flow is completely independent of the existing `UserTestLab` / email-based auth. It uses a separate Prisma model (`OperationalUser`), a separate NestJS module (`MesAuthModule`), a separate Passport strategy (`mes-jwt`), and a separate set of endpoints under `/mes/auth`.

---

## Design Principles

### 1. Separate domain — do not touch `UserTestLab`

`UserTestLab` belongs to the TestLab bounded context. `OperationalUser` is a new model mapped to `operational_users` in a separate section of the schema.

### 2. Credentials stored as hashes only

- `cedulaHash`: SHA-256 of the raw cédula (not bcrypt — used as lookup key).
- `pinHash`: bcrypt hash of the raw PIN (used for comparison).

### 3. Lockout after 3 failed attempts

After 3 consecutive failed logins, `lockedUntil` is set to `now() + 15 min`. The service checks and rejects locked accounts before comparing credentials.

### 4. Rate limit: 5 attempts/min per IP

Implemented with ioredis counters (sliding window), not ThrottlerModule, to avoid adding a new NestJS module dependency.

### 5. Generic 401 message

All credential failures return `"Cédula o PIN incorrecto"` — no enumeration of whether the cédula exists or the PIN is wrong.

### 6. JWT claims: 8h access token

```
{ sub, cedulaHash, role, sedeId, tenantId, exp: +8h }
```

Refresh token is bcrypt-hashed and stored in `OperationalUser.refreshToken`.

### 7. Separate Passport strategy

`MesJwtStrategy` uses the name `'mes-jwt'` to avoid collision with the existing `'jwt'` strategy. `MesJwtGuard` wraps it.

---

## Module structure

```
apps/api/src/mes/auth/
├── interfaces/
│   └── mes-auth.interfaces.ts
├── repository/
│   └── mes-auth.repository.ts
├── service/
│   └── mes-auth.service.ts
├── controller/
│   ├── mes-auth.controller.ts
│   └── dto/
│       └── mes-login.dto.ts
├── strategies/
│   └── mes-jwt.strategy.ts
├── guards/
│   └── mes-jwt.guard.ts
├── test/
│   ├── mes-auth.repository.spec.ts
│   └── mes-auth.service.spec.ts
└── mes-auth.module.ts
```

---

## Endpoints

| Method | Path                      | Auth          | Description              |
| ------ | ------------------------- | ------------- | ------------------------ |
| POST   | `/mes/auth/login`         | Public        | Cédula + PIN → JWT       |
| POST   | `/mes/auth/logout`        | `MesJwtGuard` | Invalidate refresh token |
| GET    | `/mes/auth/me`            | `MesJwtGuard` | Current user info        |
| GET    | `/mes/users/:userId/role` | `MesJwtGuard` | Get role for a user      |

---

## Subtask Breakdown

| File                  | Title                                                 | Status  |
| --------------------- | ----------------------------------------------------- | ------- |
| `01-schema.md`        | Prisma schema — `OperationalUser` + `OperationalRole` | ✅ Done |
| `02-interfaces.md`    | TypeScript interfaces + `MesJwtPayload`               | Pending |
| `03-repository.md`    | `MesAuthRepository` + unit tests                      | Pending |
| `04-service.md`       | `MesAuthService` — login, logout, lockout, rate-limit | Pending |
| `05-dtos.md`          | `MesLoginDto` with cédula + PIN validators            | Pending |
| `06-controller.md`    | `MesAuthController` — 4 endpoints                     | Pending |
| `07-jwt-strategy.md`  | `MesJwtStrategy` + `MesJwtGuard`                      | Pending |
| `08-module-wiring.md` | `MesAuthModule` + `validate-structure`                | Pending |

---

## Acceptance Criteria (Epic-level)

- [ ] `POST /mes/auth/login` returns `{ accessToken, refreshToken }` for valid cédula + PIN
- [ ] Failed login increments `loginAttempts`; 3rd failure locks for 15 min
- [ ] Locked account returns `401 "Cédula o PIN incorrecto"` (not a lockout message)
- [ ] Rate limit: 5 attempts/min per IP; excess returns `429`
- [ ] `GET /mes/auth/me` returns `{ id, role, tenantId, sedeId }`
- [ ] `GET /mes/users/:userId/role` returns `{ role }`
- [ ] `POST /mes/auth/logout` clears `refreshToken` in DB
- [ ] JWT access token expires in 8h, payload includes `{ sub, cedulaHash, role, sedeId, tenantId }`
- [ ] `UserTestLab` model is unchanged
- [ ] `node scripts/validate-structure.js` passes
- [ ] All unit tests pass
