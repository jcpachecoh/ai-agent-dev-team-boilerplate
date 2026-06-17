# Task: Traceability — Link Test Cases to Requirements and Milestones

**Domain:** `[BACKEND]` `[FRONTEND]`
**Assigned Agent:** backend-developer, frontend-developer
**Status:** `pending`
**Created:** 2026-05-19
**Depends On:** `tasks/testlab/02-be-update-delete-endpoints.md`

---

## Context

Currently, test cases, requirements, and milestones are entirely independent in the data model.
A quality team needs to know which test cases cover a requirement and which milestone a suite
is targeting. This task introduces a lightweight traceability layer connecting these entities.

---

## Requirements

### Backend — Prisma schema

- [ ] Add `CaseRequirement` join table: `caseId`, `requirementId` (composite PK)
- [ ] Add `requirementLinks CaseRequirement[]` to `TestCase` model
- [ ] Add `caseLinks CaseRequirement[]` to `Requirement` model
- [ ] Add optional `milestoneId String?` to `TestRun` model (a run can target a milestone)
- [ ] Create migration: `add_traceability_links`

### Backend — New endpoints on cases module

- [ ] `POST /testlab/projects/:projectId/suites/:suiteId/cases/:caseId/requirements` — body: `{ requirementId: string }` — link a case to a requirement
- [ ] `DELETE /testlab/projects/:projectId/suites/:suiteId/cases/:caseId/requirements/:requirementId` — unlink
- [ ] `GET /testlab/projects/:projectId/requirements/:requirementId/cases` — list all test cases linked to a requirement

### Backend — New endpoint on runs module

- [ ] `PATCH /testlab/projects/:projectId/runs/:runId` — extend to accept `milestoneId` (already covered in `02-be-update-delete-endpoints.md`, just document here)

### Frontend

- [ ] **TestCasesPage** — each case card shows linked requirement badges (e.g. `REQ-42`)
- [ ] **TestCasesPage** — action to link/unlink a requirement from a case (combobox of project requirements)
- [ ] **RequirementsPage** — each requirement shows a count of linked test cases; clicking shows a modal with the list
- [ ] **RunsPage/RunDetailPage** — when creating or editing a run, allow selecting a milestone (optional)
- [ ] Add `cases.service.ts` methods: `linkRequirement(projectId, suiteId, caseId, requirementId)`, `unlinkRequirement(...)`,
- [ ] Add `requirements.service.ts` method: `getCases(projectId, requirementId)`

---

## Acceptance Criteria

- [ ] A test case can be linked to multiple requirements; a requirement can have multiple test cases
- [ ] Deleting a test case or requirement cascades to remove the join record (no orphaned links)
- [ ] `GET /requirements/:id/cases` returns the correct list after link/unlink operations
- [ ] `node scripts/validate-structure.js` exits 0
- [ ] All new endpoints have unit tests

---

## Files to Create or Modify

- `apps/api/prisma/schema.prisma` — add `CaseRequirement` model + `milestoneId` on `TestRun`
- `apps/api/prisma/migrations/` — migration `add_traceability_links`
- `apps/api/src/testlab/cases/interfaces/cases.interfaces.ts` — add link/unlink signatures
- `apps/api/src/testlab/cases/repository/cases.repository.ts`
- `apps/api/src/testlab/cases/service/cases.service.ts`
- `apps/api/src/testlab/cases/controller/cases.controller.ts`
- `apps/api/src/testlab/cases/controller/dto/link-requirement.dto.ts`
- `apps/api/src/testlab/cases/test/cases.service.spec.ts`
- `apps/api/src/testlab/cases/test/cases.controller.spec.ts`
- `apps/api/src/testlab/requirements/interfaces/requirements.interfaces.ts`
- `apps/api/src/testlab/requirements/repository/requirements.repository.ts`
- `apps/api/src/testlab/requirements/service/requirements.service.ts`
- `apps/api/src/testlab/requirements/controller/requirements.controller.ts`
- `apps/api/src/testlab/requirements/test/requirements.service.spec.ts`
- `apps/testlab/src/services/cases.service.ts`
- `apps/testlab/src/services/requirements.service.ts`
- `apps/testlab/src/pages/TestCases/TestCasesPage.tsx`
- `apps/testlab/src/pages/Requirements/RequirementsPage.tsx`
- `apps/testlab/src/pages/Runs/RunDetailPage.tsx`

---

## Notes

- Use `onDelete: Cascade` on the `CaseRequirement` foreign keys so deleting either side cleans up automatically.
- Keep the UI lightweight: requirement badges on case cards + a count badge on requirements are enough for V1.
