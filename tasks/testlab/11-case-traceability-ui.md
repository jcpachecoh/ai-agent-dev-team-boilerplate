# Task: Test Case Traceability UI (Link Cases to Milestones & Requirements)

**Domain:** `[SPEC] [FRONTEND]`
**Assigned Agent:** Frontend Agent
**Status:** `pending`
**Created:** 2025-07-14
**Depends On:**

- `tasks/testlab/09-milestone-case-linking.md` — provides `POST/DELETE /milestones/:id/cases` endpoints
- `tasks/testlab/10-requirement-case-linking.md` — provides `POST/DELETE /requirements/:id/cases` endpoints

---

## Context

Once tasks 09 and 10 are complete, the backend will support bidirectional linking between test
cases and milestones/requirements. This task adds the **Test Cases page UI** for that traceability.

Currently, `TestCasesPage.tsx` shows a list of test cases for a suite and allows creating new
cases. There is no way to:

- See which milestones a test case is linked to.
- See which requirements a test case is linked to.
- Link a test case to a milestone or requirement from this page.
- Unlink a test case from a milestone or requirement.

### User Story

> "As a QA engineer, from the Test Cases page inside a suite, I want to see which milestones and
> requirements each test case is linked to, and be able to link or unlink them directly."

### Constraint

The backend endpoints are defined in tasks 09 and 10. This task consumes those endpoints.
No backend changes are required here.

---

## Spec

### Acceptance Criteria

- [ ] Each test case row/card in `TestCasesPage` shows a **Milestones** badge area and a
      **Requirements** badge area listing the linked items (by name/title).
- [ ] If a test case has no linked milestones, the badge area shows "No milestones" (or is empty).
- [ ] If a test case has no linked requirements, the badge area shows "No requirements" (or is empty).
- [ ] A "Link to Milestone" action per test case opens a picker modal listing project milestones
      that are not yet linked to that case. Selecting one creates the link.
- [ ] A "Link to Requirement" action per test case opens a picker modal listing project requirements
      not yet linked to that case. Selecting one creates the link.
- [ ] Each linked milestone badge shows a remove (×) button that unlinks the milestone from the case.
- [ ] Each linked requirement badge shows a remove (×) button that unlinks the requirement from the case.
- [ ] After any link/unlink action, the case's badge areas refresh automatically (query invalidation
      or optimistic update).
- [ ] All loading and error states are handled gracefully (spinner during fetch, toast or inline error
      on failure).
- [ ] The page does not regress on any existing functionality (create case, update status, etc.).

---

## Requirements

### Data Fetching — per test case

Each `TestCase` item needs its linked milestones and requirements. The API shapes are:

```
GET /testlab/projects/:projectId/milestones/:milestoneId/cases
  → returns TestCase[]  (milestone owns a case list, not the other way around)
```

Because the backend exposes the relation from the milestone/requirement side (not from the case
side), the frontend has two options:

**Option A (Recommended — add a case-centric endpoint in task 09/10):**
Add a `GET /testlab/projects/:projectId/suites/:suiteId/cases/:caseId/milestones` and
`/requirements` endpoint that returns the milestones/requirements linked to a specific case.
This avoids N+1 queries on the frontend.

**Option B (Acceptable for first iteration):**
Fetch all milestones for the project (already available), then for each milestone fetch its
case list and aggregate on the client. This is N+1 but workable with a small dataset and
React Query caching.

> **Choose Option A** and add it to the scope of tasks 09 and 10 as an addendum, or implement
> Option B first and refactor later.

### New service methods

- [ ] `casesService.listMilestones(projectId, suiteId, caseId): Promise<Milestone[]>`
  - Calls `GET /testlab/projects/:projectId/milestones` then filters client-side (Option B),
    **OR** calls a new `GET .../cases/:caseId/milestones` endpoint (Option A).
- [ ] `casesService.linkMilestone(projectId, milestoneId, caseId): Promise<void>`
  - Calls `POST /testlab/projects/:projectId/milestones/:milestoneId/cases` with `{ caseId }`.
- [ ] `casesService.unlinkMilestone(projectId, milestoneId, caseId): Promise<void>`
  - Calls `DELETE /testlab/projects/:projectId/milestones/:milestoneId/cases/:caseId`.
