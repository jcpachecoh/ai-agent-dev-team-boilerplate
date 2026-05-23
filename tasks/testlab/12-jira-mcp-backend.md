# Task: JIRA MCP Integration — Backend

**Domain:** `[SPEC] [BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-21
**Depends On:** none

---

## Context

[Jira](https://www.atlassian.com/software/jira) is the project management tool used by this team.
The `mcp-atlassian` community MCP server exposes Jira issues, projects, and sprints via the
Model Context Protocol so agents and LLMs can query them with standard tool calls.

The goal of this task is to add a backend module that proxies Jira data into the TestLab domain.
This gives the frontend (task 13) and the AI generation layer (task 14) a clean, authenticated
API surface without embedding Jira credentials in the browser.

### What the backend provides

1. A read-only proxy to the Jira REST API — list projects, search issues (JQL), fetch a single
   issue with full context (summary, description, acceptance criteria, story points, priority,
   sprint, labels).
2. Persistent `JiraLink` records that associate a `TestCase`, `Milestone`, or `Requirement` in
   TestLab with a Jira issue key (e.g. `PROJ-123`).
3. Endpoints consumed by the AI generation task (task 14).

---

## MCP Configuration Instructions

### Step 1 — Install `uv` (Python runtime manager)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Re-open your terminal after installing.

### Step 2 — Get a Jira API token

1. Log in to Atlassian and go to:
   https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**, name it (e.g. `restopsiq-testlab`), copy the token.
3. Your Jira URL is `https://<your-domain>.atlassian.net`
4. Your username is your Atlassian account email.

