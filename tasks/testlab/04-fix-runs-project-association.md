# Task: Fix Runs — Project Association Bug

**Domain:** `[BACKEND]`
**Assigned Agent:** backend-developer
**Status:** `pending`
**Created:** 2026-05-19
**Depends On:** none

---

## Context

The runs module has a data integrity bug: `RunsService.create()` validates that the target
project exists (throws `NotFoundException` if not found) but never passes `projectId` to the
repository. The repository's `findAll()` queries test runs via `plan: { projectId }` — a
relation that will never match because created runs have no `planId` set.

The result is that a user can create runs, but listing runs always returns an empty array.

### Root cause (current code in `runs.service.ts`):

```typescript
async create(projectId: string, dto: CreateRunDto): Promise<TestRun> {
  await this.runsRepository.findProjectById(projectId); // throws if not found ✓
  const systemUser = await this.runsRepository.findOrCreateSystemUser();
  return this.runsRepository.create({
    name: dto.name,
    description: dto.description,
    createdById: systemUser.id,
    // ❌ projectId is never passed here
  });
}
```

### Root cause (current code in `runs.repository.ts`):

```typescript
async findAll(projectId: string): Promise<TestRun[]> {
  return this.prisma.testRun.findMany({
    where: { plan: { projectId } }, // ❌ relies on plan relation, not direct projectId
  });
}
```

---

## Requirements

- [ ] Review `apps/api/prisma/schema.prisma` — determine whether `TestRun` has a direct `projectId` field or only a `planId` relation
- [ ] If `TestRun` has no direct `projectId`:
  - Add `projectId String` and `project Project @relation(...)` directly to `TestRun` model
  - Create a Prisma migration: `add_project_id_to_test_run`
- [ ] Update `CreateRunData` interface in `runs.interfaces.ts` to include `projectId: string`
- [ ] Update `IRunsRepository.findAll()` to filter by `projectId` directly on the model
- [ ] Update `IRunsRepository.create()` to accept and persist `projectId`
- [ ] Update `RunsRepository` implementation accordingly
- [ ] Update `RunsService.create()` to pass `projectId` from the route param to the repository
- [ ] Update `test/runs.service.spec.ts` and `test/runs.repository.spec.ts` to reflect the fix
- [ ] Verify that `GET /testlab/projects/:projectId/runs` returns runs created under that project

---

## Acceptance Criteria

- [ ] `POST /testlab/projects/:projectId/runs` followed by `GET /testlab/projects/:projectId/runs` returns the created run in the list
- [ ] Runs created under project A do not appear when listing runs for project B
- [ ] `npx jest --testPathPattern="src/testlab/runs"` passes with 0 failures
- [ ] `node scripts/validate-structure.js` exits 0
- [ ] `pnpm --filter @restopsiq/api exec tsc --noEmit` exits 0

---

## Files to Create or Modify

- `apps/api/prisma/schema.prisma` — add `projectId` to `TestRun` model if not present
- `apps/api/prisma/migrations/` — new migration
- `apps/api/src/testlab/runs/interfaces/runs.interfaces.ts` — update `CreateRunData`
- `apps/api/src/testlab/runs/repository/runs.repository.ts` — fix `findAll` + `create`
- `apps/api/src/testlab/runs/service/runs.service.ts` — pass `projectId` in `create()`
- `apps/api/src/testlab/runs/test/runs.service.spec.ts` — update test fixtures
- `apps/api/src/testlab/runs/test/runs.repository.spec.ts` — update test fixtures

---

## Notes

- Check the existing Prisma migration SQL files under `apps/api/prisma/migrations/` before adding new fields to understand the current schema state.
- If `TestRun` already has a `projectId` column in the database but it's not exposed in the Prisma model, regenerating the client after editing the schema will be enough.
- This fix is a prerequisite for the run execution task (`05-run-execution.md`) and the reports page task (`07-reports-page.md`).
