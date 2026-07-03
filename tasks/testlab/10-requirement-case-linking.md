# Task: Requirement ↔ Test Case Linking (Backend + Frontend)

**Domain:** `[SPEC] [BACKEND] [FRONTEND]`
**Assigned Agent:** Backend Agent, Frontend Agent
**Status:** `pending`
**Created:** 2025-07-14
**Depends On:** `tasks/testlab/06-traceability.md`

---

## Context

The Prisma schema already has a `RequirementCase` join model that links `Requirement` to `TestCase`.
The `GET /testlab/projects/:projectId/requirements/:id/cases` endpoint exists and works.

However, there are **no mutation endpoints** to link or unlink a test case from a requirement.
The frontend has no UI for viewing or managing these links either.

The user needs to be able to:

- Open a requirement detail view and see the test cases linked to it.
- Link one or more test cases to a requirement from that page.
- Unlink a test case from a requirement from that page.

### Existing State (schema — no changes needed)

```prisma
model RequirementCase {
  requirementId String
  caseId        String
  requirement   Requirement @relation(...)
  case          TestCase    @relation(...)
  @@id([requirementId, caseId])
  @@map("requirement_cases")
}
```

`TestCase.requirements RequirementCase[]` and `Requirement.cases RequirementCase[]` are both present.

### Existing Backend State

- `GET :id/cases` — exists in controller, service (`findCases`), and repository.
- `IRequirementsRepository` and `IRequirementsService` declare `findCases` only.
- No `linkCase` / `unlinkCase` anywhere in the requirements module.

---

## Spec

### Acceptance Criteria

- [ ] **No schema migration required** — `RequirementCase` join model already exists.
- [ ] `POST /testlab/projects/:projectId/requirements/:id/cases` — body `{ caseId: string }` —
      creates a `RequirementCase` link. Returns `201`. Returns `409` if already linked. Returns
      `404` if requirement or case not found in the project.
- [ ] `DELETE /testlab/projects/:projectId/requirements/:id/cases/:caseId` — deletes the link.
      Returns `204`. Returns `404` if the link does not exist.
- [ ] `validate-structure.js` produces 0 violations after all backend changes.
- [ ] New service methods (`linkCase`, `unlinkCase`) have unit tests in
      `test/requirements.service.spec.ts` covering happy path and error cases.
- [ ] On the Requirements page in the frontend, each requirement card/detail shows a list of
      directly linked test cases.
- [ ] A "Link Case" action on the requirement detail opens a modal with a searchable list of
      project test cases (excluding already-linked ones).
- [ ] Each linked case shows an "Unlink" button.
- [ ] After linking or unlinking, the linked-cases list refreshes automatically.

---

## Requirements

### Backend

- [ ] **Interfaces** (`interfaces/requirements.interfaces.ts`): Add to `IRequirementsRepository`
      and `IRequirementsService`:
  - `linkCase(requirementId: string, caseId: string): Promise<void>`
  - `unlinkCase(requirementId: string, caseId: string): Promise<void>`

- [ ] **Repository** (`repository/requirements.repository.ts`):
  - Implement `linkCase`: `prisma.requirementCase.create({ data: { requirementId, caseId } })`.
    Do **not** throw HTTP exceptions — let the service handle Prisma error codes.
  - Implement `unlinkCase`: `prisma.requirementCase.delete({ where: { requirementId_caseId: { requirementId, caseId } } })`.

- [ ] **Service** (`service/requirements.service.ts`):
  - Implement `linkCase(projectId, id, caseId)`:
    1. Call `findOne(projectId, id)` — throws `NotFoundException` if not found (already implemented).
    2. Call `repository.linkCase(id, caseId)`.
    3. Catch Prisma `P2002` (unique constraint) → throw `ConflictException('Case already linked')`.
    4. Catch Prisma `P2003` (foreign key) → throw `NotFoundException('Case not found')`.
  - Implement `unlinkCase(projectId, id, caseId)`:
    1. Call `findOne(projectId, id)`.
    2. Call `repository.unlinkCase(id, caseId)`.
    3. Catch Prisma `P2025` (record not found) → throw `NotFoundException('Link not found')`.