### Step 3 — Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jira": {
      "command": "uvx",
      "args": ["mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://your-domain.atlassian.net",
        "JIRA_USERNAME": "your-email@company.com",
        "JIRA_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

Restart Claude Desktop. Verify by asking: _"List open issues in project PROJ"_.

### Step 4 — Configure Cursor

**Settings → MCP → Add new server** → paste:

```json
{
  "name": "jira",
  "command": "uvx",
  "args": ["mcp-atlassian"],
  "env": {
    "JIRA_URL": "https://your-domain.atlassian.net",
    "JIRA_USERNAME": "your-email@company.com",
    "JIRA_API_TOKEN": "your-api-token"
  }
}
```

### Available MCP tools (mcp-atlassian)

| Tool                      | Description                                   |
| ------------------------- | --------------------------------------------- |
| `jira_get_issue`          | Fetch a single issue by key (e.g. `PROJ-123`) |
| `jira_search`             | JQL search with pagination                    |
| `jira_get_projects`       | List accessible projects                      |
| `jira_get_issue_comments` | Fetch comments on an issue                    |
| `jira_get_sprint_issues`  | Issues in the active sprint                   |

---

## Backend Node.js Setup

### Install `jira.js`

```bash
pnpm --filter @restopsiq/api add jira.js
```

Add to `apps/api/.env`:

```
JIRA_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-api-token
```

Add placeholders to `apps/api/.env.example`:

```
JIRA_URL=
JIRA_USERNAME=
JIRA_API_TOKEN=
```

### Connectivity check (one-time script, delete after use)

```ts
import { Version3Client } from 'jira.js';
const jira = new Version3Client({
  host: process.env.JIRA_URL!,
  authentication: {
    basic: { email: process.env.JIRA_USERNAME!, apiToken: process.env.JIRA_API_TOKEN! },
  },
});
console.log((await jira.myself.getCurrentUser()).emailAddress);
```

---

## Spec

### Acceptance Criteria

- [ ] `GET /testlab/jira/projects` — returns Jira projects the API token has access to.
- [ ] `GET /testlab/jira/issues?projectKey=:key&query=:jql&limit=25` — searches issues via JQL.
      Default JQL when no query param: `project = :key ORDER BY updated DESC`.
- [ ] `GET /testlab/jira/issues/:issueKey` — returns `{ key, summary, description, priority,
  status, labels, url, storyPoints }`. `description` is ADF → plain text.
- [ ] `POST /testlab/projects/:projectId/jira-links` — body `{ issueKey, entityType, entityId }`.
      Caches `issueSummary` and `issueUrl` fetched from Jira. Returns `201`. Returns `409` if
      the same `(projectId, issueKey, entityType, entityId)` already exists.
- [ ] `GET /testlab/projects/:projectId/jira-links` — returns all links for the project.
- [ ] `DELETE /testlab/projects/:projectId/jira-links/:id` — deletes a link. Returns `204`.
- [ ] `validate-structure.js` reports 0 violations.
- [ ] Jira credentials are read from `ConfigService` only. Never hard-coded or logged.
- [ ] Unit tests cover service layer; `Version3Client` methods are mocked.

---

## Prisma Schema

Add to `apps/api/prisma/schema.prisma`:

```prisma
model JiraLink {
  id           String         @id @default(cuid())
  projectId    String
  issueKey     String                              // e.g. "PROJ-123"
  entityType   JiraEntityType
  entityId     String                              // TestCase / Milestone / Requirement ID
  issueSummary String                              // cached at link time
  issueUrl     String
  createdAt    DateTime       @default(now())

  project      Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, issueKey, entityType, entityId])
  @@map("jira_links")
}

enum JiraEntityType {
  testCase
  milestone
  requirement
}
```

Run: `prisma migrate dev --name add-jira-links`

---

## Module Structure (`apps/api/src/testlab/jira/`)

```
jira/
├── interfaces/
│   └── jira.interfaces.ts          IJiraRepository, IJiraService
├── repository/
│   └── jira.repository.ts          CRUD on JiraLink
├── service/
│   └── jira.service.ts             Proxy + business logic
├── controller/
│   ├── jira.controller.ts
│   └── dto/
│       ├── create-link.dto.ts      { issueKey, entityType, entityId }
│       └── search-issues.dto.ts   { projectKey, query?, limit? }
├── test/
│   ├── jira.service.spec.ts
│   └── jira.controller.spec.ts
└── jira.module.ts
```

### Service implementation notes

- Inject `Version3Client` as a named provider for testability.
- `getIssue` converts ADF description to plain text: recursively walk `content[].content[]`,
  collect all `{ type: 'text' }` nodes, join paragraphs with `\n\n`. No external parser.
- `createLink` calls `getIssue` first to cache `issueSummary` and `issueUrl`.

### Register in TestlabModule

Add `JiraModule` to `apps/api/src/testlab/testlab.module.ts` imports.

---

## Files to Create or Modify

| File                                                            | Action                            |
| --------------------------------------------------------------- | --------------------------------- |
| `apps/api/prisma/schema.prisma`                                 | Add `JiraLink` + `JiraEntityType` |
| `apps/api/src/testlab/jira/interfaces/jira.interfaces.ts`       | Create                            |
| `apps/api/src/testlab/jira/repository/jira.repository.ts`       | Create                            |
| `apps/api/src/testlab/jira/service/jira.service.ts`             | Create                            |
| `apps/api/src/testlab/jira/controller/jira.controller.ts`       | Create                            |
| `apps/api/src/testlab/jira/controller/dto/create-link.dto.ts`   | Create                            |
| `apps/api/src/testlab/jira/controller/dto/search-issues.dto.ts` | Create                            |
| `apps/api/src/testlab/jira/test/jira.service.spec.ts`           | Create                            |
| `apps/api/src/testlab/jira/test/jira.controller.spec.ts`        | Create                            |
| `apps/api/src/testlab/jira/jira.module.ts`                      | Create                            |
| `apps/api/src/testlab/testlab.module.ts`                        | Add `JiraModule`                  |
| `apps/api/.env.example`                                         | Add Jira vars                     |

---

## Notes

- Use `Version3Client` for Jira Cloud. For Jira Server / Data Center use `Version2Client` with a
  Personal Access Token instead of email + API token.
- `jira.js` is typed — no `any` needed in service methods.
- Do **not** expose the Jira API token in responses or logs.
