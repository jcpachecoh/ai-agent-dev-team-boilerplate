# Project Context

This file stores the high-level context of the current project. All agents must read this file before starting any task to ensure they are aligned with the project's goals, constraints, and conventions.

---

## Project Name

**RestOpsIQ Platform** (`restopsiq-platform`)

## Project Description

RestOpsIQ is a restaurant operations intelligence platform that connects three types of users: customers placing orders, kitchend device sync operations, POS system managers overseeing restaurant operations, and riders fulfilling deliveries. It is built as a Turborepo monorepo with a NestJS API backend, a Next.js web dashboard, and three React Native mobile apps for each user type.

## Business Goals

- Provide real-time order management and tracking across customers, managers, and riders
- Enable restaurant managers to monitor operations, manage menus, and track delivery performance
- Offer customers a seamless ordering and tracking experience on mobile
- Give riders efficient delivery routing and order acceptance workflows
- Build a scalable, maintainable multi-app platform with shared code across apps

## Target Users

- **Customer (mobile-client)**: End users who browse menus, place orders, and track delivery in real time via the Expo mobile app
- **Manager (mobile-manager)**: Restaurant staff who manage menus, accept/reject orders, monitor kitchen status, and view analytics via the Expo mobile app
- **Rider (mobile-rider)**: Delivery personnel who receive delivery assignments, navigate routes, and update delivery status via the Expo mobile app
- **Admin / Ops (web)**: Internal team members who manage platform configuration, users, and analytics via the Next.js web dashboard

## Tech Stack

| Layer           | Technology                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Web Frontend    | Next.js 16 + React 19 + SASS/SCSS Modules (7-1 architecture)                                            |
| Mobile Apps     | React Native 0.74 + Expo 51 (3 apps: client, manager, rider)                                            |
| Backend API     | NestJS 10 + Node.js 18+                                                                                 |
| Shared Packages | `@restopsiq/types`, `@restopsiq/ui`, `@restopsiq/utils`, `@restopsiq/api-client`, `@restopsiq/tsconfig` |
| Database        | PostgreSQL + Prisma ORM                                                                                 |
| Infrastructure  | Docker + GitHub Actions                                                                                 |
| Build System    | Turborepo 2 + npm workspaces                                                                            |
| AI/ML (agents)  | LangGraph + LangChain + Anthropic Claude / OpenAI GPT                                                   |

## Key Constraints

- **TypeScript strict mode** — all apps and packages must compile cleanly with `tsc --noEmit`
- **No Tailwind CSS** — use SASS/SCSS Modules only for web and package styling
- **Shared packages are internal** — `@restopsiq/*` packages are private workspace packages, not published to npm
- **All APIs must be authenticated** — no public endpoints except auth routes
- **Mobile builds via EAS** — Expo builds use EAS Build, not local CLI
- **One API, multiple clients** — the NestJS API serves web, all 3 mobile apps, and future integrations
- **Turbo-compatible scripts** — every app/package must expose `build`, `dev`, `lint`, `typecheck`, `clean` scripts

## Coding Standards

- **Language**: TypeScript 5.4+ strict mode across all packages
- **Linting**: ESLint (to be configured) + Prettier
- **Testing**: Jest + Supertest (API), React Testing Library (web), minimum 80% coverage target
- **Branch naming**: `feature/<issue-number>-<short-title>` or `fix/<issue-number>-<short-title>`
- **Commit style**: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- **PR requirement**: All changes via PRs; direct pushes to `main` are not allowed
- **Component structure**: Each UI component in its own folder with `index.ts`, `ComponentName.tsx`, `ComponentName.module.scss`

## Repository Structure

```
apps/
  api/              — NestJS backend API (@restopsiq/api)
  web/              — Next.js web dashboard (@restopsiq/web)
  mobile-client/    — Expo app for customers (@restopsiq/mobile-client)
  mobile-manager/   — Expo app for restaurant managers (@restopsiq/mobile-manager)
  mobile-rider/     — Expo app for delivery riders (@restopsiq/mobile-rider)

packages/
  api-client/       — Shared typed HTTP client for all frontends
  types/            — Shared TypeScript types and interfaces
  ui/               — Shared React component library (web)
  utils/            — Shared utility functions
  tsconfig/         — Shared TypeScript configs

agents/             — AI agent role definitions and system prompts
factory/            — Orchestrator and task execution engine docs
memory/             — Shared project knowledge (this folder)
templates/          — Reusable task and spec templates
tasks/              — Task definitions for agents
specs/              — Feature specifications
datasets/           — Seed data and datasets
scripts/            — ETL and automation scripts
docs/               — Architecture, roadmap, and ADRs
ai-dev-team/        — LangGraph automation agents (Python)
.github/            — GitHub Actions workflows and issue templates
```

## Last Updated

- Date: 2026-05-10
- Updated by: Architecture Agent (Copilot)
