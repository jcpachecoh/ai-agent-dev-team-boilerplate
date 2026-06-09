# Task: AuditLog Schema Adjustment (COMPLETED)

## Scope

Adjust the existing `AuditLog` model to support multi-tenancy, formal actor relations, and snapshots.

## Allowed Files

- `apps/api/prisma/schema.prisma`

## Forbidden Files

- Any file in `apps/api/src/`

## Acceptance Criteria

- `AuditLog` (mapped to `audit_logs`) updated:
  - Add `tenantId` (String).
  - Add `actorUserId` (String?, FK -> User nullable).
  - Rename `entity` to `entityType` (or map it).
  - Add `oldValue` (Json?).
  - Add `newValue` (Json?).
  - Change `action` from `String` to `AuditAction` enum.
  - Keep `userId` as a legacy field (String?, no relation).
  - Keep `payload` for backward compatibility temporarily.
- Enum `AuditAction` defined.
- Indexes on `tenantId`, `actorUserId`, `entityType`, `entityId`, `action`, `createdAt`.
- Relation `User.auditLogs` added.
- `onDelete: SetNull` applied to the `actorUserId` relation.

## Validation Commands

- `npx prisma validate` (run in `apps/api`)

## Risks

- Changing `action` to an enum might cause issues with existing string data during migration (handled in T3).

## Stop Rule

Do not continue to migration task.
