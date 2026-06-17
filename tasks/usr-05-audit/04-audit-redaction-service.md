# Task: Audit Redaction Service (COMPLETED)

## Scope

Implement sensitive data redaction logic in the `AuditService`.

## Allowed Files

- `apps/api/src/audit/service/audit.service.ts`
- `apps/api/src/audit/interfaces/audit.interfaces.ts`

## Forbidden Files

- Auth services or controllers.

## Acceptance Criteria

- `AuditService` has a private `redact` method.
- `redact` recursively removes or masks fields in JSON objects.
- Blacklisted fields: `password`, `passwordHash`, `pin`, `pinHash`, `cedulaHash`, `refreshToken`, `accessToken`, `token`, `tokenHash`, `secret`.
- Pattern matching: fields ending in `Hash`, `Token`, `Secret` are redacted.
- All `log` methods in `AuditService` automatically call `redact` before repository calls.
- Unit tests verify redaction of nested fields.

## Validation Commands

- `npm run test apps/api/src/audit/test/audit.service.spec.ts`

## Risks

- Performance overhead of recursive redaction on large JSON objects.
- Missing a sensitive field variant.

## Stop Rule

Do not implement LoginAudit yet.
