# Task: Scaffold Vite + React + TypeScript App

**Domain:** `[FRONTEND]` `[DEVOPS]`
**Assigned Agent:** frontend-developer
**Status:** `pending`
**Created:** 2026-05-28
**Depends On:** none

---

## Context

Create `apps/web-app` — a new React + Vite + TypeScript SPA registered in the pnpm
workspace and the Turborepo pipeline.  
The app must share the monorepo `tsconfig` base from `packages/tsconfig` and pick up
the shared design tokens / UI components from `packages/ui` when needed.  
No backend calls in this task — focus is on the project skeleton and dev tooling.

---

## Requirements

- [ ] Create `apps/web-app/` with `pnpm create vite` template `react-ts`
- [ ] Add `apps/web-app` to `pnpm-workspace.yaml` (already uses `apps/*` glob — verify it picks up)
- [ ] Set `"name": "@restopsiq/web-app"` in `package.json`
- [ ] Extend `packages/tsconfig/base.json` in `tsconfig.json` and `tsconfig.app.json`
- [ ] Add a `build`, `dev`, `preview`, and `typecheck` script
- [ ] Register the app in `turbo.json` if any special pipeline config is needed
- [ ] Add `vite.config.ts` with:
  - Path alias `@/` → `src/`
  - `base: '/'`
- [ ] Strip the default Vite boilerplate (`App.css`, `assets/react.svg`, counter logic) — leave a clean `App.tsx` that renders `<h1>Web App</h1>`
- [ ] Ensure `pnpm --filter=@restopsiq/web-app dev` starts without errors
- [ ] Ensure `pnpm --filter=@restopsiq/web-app build` produces a `dist/` output

---

## Acceptance Criteria

- [ ] `apps/web-app/package.json` has `"name": "@restopsiq/web-app"`
- [ ] `pnpm --filter=@restopsiq/web-app typecheck` exits 0
- [ ] `pnpm --filter=@restopsiq/web-app build` exits 0 and `dist/index.html` exists
- [ ] No TypeScript errors in the initial scaffold
- [ ] No unused imports or dead code in `src/`

---

## Files to Create or Modify

- `apps/web-app/package.json` — name, scripts, dependencies
- `apps/web-app/vite.config.ts` — alias + base config
- `apps/web-app/tsconfig.json` — extends monorepo base
- `apps/web-app/tsconfig.app.json` — app-specific TS settings
- `apps/web-app/index.html` — entry HTML
- `apps/web-app/src/main.tsx` — React root mount
- `apps/web-app/src/App.tsx` — clean root component
- `apps/web-app/src/vite-env.d.ts` — Vite client types
- `pnpm-workspace.yaml` — verify `apps/*` covers new app

---

## Notes

- Use React 19 to match the rest of the monorepo.
- Do NOT install `react-scripts` or CRA tooling.
- Keep `devDependencies` minimal at this stage — testing deps come in task `02-testing.md`.