- [ ] `casesService.listRequirements(projectId, suiteId, caseId): Promise<Requirement[]>`
  - Same pattern as milestones above.
- [ ] `casesService.linkRequirement(projectId, requirementId, caseId): Promise<void>`
  - Calls `POST /testlab/projects/:projectId/requirements/:requirementId/cases` with `{ caseId }`.
- [ ] `casesService.unlinkRequirement(projectId, requirementId, caseId): Promise<void>`
  - Calls `DELETE /testlab/projects/:projectId/requirements/:requirementId/cases/:caseId`.

### TanStack Query hooks

- [ ] `useCaseMilestones(projectId, suiteId, caseId)` — query key:
      `['cases', projectId, suiteId, caseId, 'milestones']`.
- [ ] `useLinkCaseMilestone(projectId, suiteId)` — mutation, invalidates the above.
- [ ] `useUnlinkCaseMilestone(projectId, suiteId)` — mutation, invalidates the above.
- [ ] `useCaseRequirements(projectId, suiteId, caseId)` — query key:
      `['cases', projectId, suiteId, caseId, 'requirements']`.
- [ ] `useLinkCaseRequirement(projectId, suiteId)` — mutation, invalidates the above.
- [ ] `useUnlinkCaseRequirement(projectId, suiteId)` — mutation, invalidates the above.

### UI Components

- [ ] **`CaseTraceabilityBadges`** component: renders the milestone badges and requirement badges
      for a single test case. Props: `{ projectId, suiteId, caseId }`.
  - Shows `Milestone` pill badges (name) with × button.
  - Shows `Requirement` pill badges (externalId or title) with × button.
  - Shows "Link Milestone" and "Link Requirement" icon-buttons.

- [ ] **`LinkItemModal`** (generic picker modal or separate `LinkMilestoneModal` /
      `LinkRequirementModal` if simpler): shows a searchable list of project items not yet linked
      to the case. On item selection, fires the mutation and closes.

- [ ] **`TestCasesPage`** update: embed `<CaseTraceabilityBadges>` inside each case row/card.

### CSS / Styling Rules

- Styles in `CaseTraceabilityBadges.module.scss` (SCSS module, no inline styles for static values).
- No hard-coded hex colors — use variables from `styles/abstracts/`.
- Nesting depth ≤ 3 levels.
- No `!important`.

---

## Files to Create or Modify

| File                                                                                    | Action                                                                                                               |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `apps/testlab/src/services/cases.service.ts`                                            | Add `listMilestones`, `linkMilestone`, `unlinkMilestone`, `listRequirements`, `linkRequirement`, `unlinkRequirement` |
| `apps/testlab/src/hooks/useCaseTraceability.ts`                                         | **Create** — all 6 TanStack Query hooks                                                                              |
| `apps/testlab/src/components/CaseTraceabilityBadges/index.ts`                           | **Create** — barrel export                                                                                           |
| `apps/testlab/src/components/CaseTraceabilityBadges/CaseTraceabilityBadges.tsx`         | **Create** — badge display + unlink buttons                                                                          |
| `apps/testlab/src/components/CaseTraceabilityBadges/CaseTraceabilityBadges.module.scss` | **Create** — scoped styles                                                                                           |
| `apps/testlab/src/components/LinkItemModal/index.ts`                                    | **Create** — barrel export                                                                                           |
| `apps/testlab/src/components/LinkItemModal/LinkItemModal.tsx`                           | **Create** — generic item picker modal                                                                               |
| `apps/testlab/src/components/LinkItemModal/LinkItemModal.module.scss`                   | **Create** — scoped styles                                                                                           |
| `apps/testlab/src/pages/TestCases/TestCasesPage.tsx`                                    | Embed `<CaseTraceabilityBadges>` in each case row                                                                    |

---

## Notes

- This task is **frontend-only**. All backend endpoint work is defined in tasks 09 and 10.
- If Option A (case-centric GET endpoints) is not yet implemented by the time this task starts,
  implement Option B first using existing milestone/requirement list endpoints + client-side filtering.
  Document the decision in `memory/decisions.md`.
- The `LinkItemModal` can be shared between milestones and requirements — pass an `items` array
  and a label prop to keep it generic.
- Do not add `!important`, ID selectors, or `@import` in any SCSS file (see
  `.github/copilot-instructions.md` §5).
