# Task: MES Auth Login Auditing (COMPLETED)

## Scope

Integrate `LoginAudit` into the `MesAuthService` (cédula/PIN).

## Allowed Files

- `apps/api/src/mes/auth/service/mes-auth.service.ts`

## Forbidden Files

- `apps/api/src/auth/service/auth.service.ts`

## Acceptance Criteria

- `MesAuthService.login` logs `SUCCESS`, `FAILED`, or `LOCKED`.
- `MesAuthService.logout` logs `LOGOUT`.
- The `AuthMethod` is correctly set to `PIN`.
- The attempted cédula (masked or hashed if required by security) is stored in the `identifier` field.
- `ipAddress` and `userAgent` are correctly passed and stored.

## Validation Commands

- `npm run test apps/api/src/mes/auth/test/mes-auth.service.spec.ts`

## Risks

- Masking logic in `identifier` must be consistent with security requirements (USR-01/USR-02).

## Stop Rule

Do not update the CRUD interceptor yet.
