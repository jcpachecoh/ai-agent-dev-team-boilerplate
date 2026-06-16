# Task: JIRA Story Linking — Frontend UI

**Domain:** `[SPEC] [FRONTEND]`
**Assigned Agent:** Frontend Agent
**Status:** `pending`
**Created:** 2026-05-21
**Depends On:** `12-jira-mcp-backend.md`

---

## Context

Task 12 added backend endpoints for JIRA links. This task surfaces them in the TestLab UI:

1. A **JiraIssuePicker** modal — search for JIRA issues by JQL and link them to an entity.
2. A **JiraChip** badge — compact display of a linked JIRA issue on any card or detail view.
3. The `useJiraLinks` TanStack Query hooks — CRUD for `JiraLink` records.

---

## Spec

### Acceptance Criteria

- [ ] On `TestCasesPage`, each test case row shows `JiraChip` badges for its linked JIRA issues.
- [ ] Clicking the **+ Link JIRA** button on a test case opens `JiraIssuePickerModal`.
- [ ] The modal lets the user select a JIRA project from a dropdown, then type to search issues.
      Searching debounces at 300 ms. Results show issue key + summary.
- [ ] Selecting an issue and clicking **Link** calls `POST /testlab/projects/:id/jira-links`.
- [ ] After linking, the badge appears immediately (optimistic update).
- [ ] Clicking the × on a `JiraChip` calls `DELETE /testlab/projects/:id/jira-links/:linkId`
      with optimistic removal.
- [ ] The same `JiraChip` / link button pattern works on `MilestoneDetailPage` and
      `RequirementDetailPage` (entity types `milestone` and `requirement`).

---

## Requirements

### New components

#### `JiraChip` (`apps/testlab/src/components/JiraChip/`)

```
JiraChip/
├── index.ts
├── JiraChip.tsx
└── JiraChip.module.css
```

Props:

```ts
interface JiraChipProps {
  issueKey: string; // e.g. "PROJ-123"
  summary: string;
  issueUrl: string;
  onRemove?: () => void; // undefined = read-only chip (no × button)
}
```

Design:

- Jira blue accent: `#0052CC` (do not use a CSS variable, define as a local constant).
- Pill shape: `border-radius: var(--radius-lg)`.
- Opens `issueUrl` in a new tab when clicked (not the × button).
- × button: `aria-label="Remove JIRA link"`.

#### `JiraIssuePickerModal` (`apps/testlab/src/components/JiraIssuePickerModal/`)

```
JiraIssuePickerModal/
├── index.ts
├── JiraIssuePickerModal.tsx
└── JiraIssuePickerModal.module.css
```

Props:

```ts
interface JiraIssuePickerModalProps {
  projectId: string;
  entityType: 'testCase' | 'milestone' | 'requirement';
  entityId: string;
  onClose: () => void;
}
```

Behaviour:

1. On open: fetch JIRA projects via `GET /testlab/jira/projects`. Populate a `<select>`.
2. User picks a project. Immediately fetch top 25 issues (no query, default JQL).
3. User types in search box → debounced JQL search (`summary ~ ":query"` appended to project JQL).
4. Results list: issue key (bold, monospace) + summary. Keyboard navigable.
5. Click row → highlight. Click **Link** → call `createJiraLink` mutation → close modal.
6. Loading states and error states required.

---

### New hooks (`apps/testlab/src/hooks/useJiraLinks.ts`)

```ts
// Read
export function useJiraLinks(projectId: string): UseQueryResult<JiraLink[]>
export function useJiraProjects(): UseQueryResult<JiraProject[]>
export function useJiraIssues(projectKey: string, query: string): UseQueryResult<JiraIssue[]>

// Mutations (optimistic)
export function useCreateJiraLink(projectId: string): UseMutationResult<...>
export function useDeleteJiraLink(projectId: string): UseMutationResult<...>
```

- `useCreateJiraLink`: optimistic insert into `['jira-links', projectId]` cache.
- `useDeleteJiraLink`: optimistic remove from `['jira-links', projectId]` cache.
- Both use `onMutate → onError → onSettled` pattern (same as `useCaseTraceability.ts`).

### New API service (`apps/testlab/src/services/jira.service.ts`)

```ts
export interface JiraProject { key: string; name: string; }
export interface JiraIssue   { key: string; summary: string; url: string; }
export interface JiraLink    { id: string; issueKey: string; issueSummary: string; issueUrl: string; entityType: string; entityId: string; }

export const jiraService = {
  getProjects: (): Promise<JiraProject[]>,
  searchIssues: (projectKey: string, query: string): Promise<JiraIssue[]>,
  listLinks: (projectId: string): Promise<JiraLink[]>,
  createLink: (projectId: string, body: CreateLinkBody): Promise<JiraLink>,
  deleteLink: (projectId: string, linkId: string): Promise<void>,
};
```

---

## Files to Create or Modify

| File                                                                               | Action                           |
| ---------------------------------------------------------------------------------- | -------------------------------- |
| `apps/testlab/src/components/JiraChip/JiraChip.tsx`                                | Create                           |
| `apps/testlab/src/components/JiraChip/JiraChip.module.css`                         | Create                           |
| `apps/testlab/src/components/JiraChip/index.ts`                                    | Create                           |
| `apps/testlab/src/components/JiraIssuePickerModal/JiraIssuePickerModal.tsx`        | Create                           |
| `apps/testlab/src/components/JiraIssuePickerModal/JiraIssuePickerModal.module.css` | Create                           |
| `apps/testlab/src/components/JiraIssuePickerModal/index.ts`                        | Create                           |
| `apps/testlab/src/hooks/useJiraLinks.ts`                                           | Create                           |
| `apps/testlab/src/services/jira.service.ts`                                        | Create                           |
| `apps/testlab/src/pages/TestCasesPage/TestCasesPage.tsx`                           | Modify — add chips + link button |
| `apps/testlab/src/pages/MilestoneDetailPage/*.tsx`                                 | Modify — same pattern            |
| `apps/testlab/src/pages/RequirementDetailPage/*.tsx`                               | Modify — same pattern            |

---

## Design Reference

- JIRA blue: `#0052CC`
- Chip font size: `0.75rem`
- Chip padding: `var(--space-1) var(--space-2)`
- Modal width: `560px`, max-height: `70vh` with scroll on results list
- Search results row height: `48px`
- Issue key: `font-family: var(--font-mono)`, `color: #0052CC`
- Summary: `color: var(--color-text-primary)`
