# AI Software Factory — Orchestrator

The **Orchestrator** is the coordination layer of the AI Software Factory. It defines how agents collaborate to complete tasks end-to-end, from an initial product requirement all the way to a deployed, tested application.

---

## Purpose

The Orchestrator ensures that:

- Every task is assigned to the right agent.
- Agents work in the correct sequence (with parallel tracks where safe).
- Context and decisions are captured in `memory/` so all agents stay aligned.
- No work is duplicated and no step is skipped.

---

## Agent Roster

| Agent | Folder | Primary Output |
|---|---|---|
| **Product Agent** | `agents/product-agent/` | Specs in `specs/`, tasks in `tasks/` |
| **Architecture Agent** | `agents/architecture-agent/` | Architecture docs, ADRs in `docs/adr/` |
| **Backend Agent** | `agents/backend-agent/` | APIs, services, database schemas |
| **Frontend Agent** | `agents/frontend-agent/` | UI components, pages, frontend logic |
| **Data Agent** | `agents/data-agent/` | Datasets, ETL scripts, data pipelines |
| **Testing Agent** | `agents/testing-agent/` | Unit tests, integration tests, QA reports |
| **DevOps Agent** | `agents/devops-agent/` | Docker, CI/CD, infrastructure, deployment |

---

## Workflow

### Phase 1 — Requirements

1. **Product Agent** reads business requirements and `docs/ROADMAP.md`.
2. Product Agent writes feature specifications to `specs/<feature-name>.md`.
3. Product Agent breaks each spec into granular tasks under `tasks/`.
4. Product Agent updates `NEXT_TASK.md` to point to the highest-priority task.

### Phase 2 — Architecture

5. **Architecture Agent** reads all specs in `specs/` and tasks in `tasks/`.
6. Architecture Agent validates technical feasibility and identifies risks.
7. Architecture Agent updates `docs/ARCHITECTURE.md` and records decisions in `docs/adr/`.
8. Architecture Agent updates `memory/decisions.md` with key technical choices.

### Phase 3 — Implementation (parallel tracks)

Once the Architecture Agent approves the design, the following agents work in parallel:

9. **Backend Agent** implements APIs, services, and database schemas for the assigned tasks.
10. **Frontend Agent** implements UI components, pages, and frontend logic.
11. **Data Agent** handles datasets, ETL scripts, and data ingestion pipelines.

All agents read `memory/project-context.md` and `docs/ARCHITECTURE.md` before starting.

### Phase 4 — Validation

12. **Testing Agent** writes unit tests and integration tests for every implemented module.
13. Testing Agent runs the full test suite and reports results.
14. Testing Agent updates `memory/progress.md` with pass/fail status per task.

### Phase 5 — Deployment

15. **DevOps Agent** reads `docs/ARCHITECTURE.md` and `memory/decisions.md`.
16. DevOps Agent creates Dockerfiles, CI/CD pipelines, and infrastructure-as-code.
17. DevOps Agent deploys the system and records deployment details in `memory/progress.md`.

### Phase 6 — Final Review

18. **Architecture Agent** performs a final review of all outputs.
19. Architecture Agent confirms the implementation matches the original specs.
20. Architecture Agent closes completed tasks in `tasks/` and updates `NEXT_TASK.md`.

---

## Collaboration Diagram

```
Product Agent
    │
    ├─► specs/ + tasks/
    │
    ▼
Architecture Agent ──► docs/ARCHITECTURE.md + docs/adr/ + memory/decisions.md
    │
    ├────────────────────────────────┐
    │                                │
    ▼                                ▼
Backend Agent              Frontend Agent
Data Agent                 (parallel)
    │                                │
    └─────────────┬──────────────────┘
                  │
                  ▼
           Testing Agent ──► memory/progress.md
                  │
                  ▼
           DevOps Agent ──► deployment
                  │
                  ▼
     Architecture Agent (final review)
```

---

## Memory Files

The Orchestrator requires all agents to read and write shared memory:

| File | Purpose |
|---|---|
| `memory/project-context.md` | High-level project overview, goals, and constraints |
| `memory/decisions.md` | Architectural and product decisions with rationale |
| `memory/progress.md` | Task completion status and deployment state |

---

## Orchestrator Rules

1. **No agent skips a phase.** Implementation must not begin before architecture review.
2. **Memory is the source of truth.** Agents must update memory files after completing work.
3. **One task at a time per agent.** Agents focus on the task in `NEXT_TASK.md` for their domain.
4. **Testing gates deployment.** The DevOps Agent only deploys after the Testing Agent confirms all tests pass.
5. **Architecture Agent has veto power.** Any agent may pause and request an architecture review if a decision is unclear.
