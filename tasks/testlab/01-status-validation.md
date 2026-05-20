# TestLab — Status Validation Report

**Domain:** `[BACKEND]` `[FRONTEND]`
**Status:** `reference`
**Created:** 2026-05-19

---

## Summary

Full audit of the TestLab app (frontend SPA + backend API modules) as of 2026-05-19.
All 6 backend modules pass `node scripts/validate-structure.js`. Auth, token refresh,
and basic CRUD (list + create) are working end-to-end. The following gaps were identified.

---

## Backend Modules — Current State

| Module       | Structure | GET list | GET one | POST | PATCH/PUT | DELETE | Tests |
| ------------ | --------- | -------- | ------- | ---- | --------- | ------ | ----- |
| projects     | ✅        | ✅       | ✅      | ✅   | ❌        | ❌     | ✅    |
| cases        | ✅        | ✅       | ❌ exp  | ✅   | ✅ status | ❌     | ✅    |
| milestones   | ✅        | ✅       | ✅      | ✅   | ❌        | ❌     | ✅    |
| requirements | ✅        | ✅       | ✅      | ✅   | ❌        | ❌     | ✅    |
| runs         | ✅        | ✅       | ✅      | ✅🐛 | ❌        | ❌     | ✅    |
| suites       | ✅        | ✅       | ✅      | ✅   | ❌        | ❌     | ✅    |

🐛 = bug: created runs are not associated with the project (missing `projectId` in `CreateRunData`)

---

## Frontend Pages — Current State

| Page         | Exists | List | Create | Edit | Delete | Report/Details |
| ------------ | ------ | ---- | ------ | ---- | ------ | -------------- |
| Login        | ✅     | —    | —      | —    | —      | —              |
| Signup       | ✅     | —    | —      | —    | —      | —              |
| Projects     | ✅     | ✅   | ✅     | ❌   | ❌     | —              |
| Suites       | ✅     | ✅   | ✅     | ❌   | ❌     | —              |
| TestCases    | ✅     | ✅   | ✅     | ❌   | ❌     | Status only    |
| Milestones   | ✅     | ✅   | ✅     | ❌   | ❌     | —              |
| Requirements | ✅     | ✅   | ✅     | ❌   | ❌     | —              |
| Runs         | ✅     | ✅   | ✅     | ❌   | ❌     | —              |
| Reports      | ✅     | ❌   | —      | —    | —      | ❌ stub only   |

---

## Critical Bugs

1. **[BE] Runs project association missing** — `create()` in runs service does not pass `projectId`
   to the repository; `findAll()` queries by `plan.projectId` which means listed and created runs
   are disconnected. See task `04-fix-runs-project-association.md`.

2. **[FE] ReportsPage is a stub** — Only renders `projectId` and `runId` from URL params.
   No data fetched, no results displayed. See task `07-reports-page.md`.

---

## Open Tasks (in this folder)

- `01-status-validation.md` — this file
- `02-be-update-delete-endpoints.md` — add PUT/PATCH + DELETE to all 6 modules
- `03-fe-edit-delete-ui.md` — add edit/delete actions to all FE pages
- `04-fix-runs-project-association.md` — fix the runs creation bug
- `05-run-execution.md` — add test case assignment + execution tracking to runs
- `06-traceability.md` — link test cases to requirements and milestones
- `07-reports-page.md` — implement the run report page with real data
- `08-fe-unit-tests.md` — add frontend unit tests (Vitest + Testing Library)
