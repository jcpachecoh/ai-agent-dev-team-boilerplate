# Task: LoginAudit Schema Definition (COMPLETED)

## Scope

Define the `LoginAudit` model and its associated enums in the Prisma schema.

## Allowed Files

- `apps/api/prisma/schema.prisma`

## Forbidden Files

- Any file in `apps/api/src/`
- Any migration file (handled in a later task)

## Acceptance Criteria

- `LoginAudit` model added with fields:
  - `id` (cuid)
  - `tenantId` (String)
  - `userId` (String?, FK -> User nullable)
  - `identifier` (String) - attempted login identifier
  - `authMethod` (Enum: AuthMethod)
  - `status` (Enum: LoginStatus)
  - `failureReason` (String?)
  - `ipAddress` (String?)
  - `userAgent` (String?)
  - `deviceInfo` (Json?)
  - `createdAt` (DateTime, default now)
- Enums `AuthMethod` and `LoginStatus` defined.
- Indexes on `tenantId`, `userId`, `status`, `createdAt`.
- Relation `User.loginAudits` added.
- `onDelete: SetNull` applied to the `userId` relation.

## Validation Commands

- `npx prisma validate` (run in `apps/api`)

## Risks

- Incorrect relation syntax might break Prisma client generation.

## Stop Rule

Do not create migrations or generate the client yet.
