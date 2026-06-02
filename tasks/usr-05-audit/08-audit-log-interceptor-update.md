# Task: AuditLog Interceptor Update (COMPLETED)

## Scope

Update the `AuditInterceptor` to utilize the new `AuditLog` structure.

## Allowed Files

- `apps/api/src/audit/audit.interceptor.ts`

## Forbidden Files

- `apps/api/src/audit/service/audit.service.ts` (should already be updated)

## Acceptance Criteria

- `AuditInterceptor` extracts `tenantId` from request headers (`x-tenant-id`).
- `AuditInterceptor` extracts `actorUserId` from the JWT payload (`req.user.sub`).
- `AuditInterceptor` maps HTTP methods to the new `AuditAction` enum.
- `AuditInterceptor` populates the `newValue` field with `req.body` (after redaction via service).
- `AuditInterceptor` correctly identifies the `entityType` from the URL.

## Validation Commands

- `npm run test apps/api/src/audit/test/audit.interceptor.spec.ts`

## Risks

- `tenantId` might be missing in some requests (ensure fallback or handle gracefully).
- `actorUserId` might be missing for public endpoints (ensure nullability is handled).

## Stop Rule

Do not implement snapshots yet.