- [ ] **Controller** (`controller/requirements.controller.ts`):
  - `POST :id/cases` — `@HttpCode(HttpStatus.CREATED)` — body: `LinkCaseDto { caseId: string }`.
  - `DELETE :id/cases/:caseId` — `@HttpCode(HttpStatus.NO_CONTENT)`.
  - Add Swagger decorators on both endpoints.

- [ ] **DTO** (`controller/dto/link-case.dto.ts`): `LinkCaseDto { @IsUUID() caseId: string }`.
      (Same shape as the milestones `LinkCaseDto`; each module owns its copy.)

- [ ] **Tests** (`test/requirements.service.spec.ts`): unit tests for `linkCase` (happy path,
      requirement not found, case not found, already linked) and `unlinkCase` (happy path,
      link not found).

### Frontend (TestLab)

- [ ] **API service** (`apps/testlab/src/services/requirements.service.ts`):
  - Add `linkCase(projectId, requirementId, caseId): Promise<void>` — `POST` to
    `/testlab/projects/:projectId/requirements/:requirementId/cases`.
  - Add `unlinkCase(projectId, requirementId, caseId): Promise<void>` — `DELETE` to
    `/testlab/projects/:projectId/requirements/:requirementId/cases/:caseId`.
  - Add `listCases(projectId, requirementId): Promise<TestCase[]>` — `GET :id/cases`
    (wraps existing backend endpoint).

- [ ] **Requirements page / detail**: show a "Linked Cases" section. Display each case's title
      and priority badge. Include an "Unlink" button per case.

- [ ] **"Link Case" modal**: searchable picker of project test cases. Exclude already-linked cases.
      On confirm, call `linkCase` and close the modal.

- [ ] **TanStack Query hooks**:
  - `useRequirementCases(projectId, requirementId)` — wraps `listCases`.
  - `useLinkRequirementCase` mutation — invalidates `['requirements', projectId, requirementId, 'cases']`.
  - `useUnlinkRequirementCase` mutation — same invalidation.

---

## Files to Create or Modify

### Backend

| File                                                                      | Action                                           |
| ------------------------------------------------------------------------- | ------------------------------------------------ |
| `apps/api/src/testlab/requirements/interfaces/requirements.interfaces.ts` | Add `linkCase`, `unlinkCase` to both interfaces  |
| `apps/api/src/testlab/requirements/repository/requirements.repository.ts` | Implement `linkCase`, `unlinkCase`               |
| `apps/api/src/testlab/requirements/service/requirements.service.ts`       | Implement `linkCase`, `unlinkCase`               |
| `apps/api/src/testlab/requirements/controller/requirements.controller.ts` | Add `POST :id/cases`, `DELETE :id/cases/:caseId` |
| `apps/api/src/testlab/requirements/controller/dto/link-case.dto.ts`       | **Create** `LinkCaseDto`                         |
| `apps/api/src/testlab/requirements/test/requirements.service.spec.ts`     | Add unit tests for `linkCase`, `unlinkCase`      |

### Frontend

| File                                                                | Action                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `apps/testlab/src/services/requirements.service.ts`                 | Add `linkCase`, `unlinkCase`, `listCases`                         |
| `apps/testlab/src/pages/RequirementsPage.tsx` (or detail component) | Add linked-cases section + Unlink buttons                         |
| `apps/testlab/src/components/LinkCaseModal/`                        | **Create** (can reuse same component from task 09 if generalized) |
| `apps/testlab/src/hooks/useRequirementCaseLinks.ts`                 | **Create** TanStack Query hooks                                   |

---

## Notes

- No Prisma migration needed — `RequirementCase` model and join table already exist.
- The `link-case.dto.ts` in this module is independent of the one in `milestones/`. Keep them
  separate to avoid cross-module coupling. Consider extracting a shared DTO to `packages/types/`
  as a follow-up if more modules need the same pattern.
- `scripts/validate-structure.js` must report 0 violations after changes.
