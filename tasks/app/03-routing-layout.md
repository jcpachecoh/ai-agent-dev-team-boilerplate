# Task: Routing, Layout Shell & Base Components

**Domain:** `[FRONTEND]`
**Assigned Agent:** frontend-developer
**Status:** `pending`
**Created:** 2026-05-28
**Depends On:** `tasks/app/02-testing.md`

---

## Context

Wire up React Router, create the top-level layout shell, and establish the base
component conventions that all future features will follow.

Every component must live in its own folder (`ComponentName/index.ts`,
`ComponentName.tsx`, `ComponentName.module.scss`) following the project's
[copilot-instructions](.github/copilot-instructions.md).

---

## Requirements

- [ ] Install dependencies:
  - `react-router-dom` (v7, already used elsewhere in the monorepo)
- [ ] Wrap the app in `<BrowserRouter>` in `src/main.tsx`
- [ ] Create `src/router.tsx` exporting a `<Routes>` tree with:
  - `/` → `<HomePage />`
  - `*` → `<NotFoundPage />`
- [ ] Create the layout shell component `src/components/AppLayout/`:
  - Top navigation bar with the app name
  - `<Outlet />` / `{children}` content area
  - Footer with version string from `import.meta.env.VITE_APP_VERSION ?? 'dev'`
- [ ] Create placeholder pages:
  - `src/pages/HomePage/` — renders `<h1>Home</h1>`
  - `src/pages/NotFoundPage/` — renders `<h1>404 — Page not found</h1>`
- [ ] Create `src/styles/` with:
  - `tokens.scss` — CSS custom properties for color, spacing, typography (import from `packages/ui` tokens if available, otherwise define locally)
  - `globals.scss` — reset + base body styles, imports `tokens.scss`
- [ ] Import `globals.scss` in `src/main.tsx`
- [ ] Add unit tests for each new component:
  - `AppLayout.test.tsx` — renders children, shows nav and footer
  - `HomePage.test.tsx` — renders heading
  - `NotFoundPage.test.tsx` — renders 404 message

---

## Acceptance Criteria

- [ ] Navigating to `/` renders the `HomePage` inside the `AppLayout`
- [ ] Navigating to `/anything-unknown` renders `NotFoundPage`
- [ ] `pnpm --filter=@restopsiq/web-app test` passes (all component tests green)
- [ ] No inline `style={{}}` props used (use CSS Modules)
- [ ] No hard-coded color values in SCSS — all colors use variables from `tokens.scss`
- [ ] `pnpm --filter=@restopsiq/web-app build` exits 0 with no TS errors

---

## Files to Create or Modify

- `apps/web-app/src/main.tsx` — add `BrowserRouter` + global styles import
- `apps/web-app/src/router.tsx` — route definitions
- `apps/web-app/src/App.tsx` — render router
- `apps/web-app/src/components/AppLayout/index.ts`
- `apps/web-app/src/components/AppLayout/AppLayout.tsx`
- `apps/web-app/src/components/AppLayout/AppLayout.module.scss`
- `apps/web-app/src/components/AppLayout/AppLayout.test.tsx`
- `apps/web-app/src/pages/HomePage/index.ts`
- `apps/web-app/src/pages/HomePage/HomePage.tsx`
- `apps/web-app/src/pages/HomePage/HomePage.module.scss`
- `apps/web-app/src/pages/HomePage/HomePage.test.tsx`
- `apps/web-app/src/pages/NotFoundPage/index.ts`
- `apps/web-app/src/pages/NotFoundPage/NotFoundPage.tsx`
- `apps/web-app/src/pages/NotFoundPage/NotFoundPage.module.scss`
- `apps/web-app/src/pages/NotFoundPage/NotFoundPage.test.tsx`
- `apps/web-app/src/styles/tokens.scss`
- `apps/web-app/src/styles/globals.scss`

---

## Notes

- SCSS nesting must not exceed 3 levels — enforced by the project copilot instructions.
- Use `@use` / `@forward` — never `@import` (deprecated).
- `VITE_APP_VERSION` should be set in `.env.example` as `VITE_APP_VERSION=0.1.0`.
