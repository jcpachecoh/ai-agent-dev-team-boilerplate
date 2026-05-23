# Task: Milestone ↔ Test Case Linking (Backend + Frontend)

**Domain:** `[SPEC] [BACKEND] [FRONTEND]`
**Assigned Agent:** Backend Agent, Frontend Agent
**Status:** `pending`
**Created:** 2025-07-14
**Depends On:** `tasks/testlab/06-traceability.md`

---

## Context

Milestones currently have no direct relationship to individual test cases. The existing `GET :id/cases`
endpoint on the milestones module resolves cases **indirectly** — it queries test cases whose suites
are linked to a test plan that references the milestone. This gives a read-only derived view but
does not allow a user to explicitly link or unlink a test case to a milestone.

The user needs to be able to:

- Open a milestone detail view and see the test cases directly linked to it.
- Link one or more test cases to a milestone from that page.
- Unlink a test case from a milestone from that page.

### Schema Gap

There is no `CaseMilestone` join model in `apps/api/prisma/schema.prisma`. `milestoneId` exists
only on `TestPlan`, not on `TestCase`. A new explicit join table is required.

### Existing State

- `GET /testlab/projects/:projectId/milestones/:id/cases` — exists, returns cases via plan chain.
- `IMilestonesRepository.findCases` and `IMilestonesService.findCases` — already declared.
- `MilestonesRepository.findCases` — implemented via plan relation chain.
- No `linkCase` / `unlinkCase` methods exist anywhere in the milestones module.

---

## Spec

### Acceptance Criteria

- [ ] A `CaseMilestone` join model exists in the Prisma schema with `milestoneId` (FK → `Milestone`)
      and `caseId` (FK → `TestCase`), composite PK `[milestoneId, caseId]`, cascade deletes.
- [ ] `GET /testlab/projects/:projectId/milestones/:id/cases` returns test cases that are **directly
      linked** via the new `CaseMilestone` join table (replaces the plan-chain query).
- [ ] `POST /testlab/projects/:projectId/milestones/:id/cases` — body `{ caseId: string }` — creates
      a link. Returns `201`. Returns `409` if the link already exists. Returns `404` if milestone or
      case does not belong to the project.
- [ ] `DELETE /testlab/projects/:projectId/milestones/:id/cases/:caseId` — removes the link. Returns
      `204`. Returns `404` if the link does not exist.
- [ ] `validate-structure.js` produces 0 violations after all backend changes.
- [ ] All new repository methods have corresponding **integration test stubs** in
      `test/milestones.repository.spec.ts`.
- [ ] All new service methods have corresponding **unit tests** in `test/milestones.service.spec.ts`.
- [ ] On the Milestones page in the frontend, each milestone card/detail shows a list of directly
      linked test cases.
- [ ] A "Link Case" action on the milestone detail opens a modal with a searchable list of test cases
      in the project (cases not yet linked to this milestone).
- [ ] Each linked case shows an "Unlink" button that removes the link via `DELETE`.
- [ ] After linking or unlinking, the linked-cases list refreshes automatically (optimistic update or
      refetch).

---

## Requirements

### Backend

- [ ] **Schema**: Add `CaseMilestone` model to `apps/api/prisma/schema.prisma`:

  ```prisma
  model CaseMilestone {
    milestoneId String
    caseId      String
    milestone   Milestone @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
    case        TestCase  @relation(fields: [caseId], references: [id], onDelete: Cascade)
    @@id([milestoneId, caseId])
    @@map("case_milestones")
  }
  ```

  Add the back-relation on `Milestone` and `TestCase` models.

- [ ] **Migration**: Run `prisma migrate dev --name add-case-milestone-join-table` and commit the
      generated migration file.

- [ ] **Interfaces** (`interfaces/milestones.interfaces.ts`): Add to `IMilestonesRepository` and
      `IMilestonesService`:
  - `linkCase(milestoneId: string, caseId: string): Promise<void>`
  - `unlinkCase(milestoneId: string, caseId: string): Promise<void>`

- [ ] **Repository** (`repository/milestones.repository.ts`):
  - Update `findCases` to query via `caseMilestones` join table instead of plan chain.
  - Implement `linkCase`: `prisma.caseMilestone.create(...)` — wrap in try/catch to surface
    `P2002` (unique constraint) as a `ConflictException` in the **service layer** (not here).
  - Implement `unlinkCase`: `prisma.caseMilestone.delete(...)` — surface `P2025` (not found) in
    service layer.

