# Task: Email Auth Login Auditing (COMPLETED)

## Scope

Integrate `LoginAudit` into the global `AuthService` (email/password).

## Allowed Files

- `apps/api/src/auth/service/auth.service.ts`

## Forbidden Files

- `apps/api/src/mes/auth/**/*`

## Acceptance Criteria

- `AuthService.login` logs `SUCCESS` on successful auth.
- `AuthService.login` logs `FAILED` on invalid credentials or non-existent user.
- `AuthService.login` logs `LOCKED` if the account is currently locked.
- `AuthService.refresh` logs `SUCCESS` or `FAILED` for refresh token attempts.
- `AuthService.logout` logs `LOGOUT`.
- The `AuthMethod` is correctly set to `PASSWORD` or `REFRESH_TOKEN`.
- The attempted email is stored in the `identifier` field.

## Validation Commands

- `npm run test apps/api/src/auth/test/auth.service.spec.ts`

## Risks

- Forgetting to log failure cases that throw exceptions (use try-catch or ensure logging happens before throw).
- Privacy: ensure raw passwords are NOT stored in any field of `LoginAudit`.

## Stop Rule

Do not implement MES auth auditing yet.
