# AUTH-03 Task 01 — Uniqueness, Password Policy, Bcrypt

## Goal

Harden tenant-scoped uniqueness handling, align password length with ticket (**> 8** → minimum **9** characters), and confirm bcrypt cost **12** on all password paths.

---

## Scope

- **Email / cédula uniqueness (global signup):** Keep service pre-checks; add Prisma `P2002` → `ConflictException` on `createUser` race so clients never see raw DB errors.
- **MES duplicate cédula:** Verify `MesAuthService.createUser` conflict behavior; document `User.cedula` vs `OperationalUser.cedulaHash` in code comment or task report only if no doc file allowed.
- **Password policy:** Update `SignupDto`, `ChangePasswordDto`, `ResetPasswordDto` to `@MinLength(9)` (or document approved exception if staying at 8).
- **Gateway parity:** Update `SignupSchema`, `ChangePasswordSchema`, `ResetPasswordSchema` in `apps/gateway/src/utils/validation.ts` to `.min(9)` when API changes.
- **Bcrypt:** Confirm `SALT_ROUNDS = 12` in `auth.service.ts` (signup, change, reset, refresh storage); confirm seed uses 12 (read-only verify — seed edit only if task explicitly needs password example update).
- **Tests:** Duplicate email/cédula signup; weak password (8 chars → 400); password length 9 accepted; bcrypt `hash(..., 12)` on signup/change/reset; optional P2002 mapping test.

**Out of scope:** Login lockout (task 02), token TTL changes (task 02), Postman (task 03), schema migrations.

---

## Allowed files

- `apps/api/src/auth/service/auth.service.ts`
- `apps/api/src/auth/repository/auth.repository.ts`
- `apps/api/src/auth/interfaces/auth.interfaces.ts` (if repository signature changes)
- `apps/api/src/auth/controller/dto/signup.dto.ts`
- `apps/api/src/auth/controller/dto/change-password.dto.ts`
- `apps/api/src/auth/controller/dto/reset-password.dto.ts`
- `apps/api/src/auth/test/auth.service.spec.ts`
- `apps/api/src/auth/test/auth.repository.spec.ts` (if P2002 handling added in repo)
- `apps/api/src/mes/auth/service/mes-auth.service.ts` (only if duplicate-cédula comment or tiny conflict-message alignment)
- `apps/api/src/mes/auth/test/mes-auth.service.spec.ts` (only if MES touched)
- `apps/gateway/src/utils/validation.ts`
- `apps/gateway/tests/utils/validation.test.ts`

---

## Forbidden files

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/**`
- `apps/api/prisma/seed.ts` (unless team approves password example tweak in same PR)
- `apps/api/src/app.module.ts`
- `postman/**`
- `package.json` / `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- Files outside auth/MES-auth/gateway validation listed above

---

## Acceptance criteria

- [x] Signup returns **409** with safe message for duplicate email or cédula (service check unchanged or improved).
- [x] Concurrent signup unique violation maps to **409**, not 500 (P2002 handled).
- [x] Passwords with length **≤ 8** rejected on signup, change-password, reset-password (**400** validation).
- [x] Passwords with length **≥ 9** accepted (with existing max length).
- [x] All password hashing uses bcrypt **cost 12** (no regression).
- [x] Gateway Zod schemas match API min length when global GraphQL auth is used.
- [x] Unit tests cover duplicate signup, weak password, and bcrypt cost 12.
- [x] `node scripts/validate-structure.js` passes if auth module files changed.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api test -- --testPathPattern="auth\.(service|repository)\.spec"
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/gateway test -- --testPathPattern=validation
pnpm --filter=@restopsiq/gateway typecheck
```

---

## Risks

| Risk                                               | Mitigation                                                     |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Min length 9 breaks clients using 8-char passwords | Update Postman in task 03; seed already uses 12+ char password |
| Gateway/API drift                                  | Change both in same task                                       |
| Touching seed without approval                     | Verify only; edit seed only if required for docs               |

---

## Stop rule

Stop after task 01 validation passes. Do not start task 02 in the same PR unless explicitly requested.
