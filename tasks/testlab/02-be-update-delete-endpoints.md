# Task: Add Update and Delete Endpoints to All TestLab Backend Modules

**Domain:** `[BACKEND]`
**Assigned Agent:** backend-developer
**Status:** `pending`
**Created:** 2026-05-19
**Depends On:** `tasks/testlab/04-fix-runs-project-association.md`

---

## Context

All six TestLab backend modules (projects, cases, milestones, requirements, runs, suites)
only implement `GET` and `POST` endpoints. Users cannot modify or remove any resource after
creation. Every module already follows the `interfaces → repository → service → controller → test`
structure, so additions must be threaded through all four layers.

Soft-delete is preferred over hard-delete to preserve audit history: add a `deletedAt DateTime?`
field to each affected Prisma model and filter `deletedAt: null` in all `findAll`/`findOne` queries.

---

## Requirements

### Projects

- [ ] `PATCH /testlab/projects/:id` — update `name`, `description`; slug is immutable after creation
- [ ] `DELETE /testlab/projects/:id` — soft-delete; cascade soft-deletes suites, cases, milestones, requirements, runs

### Suites

- [ ] `PATCH /testlab/projects/:projectId/suites/:id` — update `name`, `description`
- [ ] `DELETE /testlab/projects/:projectId/suites/:id` — soft-delete; cascade soft-deletes cases within the suite

### Cases

- [ ] `PATCH /testlab/projects/:projectId/suites/:suiteId/cases/:id` — update `title`, `priority`, `type`, `preconditions`, `expectedResult` (separate from the existing `PATCH .../status`)
- [ ] `DELETE /testlab/projects/:projectId/suites/:suiteId/cases/:id` — soft-delete

### Milestones

- [ ] `PATCH /testlab/projects/:projectId/milestones/:id` — update `name`, `dueDate`, `description`, `completed` (boolean)
- [ ] `DELETE /testlab/projects/:projectId/milestones/:id` — soft-delete

### Requirements

- [ ] `PATCH /testlab/projects/:projectId/requirements/:id` — update `title`, `externalId`, `description`
- [ ] `DELETE /testlab/projects/:projectId/requirements/:id` — soft-delete

### Runs

- [ ] `PATCH /testlab/projects/:projectId/runs/:id` — update `name`, `description`, `status`
- [ ] `DELETE /testlab/projects/:projectId/runs/:id` — soft-delete

### Cross-cutting

- [ ] Add `deletedAt DateTime?` to Prisma schema for all six models and generate a migration
- [ ] All `findAll` and `findOne` queries must filter `deletedAt: null`
- [ ] Interface definitions updated with `update()` and `remove()` on both Repository and Service
- [ ] DTOs created: `UpdateProjectDto`, `UpdateSuiteDto`, `UpdateCaseDto`, `UpdateMilestoneDto`, `UpdateRequirementDto`, `UpdateRunDto`
- [ ] All new endpoints decorated with `@ApiBearerAuth()`, `@ApiOperation()`, `@ApiResponse()`
- [ ] Unit tests added for each new method (service + controller spec)

---

## Acceptance Criteria

- [ ] `node scripts/validate-structure.js` exits 0
- [ ] `npx jest --coverage` passes with ≥ 80% branches across all modules
- [ ] `PATCH` returns the updated resource (200)
- [ ] `DELETE` returns 204 No Content; subsequent `GET` for the same id returns 404
- [ ] TypeScript: `pnpm --filter @restopsiq/api exec tsc --noEmit` exits 0

---

## Files to Create or Modify

### Prisma

- `apps/api/prisma/schema.prisma` — add `deletedAt DateTime?` to Project, Suite, TestCase, Milestone, Requirement, TestRun models
- `apps/api/prisma/migrations/` — new migration `add_soft_delete_to_testlab_models`

### Per module (repeat for projects, suites, cases, milestones, requirements, runs):

- `apps/api/src/testlab/{module}/interfaces/{module}.interfaces.ts` — add `update()` and `remove()` signatures
- `apps/api/src/testlab/{module}/repository/{module}.repository.ts` — implement `update()` and `remove()`
- `apps/api/src/testlab/{module}/service/{module}.service.ts` — implement `update()` and `remove()`
- `apps/api/src/testlab/{module}/controller/{module}.controller.ts` — add PATCH and DELETE routes
- `apps/api/src/testlab/{module}/controller/dto/update-{module}.dto.ts` — new DTO (PartialType of CreateDto)
- `apps/api/src/testlab/{module}/test/{module}.service.spec.ts` — add update/remove tests
- `apps/api/src/testlab/{module}/test/{module}.controller.spec.ts` — add update/delete tests

---

## Notes

- Use `PartialType(CreateXxxDto)` from `@nestjs/mapped-types` for all Update DTOs.
- The `slug` field on Project must be excluded from `UpdateProjectDto` (it is used as a URL key and must not change).
- For `Milestone`, `UpdateMilestoneDto` should add a `completed boolean` field not present in `CreateMilestoneDto`.
- `UpdateRunDto` should add a `status` enum field (`ACTIVE | COMPLETED | ARCHIVED`).
- Hard-delete can be considered for cases where the record is brand new (created within last 5 minutes and not referenced), but start with soft-delete for safety.
