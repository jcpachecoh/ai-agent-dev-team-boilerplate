# Task: Implement the Run Report Page

**Domain:** `[FRONTEND]` `[BACKEND]`
**Assigned Agent:** frontend-developer
**Status:** `pending`
**Created:** 2026-05-19
**Depends On:** `tasks/testlab/05-run-execution.md`

---

## Context

`ReportsPage` (`/projects/:projectId/runs/:runId/report`) is currently a stub that only
displays the raw `projectId` and `runId` from the URL. This task replaces it with a real
report showing run metadata, execution progress, and a breakdown of test case results.

The backend summary endpoint (`GET .../runs/:runId/summary`) will be available after
`05-run-execution.md` is complete. The cases list endpoint (`GET .../runs/:runId/cases`)
is also needed for the detail table.

---

## Requirements

### Report layout

- [ ] **Header section** — run name, description, status badge, associated milestone (if any), creation date
- [ ] **Progress bar** — visual indicator of pass rate (passed / total executed, excluding UNTESTED)
- [ ] **Result summary cards** — individual count tiles for: PASS (green), FAIL (red), BLOCKED (yellow), RETEST (orange), SKIPPED (grey), UNTESTED (neutral)
- [ ] **Case results table** — columns: case title, suite name, priority, execution status, executed at (relative time)
  - Sortable by status and priority
  - Filterable by status (chip filters above table)
- [ ] **Empty state** — shown when no cases have been assigned to the run yet (with a link back to the run)

### Data fetching

- [ ] Uses `useQuery(['run', runId])` for run metadata
- [ ] Uses `useQuery(['run-summary', runId])` for aggregate counts
- [ ] Uses `useQuery(['run-cases', runId])` for the case result rows
- [ ] Loading skeletons shown while any query is pending
- [ ] Error state if any query fails

### Navigation

- [ ] "← Back to Runs" breadcrumb link
- [ ] Page title in `<head>` reflects run name (via `document.title`)

---

## Acceptance Criteria

- [ ] Navigating to `/projects/:projectId/runs/:runId/report` loads the report without errors
- [ ] Summary counts match the actual case statuses in the run
- [ ] Filter chips correctly narrow the case table
- [ ] TypeScript: `tsc --noEmit` on testlab passes
- [ ] Page renders correctly on mobile viewport (≥ 320px)

---

## Files to Create or Modify

- `apps/testlab/src/pages/Reports/ReportsPage.tsx` — replace stub with full implementation
- `apps/testlab/src/pages/Reports/ReportsPage.module.scss` — styles
- `apps/testlab/src/services/runs.service.ts` — add `getSummary(projectId, runId)` and `listCases(projectId, runId)` if not already added in task 05

---

## Notes

- The progress bar percentage should be: `(pass + fail + blocked + retest + skipped) / total * 100` — it shows execution completion, not pass rate alone.
- Pass rate (shown separately) = `pass / (total - untested) * 100`.
- Use CSS custom properties from `styles/abstracts/` for colors; do not hard-code hex values.
- The route `/projects/:projectId/runs/:runId/report` is already registered in `router.tsx` — no router changes needed.
