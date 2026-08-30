# Task: TestLab — Test Case Management App

**Domain:** `[SPEC]` `[FRONTEND]` `[BACKEND]`  
**Assigned Agent:** frontend-developer, backend-developer, db-architect  
**Status:** `pending`  
**Created:** 2026-05-12  
**Depends On:** `01-project-setup.md`, `02-authentication.md`

---

## Context

Build **TestLab** — an in-house TestRail clone — as a standalone React + Vite SPA
(`apps/testlab`) that shares the same PostgreSQL database as `apps/api`.  
All data access goes through the existing NestJS API.  
Development follows Spec-Driven Development: specs are written first, then
acceptance tests, then implementation.

Tech stack:

- **Frontend:** React 19 + Vite 6 + React Router 7 + TanStack Query 5
- **Styling:** CSS Modules + project design tokens
- **Backend:** NestJS modules added to `apps/api`
- **Database:** PostgreSQL via Prisma (schema in `apps/api/prisma/schema.prisma`)

---

## Domain Model

```
Project
  └── ProjectMember (User × Role)
  └── TestSuite
        └── TestSection (nested)
              └── TestCase
  └── TestPlan
        └── TestPlanEntry → TestSuite
        └── TestRun
              └── TestResult → TestCase
                    └── Attachment
  └── Milestone → TestPlan
  └── Requirement → TestCase (many-to-many via RequirementCase)
```

---

## Functional Specs

### S-01 · Projects

```
GIVEN a logged-in user
WHEN they visit /projects
THEN they see a list of projects they are a member of

GIVEN an Admin or Lead
WHEN they create a project (name, slug, description)
THEN the project appears in the list and the creator is auto-added as ADMIN
```

### S-02 · Test Suites & Sections

```
GIVEN a project member
WHEN they open a project
THEN they see all test suites for that project

GIVEN a Lead or Admin
WHEN they create a TestSuite
THEN they can add top-level and nested TestSections to organise cases
```

### S-03 · Test Cases

```
GIVEN a Tester or above
WHEN they create a TestCase inside a Section
THEN they must provide: title, type, priority, template
AND optionally: preconditions, steps (array of action+expectedResult), notes

GIVEN a TestCase with template=BDD
WHEN editing steps
THEN steps follow Given/When/Then format

GIVEN a TestCase
WHEN a user views history
THEN all field changes are displayed in reverse-chronological order
```

### S-04 · Test Plans

```
GIVEN a Lead or Admin
WHEN they create a TestPlan
THEN they can attach one or more TestSuites to it
AND optionally link it to a Milestone
```

### S-05 · Test Runs

```
GIVEN a Lead or Admin
WHEN they create a TestRun from a TestPlan
THEN one TestResult record (status=UNTESTED) is created per TestCase in the plan

GIVEN a Tester
WHEN they execute a TestRun
THEN they can mark each result as: PASS | FAIL | BLOCKED | RETEST | SKIPPED
AND add a comment and attach files (screenshots, logs)
```

### S-06 · Milestones

```
GIVEN a Lead or Admin
WHEN they create a Milestone (name, dueDate)
THEN they can attach TestPlans to it

GIVEN a Milestone
WHEN all linked TestRuns are COMPLETED
THEN the Milestone can be marked as completed
```

### S-07 · Requirements Traceability

```
GIVEN an Admin or Lead
WHEN they create a Requirement (title, externalId)
THEN they can link it to one or many TestCases

GIVEN a Requirement
WHEN a user views the traceability matrix
THEN they see coverage %, linked cases, and last result per case
```

### S-08 · Reporting

```
GIVEN any project member
WHEN they open a TestRun report
THEN they see: total cases, pass/fail/blocked/untested counts, % complete

GIVEN a project
WHEN comparing two TestRuns
THEN a delta report shows regressions (PASS→FAIL) and fixes (FAIL→PASS)
```

### S-09 · Search & Filters

```
GIVEN any member
WHEN they search test cases
THEN results filter by: title, priority, type, section, assigned tester

GIVEN a member
WHEN they save a filter combination as a "View"
THEN the view persists and appears in the sidebar
```

### S-10 · API for CI/CD Integration

```
GIVEN an external CI pipeline (GitHub Actions, etc.)
WHEN it POSTs results to POST /api/testlab/runs/:runId/results/bulk
THEN TestResult records are created/updated for each reported case
AND the payload matches the BulkResultDto schema
```

---

## Acceptance Criteria

- [ ] All 10 functional spec groups have at least one passing integration test
- [ ] Prisma migration runs cleanly on a fresh database (`prisma migrate deploy`)
- [ ] NestJS modules expose REST endpoints matching the API contracts in `specs/testlab/`
- [ ] React app builds with `vite build` with zero TypeScript errors
- [ ] All new API endpoints are guarded (Auth guard required)
- [ ] Coverage ≥80% on all new service files
- [ ] No `any` type used without justification comment
- [ ] Every new component lives in `ComponentName/index.ts + ComponentName.tsx + ComponentName.module.scss`

---

## Sprint Breakdown

| Sprint | Scope                                                                         |
| ------ | ----------------------------------------------------------------------------- |
| 1      | DB schema + Prisma migration + NestJS ProjectsModule + basic CRUD             |
| 2      | SuitesModule + SectionsModule + TestCasesModule + React scaffold with routing |
| 3      | TestPlansModule + TestRunsModule + execution UI                               |
| 4      | MilestonesModule + RequirementsModule + traceability matrix                   |
| 5      | Reporting UI + search/filter + saved views                                    |
| 6      | CI/CD API endpoint + bulk result upload + file attachments                    |

---

## File Structure

```
apps/
  testlab/                        ← New Vite + React SPA
    index.html
    vite.config.ts
    tsconfig.json
    package.json
    src/
      main.tsx
      App.tsx
      router.tsx
      assets/
      pages/
        Projects/
        Suites/
        TestCases/
        Runs/
        Reports/
        Milestones/
        Requirements/
      components/
        Layout/
        Sidebar/
        StatusBadge/
        PriorityBadge/
        ResultForm/
        TraceabilityMatrix/
      hooks/
      services/                   ← API client wrappers
      types/                      ← Mirror of @restopsiq/types testlab slice
      styles/

  api/src/
    testlab/                      ← New NestJS module group
      testlab.module.ts
      projects/
        projects.module.ts
        projects.controller.ts
        projects.service.ts
        dto/
      suites/
      sections/
      cases/
      plans/
      runs/
      results/
      milestones/
      requirements/
      attachments/
```
