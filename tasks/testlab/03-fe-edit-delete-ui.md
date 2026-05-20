# Task: Add Edit and Delete UI to All TestLab Frontend Pages

**Domain:** `[FRONTEND]`
**Assigned Agent:** frontend-developer
**Status:** `pending`
**Created:** 2026-05-19
**Depends On:** `tasks/testlab/02-be-update-delete-endpoints.md`

---

## Context

All TestLab frontend pages support creating records but provide no way to edit or delete them.
The backend update/delete endpoints will be available after `02-be-update-delete-endpoints.md`
is complete. This task adds the edit/delete surface to each page and extends every frontend
service with `update()` and `remove()` methods.

---

## Requirements

### Shared pattern (apply to all pages)

- [ ] Each resource card/row gets an action menu or icon buttons (edit ✏️ + delete 🗑️)
- [ ] Edit opens the existing `SimpleModal` pre-populated with current values
- [ ] Delete shows a confirmation dialog before calling the API
- [ ] After mutation, the TanStack Query cache is invalidated to refresh the list
- [ ] Errors from the API are shown in the UI (not swallowed)

### Frontend services — add to each

- [ ] `projects.service.ts` — add `update(id, payload)` → PATCH `/projects/:id`; `remove(id)` → DELETE `/projects/:id`
- [ ] `suites.service.ts` — add `update(projectId, suiteId, payload)` and `remove(projectId, suiteId)`
- [ ] `cases.service.ts` — add `update(projectId, suiteId, caseId, payload)` and `remove(projectId, suiteId, caseId)`
- [ ] `milestones.service.ts` — add `update(projectId, milestoneId, payload)` and `remove(projectId, milestoneId)`
- [ ] `requirements.service.ts` — add `update(projectId, requirementId, payload)` and `remove(projectId, requirementId)`
- [ ] `runs.service.ts` — add `update(projectId, runId, payload)` and `remove(projectId, runId)`

### Page-specific requirements

- [ ] **ProjectsPage** — edit modal fields: name, description (slug is read-only display)
- [ ] **SuitesPage** — edit modal fields: name, description
- [ ] **TestCasesPage** — edit modal fields: title, priority, type, preconditions, expectedResult
- [ ] **MilestonesPage** — edit modal fields: name, dueDate, description + "Mark as Complete" toggle
- [ ] **RequirementsPage** — edit modal fields: title, externalId, description
- [ ] **RunsPage** — edit modal fields: name, description, status (select: ACTIVE / COMPLETED / ARCHIVED)

---

## Acceptance Criteria

- [ ] All pages render without TypeScript errors (`tsc --noEmit` on testlab passes)
- [ ] Edit flow: clicking edit on a card opens a pre-filled modal; submitting calls PATCH and refreshes list
- [ ] Delete flow: clicking delete shows confirmation; confirming calls DELETE and removes item from list
- [ ] Delete confirmation prevents accidental deletion (no immediate action on first click)
- [ ] API error messages are displayed to the user
- [ ] `SimpleModal` component is reused for edit (no duplicate modal components)

---

## Files to Create or Modify

- `apps/testlab/src/services/projects.service.ts`
- `apps/testlab/src/services/suites.service.ts`
- `apps/testlab/src/services/cases.service.ts`
- `apps/testlab/src/services/milestones.service.ts`
- `apps/testlab/src/services/requirements.service.ts`
- `apps/testlab/src/services/runs.service.ts`
- `apps/testlab/src/pages/Projects/ProjectsPage.tsx`
- `apps/testlab/src/pages/Suites/SuitesPage.tsx`
- `apps/testlab/src/pages/TestCases/TestCasesPage.tsx`
- `apps/testlab/src/pages/Milestones/MilestonesPage.tsx`
- `apps/testlab/src/pages/Requirements/RequirementsPage.tsx`
- `apps/testlab/src/pages/Runs/RunsPage.tsx`
- `apps/testlab/src/components/SimpleModal/` — ensure it accepts initial values for edit mode

---

## Notes

- The `SimpleModal` component must accept an optional `initialValues` prop to support pre-filled edit forms.
- Use `useMutation` from TanStack Query for all mutations; call `queryClient.invalidateQueries` in `onSuccess`.
- Confirmation dialogs can use the browser native `window.confirm()` in a first iteration; a custom modal is a future improvement.
- The "Mark as Complete" toggle on MilestonesPage maps to `completed: true/false` on the PATCH body.
