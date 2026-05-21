# Task: Scaffold `apps/plant` (Vite + React 18 + TypeScript)

**Depends on:** —  
**Spec:** [`specs/restopsiq-plant-context.md`](../../specs/restopsiq-plant-context.md) § Monorepo Structure, Technology Stack

---

## Goal

Create `apps/plant` in the monorepo with Vite 5, React 18, TypeScript, and Turbo scripts so the KDS runs via `pnpm turbo dev`.

---

## Scope

- New package `@restopsiq/plant` under `apps/plant/`
- `vite.config.ts`, `tsconfig.json` (extend `@restopsiq/tsconfig`)
- `src/main.tsx`, minimal `App.tsx`, `index.html`
- Folder skeleton: `screens/`, `supervisor/`, `stores/`, `hooks/`, `components/`, `services/`
- Register in `pnpm-workspace` (already `apps/*`) and root `turbo` pipeline: `dev`, `build`, `typecheck`, `lint`, `test` (stub until task 04)

---

## Requirements

- **React 18** (not 19 — align with Capacitor ecosystem)
- **Vite 5** (or 6 if repo standard is 6 — match `apps/testlab` major where possible)
- **TypeScript** strict, `tsc --noEmit` in build
- **No Next.js** dependencies or references
- Environment variables: `VITE_PLANT_API_URL`, `VITE_PLANT_WS_URL` (document in `.env.example`)
- `capacitor.config.ts` placeholder (filled in task 07)

---

## Testing strategy

- **Schema / tooling only** — no feature tests yet
- Smoke: dev server starts, `build` emits `dist/`

---

## Acceptance criteria

- [ ] `pnpm install` succeeds with new workspace package
- [ ] `pnpm turbo dev --filter=@restopsiq/plant` starts Vite on configured port
- [ ] `pnpm turbo build --filter=@restopsiq/plant` produces `apps/plant/dist/`
- [ ] `pnpm turbo typecheck --filter=@restopsiq/plant` passes
- [ ] Cold load in browser shows placeholder shell (< 3s on dev hardware per spec performance goals)

---

## Files likely affected

- `apps/plant/package.json`
- `apps/plant/vite.config.ts`
- `apps/plant/index.html`
- `apps/plant/src/main.tsx`
- `apps/plant/tsconfig.json`
- `apps/plant/.env.example`

---

## Out of scope

- Capacitor, PWA, Zustand, screens implementation
- SCSS preset (task 02)

---

## Validation commands

```bash
pnpm install
pnpm turbo dev --filter=@restopsiq/plant
pnpm turbo build --filter=@restopsiq/plant
pnpm turbo typecheck --filter=@restopsiq/plant
```
