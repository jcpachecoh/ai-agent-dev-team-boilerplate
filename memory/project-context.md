# Project Context

This file stores the high-level context of the current project. All agents must read this file before starting any task to ensure they are aligned with the project's goals, constraints, and conventions.

---

## Project Name

> _Fill in the project name here._

## Project Description

> _One to three sentences describing what this project does and who it is for._

## Business Goals

> _List the key outcomes the project must deliver._

- Goal 1
- Goal 2
- Goal 3

## Target Users

> _Describe the primary users of the system._

- User type 1: _description_
- User type 2: _description_

## Tech Stack

> _List the core technologies used in this project. Keep this in sync with `docs/ARCHITECTURE.md`._

| Layer | Technology |
|---|---|
| Frontend | _e.g., Next.js + TailwindCSS_ |
| Backend | _e.g., NestJS / Node.js_ |
| Database | _e.g., PostgreSQL + Prisma_ |
| Infrastructure | _e.g., Docker + GitHub Actions_ |
| AI/ML | _e.g., LangGraph + OpenAI_ |

## Key Constraints

> _List any hard constraints agents must respect when implementing tasks._

- Constraint 1 (e.g., "Must support mobile-first design")
- Constraint 2 (e.g., "All APIs must be authenticated")
- Constraint 3 (e.g., "Deployment target is AWS ECS")

## Coding Standards

> _Reference the standards all agents must follow._

- Language: _e.g., TypeScript strict mode_
- Linting: _e.g., ESLint + Prettier_
- Testing: _e.g., Jest, minimum 80% coverage_
- Branch naming: `feature/<issue-number>-<short-title>`
- Commit style: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)

## Repository Structure

> _Brief overview of key folders._

```
agents/          — AI agent definitions and prompts
factory/         — Orchestrator and task execution engine
memory/          — Shared project knowledge (this folder)
templates/       — Reusable task and spec templates
tasks/           — Task definitions for agents
specs/           — Feature specifications
datasets/        — Seed data and datasets
scripts/         — ETL and automation scripts
docs/            — Architecture, roadmap, and ADRs
ai-dev-team/     — LangGraph automation agents
```

## Last Updated

> _Date and agent that last updated this file._

- Date: _YYYY-MM-DD_
- Updated by: _Agent name or human_
