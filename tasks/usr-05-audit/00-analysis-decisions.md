# USR-05 — Analysis and Decisions: Exhaustive Auditing

## Status

- **Ticket:** USR-05 — LoginAudit + AuditLog
- **Phase:** Planning / SDD
- **Strategy:** App-code auditing (Interceptors + Services)

## Context

The project requires a robust auditing system to track authentication attempts and business data changes. Currently, a minimal `AuditLog` table exists, but it lacks tenant context, formal user relations, and exhaustive coverage.

## Core Decisions

1. **New Table for Auth:** `LoginAudit` will be a dedicated table for authentication events (success, failures, locks, logouts).
2. **Evolution of AuditLog:** The existing `audit_logs` table will be evolved rather than replaced.
   - Rename/Add fields: `actorUserId` (FK to User), `tenantId`, `entityType`, `oldValue`, `newValue`.
   - Preserve `userId` (String?) as a legacy field for existing data.
3. **App-Code Preference:** Auditing will be implemented in the application layer (NestJS) rather than DB triggers. This allows for easier access to request context (IP, User Agent) and pre-persistence redaction.
4. **LoginAudit Nullability:** `LoginAudit.userId` is nullable to capture attempts for non-existent users. `identifier` will store the attempted email or cédula.
5. **Soft Delete Resilience:** Audit logs must survive User deletion. FKs will use `ON DELETE SET NULL`.
6. **Redaction Policy:** Mandatory redaction of sensitive fields before persisting logs.
   - **Blacklist:** `password`, `passwordHash`, `pin`, `pinHash`, `cedulaHash`, `refreshToken`, `accessToken`, `token`, `tokenHash`, `secret`.
   - **Pattern:** Any field ending in `Hash`, `Token`, or `Secret`.
7. **Immutability:** `createdAt` fields must remain immutable.

## Enums

### LoginStatus

- `SUCCESS`
- `FAILED`
- `LOCKED`
- `LOGOUT`

### AuthMethod

- `PASSWORD`
- `PIN`
- `REFRESH_TOKEN`
- `OAUTH_GOOGLE`

### AuditAction

- `CREATE`
- `UPDATE`
- `DELETE`
- `LOGIN`
- `LOGOUT`
- `VIEW`
- `EXPORT`
- `APPROVE`
- `REJECT`
- `ASSIGN`

## Stop Rule

Do not continue to schema implementation until this document is reviewed.