- [ ] **Service** (`service/milestones.service.ts`):
  - Implement `linkCase(projectId, id, caseId)`: call `findOne` to verify milestone exists, then
    call `repository.linkCase`. Catch `P2002` → `ConflictException`. Catch `P2025` → `NotFoundException`.
  - Implement `unlinkCase(projectId, id, caseId)`: call `findOne`, then `repository.unlinkCase`.

- [ ] **Controller** (`controller/milestones.controller.ts`):
  - `POST :id/cases` — `@HttpCode(HttpStatus.CREATED)` — body: `LinkCaseDto { caseId: string }`.
  - `DELETE :id/cases/:caseId` — `@HttpCode(HttpStatus.NO_CONTENT)`.
  - Add Swagger decorators: `@ApiOperation`, `@ApiParam`, `@ApiResponse`.

- [ ] **DTO** (`controller/dto/link-case.dto.ts`): `LinkCaseDto { @IsUUID() caseId: string }`.

- [ ] **Tests** (`test/milestones.service.spec.ts`): unit tests for `linkCase` (happy path, milestone
      not found, already linked) and `unlinkCase` (happy path, link not found).

### Frontend (TestLab)

- [ ] **API service** (`apps/testlab/src/services/milestones.service.ts`):
  - Add `linkCase(projectId, milestoneId, caseId): Promise<void>` — `POST` to `/testlab/projects/:projectId/milestones/:milestoneId/cases`.
  - Add `unlinkCase(projectId, milestoneId, caseId): Promise<void>` — `DELETE`.

- [ ] **Milestones page / detail**: show a "Linked Cases" section. Each linked case displays its
      title and a priority badge plus an "Unlink" button.

- [ ] **"Link Case" modal**: searchable picker of all project test cases (fetched via the cases
      service). Already-linked cases are excluded or greyed out.

- [ ] **TanStack Query mutations**: `useLinkMilestoneCase` and `useUnlinkMilestoneCase` hooks that
      invalidate `['milestones', projectId, milestoneId, 'cases']` on success.

---

## Files to Create or Modify

### Backend

| File                                                                                 | Action                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `apps/api/prisma/schema.prisma`                                                      | Add `CaseMilestone` model + back-relations       |
| `apps/api/prisma/migrations/<timestamp>_add_case_milestone_join_table/migration.sql` | Auto-generated by prisma migrate                 |
| `apps/api/src/testlab/milestones/interfaces/milestones.interfaces.ts`                | Add `linkCase`, `unlinkCase` to both interfaces  |
| `apps/api/src/testlab/milestones/repository/milestones.repository.ts`                | Update `findCases`; add `linkCase`, `unlinkCase` |
| `apps/api/src/testlab/milestones/service/milestones.service.ts`                      | Add `linkCase`, `unlinkCase`                     |
| `apps/api/src/testlab/milestones/controller/milestones.controller.ts`                | Add `POST :id/cases`, `DELETE :id/cases/:caseId` |
| `apps/api/src/testlab/milestones/controller/dto/link-case.dto.ts`                    | **Create** `LinkCaseDto`                         |
| `apps/api/src/testlab/milestones/test/milestones.service.spec.ts`                    | Add unit tests for `linkCase`, `unlinkCase`      |

### Frontend

| File                                                              | Action                                    |
| ----------------------------------------------------------------- | ----------------------------------------- |
| `apps/testlab/src/services/milestones.service.ts`                 | Add `linkCase`, `unlinkCase`              |
| `apps/testlab/src/pages/MilestonesPage.tsx` (or detail component) | Add linked-cases section + Unlink buttons |
| `apps/testlab/src/components/LinkCaseModal/`                      | **Create** modal component                |
| `apps/testlab/src/hooks/useMilestoneCaseLinks.ts`                 | **Create** TanStack Query hooks           |

---

## Notes

- Repository methods should not throw HTTP exceptions — that belongs in the service.
- The old plan-chain `findCases` query is replaced by the direct join table approach. If the
  plan-chain behavior is still needed elsewhere, consider renaming it `findCasesViaPlan` and
  keeping it alongside.
- `scripts/validate-structure.js` must report 0 violations after changes.
