# Task: Business Snapshot Pilot (COMPLETED)

## Scope

Implement manual `oldValue/newValue` snapshotting in a critical service to validate the auditing pattern.

## Allowed Files

- `apps/api/src/suppliers/service/suppliers.service.ts` (or similar CRUD service)

## Forbidden Files

- Audit internal implementation files.

## Acceptance Criteria

- In an `update` method, the service retrieves the `oldValue` before applying changes.
- After successful update, it calls `auditService.logChange` with both `oldValue` and `newValue`.
- This ensures that fields not present in the request body (but changed in the DB) are captured.
- Redaction is applied to both snapshots.

## Validation Commands

- Manual verification of DB records after an update operation.

## Risks

- Performance: double read (one for current state, one for update) might be slow for bulk operations.

## Stop Rule

Do not apply to all services yet.
