# Task: Audit Migration and Backfill (COMPLETED)

## Scope

Generate and execute the DB migration for the new audit schema and backfill legacy records.

## Scope Details

- Generate the migration.
- Customize the migration SQL if necessary to handle `action` enum conversion and `tenantId` defaults.
- Backfill `tenantId` for existing `audit_logs`.

## Allowed Files

- `apps/api/prisma/migrations/**/*`

## Forbidden Files

- `apps/api/src/**/*` (except for scripts if needed)

## Acceptance Criteria

- Migration `usr_05_exhaustive_auditing` created.
- Existing `audit_logs` records have a valid `tenantId` (e.g., 'LEGACY' or 'SYSTEM').
- Existing `action` strings correctly mapped to new `AuditAction` enum values.
- Database schema matches the new `prisma.schema`.

## Validation Commands

- `npx prisma migrate dev --name usr_05_exhaustive_auditing`
- `npx prisma migrate status`

## Risks

- Enum conversion failure if existing data contains values not in the new `AuditAction` enum.
- Data loss if not handled carefully.

## Stop Rule

Do not modify application code yet.
