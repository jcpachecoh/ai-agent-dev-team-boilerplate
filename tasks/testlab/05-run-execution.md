# Task: Run Execution — Assign Test Cases and Track Results

**Domain:** `[BACKEND]` `[FRONTEND]`
**Assigned Agent:** backend-developer, frontend-developer
**Status:** `pending`
**Created:** 2026-05-19
**Depends On:** `tasks/testlab/04-fix-runs-project-association.md`, `tasks/testlab/02-be-update-delete-endpoints.md`

---

## Context

A test run is only useful when test cases are assigned to it and their execution results are
recorded. Currently, runs are shell objects with a name and description only. This task adds:

1. The ability to add/remove test cases from a run
2. Per-run execution results (a `RunResult` join record: run ↔ case + result status)
3. A run progress summary (total, pass, fail, blocked, etc.)

---

## Requirements

### Backend — Prisma schema

- [ ] Add `RunResult` model: `id`, `runId`, `testCaseId`, `status` (enum: `UNTESTED | PASS | FAIL | BLOCKED | RETEST | SKIPPED`), `comment String?`, `executedAt DateTime?`, `executedById String?`, `createdAt`
- [ ] `TestRun` gets a `results RunResult[]` relation
- [ ] `TestCase` gets a `runResults RunResult[]` relation
- [ ] Create migration: `add_run_results`

### Backend — New endpoints on runs module

- [ ] `POST /testlab/projects/:projectId/runs/:runId/cases` — body: `{ caseIds: string[] }` — bulk-assign test cases to the run (creates `RunResult` rows with status `UNTESTED`)
- [ ] `DELETE /testlab/projects/:projectId/runs/:runId/cases/:caseId` — remove a test case from the run
- [ ] `GET /testlab/projects/:projectId/runs/:runId/cases` — list all cases in the run with their current result status
- [ ] `PATCH /testlab/projects/:projectId/runs/:runId/cases/:caseId/status` — update the result status for a case in a run
- [ ] `GET /testlab/projects/:projectId/runs/:runId/summary` — return aggregate counts: `{ total, pass, fail, blocked, retest, skipped, untested }`

### Frontend — RunsPage additions

- [ ] Each run card gets a "View Run" button linking to a detail page
- [ ] Add `RunDetailPage` at `/projects/:projectId/runs/:runId` showing:
  - Run name, description, status
  - List of assigned test cases with their current execution status
  - Controls to update individual case statuses (same status dropdown as TestCasesPage)
  - "Add Cases" button opening a modal to pick cases from the project's suites
- [ ] `runs.service.ts` — add `addCases(projectId, runId, caseIds)`, `removeCase(projectId, runId, caseId)`, `listCases(projectId, runId)`, `updateCaseStatus(projectId, runId, caseId, status)`, `getSummary(projectId, runId)`

---

## Acceptance Criteria

- [ ] Can assign test cases to a run and see them listed under the run
- [ ] Updating a case status in the run does not affect the original test case status
- [ ] `GET .../summary` returns correct counts that update after status changes
- [ ] `node scripts/validate-structure.js` exits 0
- [ ] `npx jest --testPathPattern="src/testlab/runs"` passes

---

## Files to Create or Modify

- `apps/api/prisma/schema.prisma` — add `RunResult` model
- `apps/api/prisma/migrations/` — migration `add_run_results`
- `apps/api/src/testlab/runs/interfaces/runs.interfaces.ts` — new method signatures
- `apps/api/src/testlab/runs/repository/runs.repository.ts` — implement new data access methods
- `apps/api/src/testlab/runs/service/runs.service.ts` — implement business logic
- `apps/api/src/testlab/runs/controller/runs.controller.ts` — add new routes
- `apps/api/src/testlab/runs/controller/dto/add-cases.dto.ts` — `{ caseIds: string[] }`
- `apps/api/src/testlab/runs/controller/dto/update-run-case-status.dto.ts`
- `apps/api/src/testlab/runs/test/runs.service.spec.ts` — add tests
- `apps/api/src/testlab/runs/test/runs.controller.spec.ts` — add tests
- `apps/testlab/src/services/runs.service.ts` — add new methods
- `apps/testlab/src/pages/Runs/RunDetailPage.tsx` — new page
- `apps/testlab/src/router.tsx` — register `/projects/:projectId/runs/:runId` route

---

## Notes

- `RunResult` status is independent from `TestCase` status — execution in a run is ephemeral and does not retroactively change the baseline case status.
- The "Add Cases" modal should allow the user to select from suites/cases already in the project.
- The `summary` endpoint can be computed from a `groupBy` Prisma query on `RunResult.status`.
