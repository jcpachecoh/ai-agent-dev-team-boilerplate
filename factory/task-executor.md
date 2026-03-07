# AI Software Factory — Task Execution Engine

The **Task Execution Engine** describes how task files stored in `tasks/` are processed, routed to the appropriate agent, and tracked through to completion.

---

## Overview

Every unit of work in the AI Software Factory is represented as a **task file** in `tasks/`. The Task Execution Engine provides the rules and conventions for how these files trigger agent activity and how results are recorded.

---

## Task File Lifecycle

```
tasks/<task-file>.md created
        │
        ▼
NEXT_TASK.md updated to point to this file
        │
        ▼
Orchestrator reads task and identifies responsible agent(s)
        │
        ▼
Agent reads task file + memory/project-context.md + docs/ARCHITECTURE.md
        │
        ▼
Agent executes the task (generates code, docs, tests, etc.)
        │
        ▼
Agent marks task as complete and updates memory/progress.md
        │
        ▼
NEXT_TASK.md updated to next pending task
```

---

## Task Routing Rules

The Orchestrator routes tasks to agents based on the **task type prefix** or **domain tag** in the task file header.

| Task Domain | Assigned Agent |
|---|---|
| `[SPEC]` or `[PRODUCT]` | Product Agent |
| `[ARCH]` or `[DESIGN]` | Architecture Agent |
| `[BACKEND]` or `[API]` | Backend Agent |
| `[FRONTEND]` or `[UI]` | Frontend Agent |
| `[DATA]` or `[ETL]` | Data Agent |
| `[TEST]` or `[QA]` | Testing Agent |
| `[DEVOPS]` or `[INFRA]` | DevOps Agent |

If a task spans multiple domains, the Orchestrator splits it into sub-tasks and assigns each to the appropriate agent.

---

## Task File Format

All task files must follow the template in `templates/task-template.md`. A valid task file includes:

- **Title** — Short, imperative description (e.g., "Implement user authentication API")
- **Domain tag** — One of the tags above, used for routing
- **Context** — Background information agents need before starting
- **Requirements** — Specific, verifiable deliverables
- **Acceptance Criteria** — Conditions that must be true for the task to be complete
- **Files to Modify** — List of files the agent is expected to create or change

---

## Agent Execution Protocol

When an agent picks up a task, it must:

1. Read the task file at the path in `NEXT_TASK.md`.
2. Read `memory/project-context.md` for project-wide context.
3. Read `memory/decisions.md` for relevant architectural decisions.
4. Read `docs/ARCHITECTURE.md` for technical constraints.
5. Implement the requirements listed in the task.
6. Verify each acceptance criterion before marking the task done.
7. Update `memory/progress.md` with the task ID and completion status.

---

## Parallel Execution

Multiple agents may run in parallel when their tasks have no dependencies on each other. The Orchestrator tracks dependencies using the `Depends On` field in task files (see `templates/task-template.md`).

Example of safe parallel execution:
- `[BACKEND]` task for user API
- `[FRONTEND]` task for login page UI (using mocked data)
- `[DATA]` task for user seed dataset

These three can run simultaneously because their outputs do not depend on each other during implementation.

---

## Task Status Tracking

Task status is tracked in `memory/progress.md` using the following states:

| Status | Meaning |
|---|---|
| `pending` | Task created, not yet assigned |
| `in-progress` | Agent is actively working on the task |
| `blocked` | Task is waiting on a dependency or decision |
| `review` | Agent has completed work; awaiting validation |
| `done` | Acceptance criteria met and verified |

---

## Error Handling

If an agent encounters an ambiguity or blocker during task execution:

1. The agent sets the task status to `blocked` in `memory/progress.md`.
2. The agent appends a note to `memory/decisions.md` describing the blocker.
3. The Orchestrator reassigns the blocker to the Architecture Agent or Product Agent for resolution.
4. Once resolved, the task status is reset to `pending` and re-queued.

---

## Triggering the Engine

### Manual Trigger

```bash
# Set the current task
echo "tasks/03-user-authentication.md" > NEXT_TASK.md

# Provide the task file to your AI agent along with:
# - memory/project-context.md
# - memory/decisions.md
# - docs/ARCHITECTURE.md
```

### Automated Trigger (LangGraph)

```bash
# Run the LangGraph dev graph — it reads NEXT_TASK.md and routes to the correct agent
python ai-dev-team/graph/dev_graph.py
```

---

## Output Conventions

Each agent must produce outputs in the following locations:

| Agent | Output Location |
|---|---|
| Product Agent | `specs/`, `tasks/` |
| Architecture Agent | `docs/ARCHITECTURE.md`, `docs/adr/` |
| Backend Agent | `src/` (or equivalent source folder) |
| Frontend Agent | `src/` (or equivalent source folder) |
| Data Agent | `datasets/`, `scripts/` |
| Testing Agent | `tests/` (or test files co-located with source) |
| DevOps Agent | `.github/workflows/`, `Dockerfile`, `infra/` |
