# Task: AI Test Generation from JIRA Issues

**Domain:** `[SPEC] [BACKEND] [FRONTEND]`
**Assigned Agent:** Backend Agent, Frontend Agent
**Status:** `pending`
**Created:** 2026-05-21
**Depends On:** `12-jira-mcp-backend.md`, `13-jira-link-ui.md`

---

## Context

This task adds an AI-powered test generation feature: a user selects a JIRA issue (fetched via
`JiraService` from task 12), and the system generates a set of test cases using the Vercel AI SDK.
The user reviews the generated cases in a **preview + confirm** modal before they are saved.

JIRA issue content (summary, description/acceptance criteria, labels, story points) is used as the
primary prompt context for generation. No JIRA credentials are needed in the browser — all Jira
fetching happens on the backend through `JiraService`.

---

## Spec

### Acceptance Criteria

- [ ] `POST /testlab/projects/:projectId/generate-from-jira` — body `{ issueKey: string }`.
      Fetches the JIRA issue via `JiraService`, calls OpenAI, returns an array of draft test cases.
      Each draft: `{ title, description, steps: string[], expectedResult, priority }`.
- [ ] Generation uses structured output (`generateObject` + Zod schema) — never free-form text.
- [ ] Response time ≤ 30 s (streaming not required for MVP; single structured response is fine).
- [ ] Frontend: a **Generate from JIRA** button on the `TestCasesPage` header.
- [ ] Clicking it opens `JiraIssuePickerModal` (reuse from task 13) to select an issue.
- [ ] After picking an issue, the UI shows `GenerationPreviewModal` with the drafted test cases.
- [ ] User can deselect individual cases before confirming.
- [ ] Clicking **Confirm & Save** bulk-creates the confirmed cases via the existing
      `POST /testlab/projects/:projectId/cases` endpoint.
- [ ] The newly saved cases appear in the list immediately (optimistic or invalidate).
- [ ] `OPENAI_API_KEY` and `OPENAI_MODEL` are read from `ConfigService` — not hard-coded.
- [ ] Unit tests cover `GenerationService` (mock `generateObject`).

---

## Requirements

### Backend — `GenerationModule`

#### Install AI SDK

```bash
pnpm --filter @restopsiq/api add ai @ai-sdk/openai zod
```

Add to `apps/api/.env`:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

Add placeholders to `apps/api/.env.example`:

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
```

#### Module structure (`apps/api/src/testlab/generation/`)

```
generation/
├── interfaces/
│   └── generation.interfaces.ts    IGenerationService, DraftTestCase
├── service/
│   └── generation.service.ts       Calls JiraService + generateObject
├── controller/
│   ├── generation.controller.ts
│   └── dto/
│       └── generate-from-jira.dto.ts  { issueKey: string }
├── test/
│   └── generation.service.spec.ts
└── generation.module.ts            imports JiraModule
```

#### Zod schema for structured output

```ts
import { z } from 'zod';

export const DraftTestCaseSchema = z.object({
  cases: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      steps: z.array(z.string()),
      expectedResult: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
    }),
  ),
});
```

#### System prompt template

```
You are a QA engineer. Given a JIRA issue, generate comprehensive test cases that cover
the happy path, edge cases, and error conditions.

JIRA Issue: {issueKey}
Summary: {summary}
Description:
{description}

Generate between 3 and 8 test cases. Each test case must have clear, actionable steps
and a specific expected result. Prefer specificity over generality.
```

#### `GenerationService.generateFromJira(projectId, issueKey)`

1. Call `JiraService.getIssue(issueKey)` to fetch issue data.
2. Build the prompt from the template above.
3. Call `generateObject({ model: openai(model), schema: DraftTestCaseSchema, prompt })`.
4. Return `result.object.cases`.

#### Register in TestlabModule

Add `GenerationModule` to `apps/api/src/testlab/testlab.module.ts` imports.

---

### Frontend

#### `GenerationPreviewModal` (`apps/testlab/src/components/GenerationPreviewModal/`)

```
GenerationPreviewModal/
├── index.ts
├── GenerationPreviewModal.tsx
└── GenerationPreviewModal.module.css
```

Props:

```ts
interface GenerationPreviewModalProps {
  projectId: string;
  draftCases: DraftTestCase[];
  onConfirm: (selected: DraftTestCase[]) => void;
  onClose: () => void;
}
```

Behaviour:

- List of draft cases, each with a checkbox (all checked by default).
- Shows `title`, `priority` badge, `description`, collapsible `steps` list.
- **Confirm & Save** button — disabled if nothing selected. Shows spinner during save.
- **Cancel** button closes without saving.

#### Hook — `useGenerateFromJira` (`apps/testlab/src/hooks/useGeneration.ts`)

```ts
export function useGenerateFromJira(
  projectId: string,
): UseMutationResult<DraftTestCase[], Error, { issueKey: string }>;
```

Calls `POST /testlab/projects/:projectId/generate-from-jira`.
On success, opens `GenerationPreviewModal` (state lifted to page level).

#### Flow on `TestCasesPage`

```
[Generate from JIRA] button
  → opens JiraIssuePickerModal (entityType='testCase', no entityId — picker only)
    → user selects issue
      → calls useGenerateFromJira({ issueKey })
        → shows loading spinner on button
          → on success: opens GenerationPreviewModal with draft cases
            → user checks/unchecks, clicks Confirm & Save
              → bulk-create via existing useCreateTestCase mutation (loop or batch endpoint)
                → modal closes, cases appear in list
```

---

## Files to Create or Modify

| File                                                                                   | Action                       |
| -------------------------------------------------------------------------------------- | ---------------------------- |
| `apps/api/src/testlab/generation/interfaces/generation.interfaces.ts`                  | Create                       |
| `apps/api/src/testlab/generation/service/generation.service.ts`                        | Create                       |
| `apps/api/src/testlab/generation/controller/generation.controller.ts`                  | Create                       |
| `apps/api/src/testlab/generation/controller/dto/generate-from-jira.dto.ts`             | Create                       |
| `apps/api/src/testlab/generation/test/generation.service.spec.ts`                      | Create                       |
| `apps/api/src/testlab/generation/generation.module.ts`                                 | Create                       |
| `apps/api/src/testlab/testlab.module.ts`                                               | Add `GenerationModule`       |
| `apps/api/.env.example`                                                                | Add OpenAI vars              |
| `apps/testlab/src/components/GenerationPreviewModal/GenerationPreviewModal.tsx`        | Create                       |
| `apps/testlab/src/components/GenerationPreviewModal/GenerationPreviewModal.module.css` | Create                       |
| `apps/testlab/src/components/GenerationPreviewModal/index.ts`                          | Create                       |
| `apps/testlab/src/hooks/useGeneration.ts`                                              | Create                       |
| `apps/testlab/src/pages/TestCasesPage/TestCasesPage.tsx`                               | Modify — add Generate button |

---

## Notes

- Use `generateObject` (not `streamObject`) for MVP — simpler error handling.
- The `JiraIssuePickerModal` in the generation flow is used purely for selection; do not pass
  `entityId` and do not call the create-link endpoint at that step.
- If the AI model returns fewer than 3 cases the service should still return them without error.
- `OPENAI_MODEL` defaults to `gpt-4o` if not set, via `ConfigService.get('OPENAI_MODEL', 'gpt-4o')`.
- Test the service with mocked `generateObject` — do not make real OpenAI calls in tests.
