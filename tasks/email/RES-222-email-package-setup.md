# Task: EMAIL-01 — Setup packages/email: dependencies, tsconfig, turbo pipeline

**Linear:** RES-222  
**Parent:** RES-221 (Email Epic)  
**Status:** Done  
**Estimate:** 2 points

---

## Goal

Initialize `packages/email` as a proper monorepo package with all runtime dependencies,
build tooling, TypeScript configuration, and Turbo pipeline entries.

---

## Background

Prior to this task, `packages/email` did not exist. The email package is the foundation
for all email functionality in the platform. Every subsequent email task depends on this
package being correctly wired into the monorepo.

---

## Scope

- Create `packages/email/package.json` — package declaration with all dependencies
- Create `packages/email/tsconfig.json` — extends `react-library.json` for JSX support
- Create `packages/email/src/index.ts` — minimal stub export (to be replaced in RES-223)
- Create `packages/email/src/templates/.gitkeep` — ensures preview script can find the dir
- Modify `turbo.json` — add `email#build` and `email#preview` pipeline entries
- Create root `.env.example` — `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
- Run `pnpm install` to install all package dependencies

---

## Out of Scope

- No email sending logic
- No Resend SDK calls
- No BullMQ queues or workers
- No real email templates
- No API changes

---

## Files Changed

| File                                    | Action   | Reason                                                  |
| --------------------------------------- | -------- | ------------------------------------------------------- |
| `packages/email/package.json`           | Created  | Package declaration — `@restopsiq/email` v1.0.0         |
| `packages/email/tsconfig.json`          | Created  | Extends `react-library.json`; provides `jsx: react-jsx` |
| `packages/email/src/index.ts`           | Created  | Stub `EmailService` class — replaced in RES-223         |
| `packages/email/src/templates/.gitkeep` | Created  | Keeps `src/templates/` in git for preview script        |
| `turbo.json`                            | Modified | Added `email#build` and `email#preview` pipeline tasks  |
| `.env.example` (root)                   | Created  | Documents required email environment variables          |
| `pnpm-lock.yaml`                        | Modified | Updated by `pnpm install` after adding dependencies     |

---

## Dependencies Installed

### Runtime

| Package                   | Version   | Purpose                      |
| ------------------------- | --------- | ---------------------------- |
| `resend`                  | `^3.0.0`  | Email delivery provider      |
| `@react-email/components` | `^0.0.22` | React Email UI primitives    |
| `@react-email/render`     | `^0.0.13` | Server-side HTML renderer    |
| `bullmq`                  | `^5.0.0`  | Redis-backed async job queue |
| `react`                   | `^18.0.0` | JSX runtime for templates    |

### Dev

| Package               | Version       | Purpose                         |
| --------------------- | ------------- | ------------------------------- |
| `react-email`         | `^2.1.0`      | CLI for local template preview  |
| `tsup`                | `^8.0.0`      | Bundler — CJS + ESM + `.d.ts`   |
| `@types/react`        | `^18.0.0`     | React TypeScript types          |
| `@restopsiq/tsconfig` | `workspace:*` | Shared tsconfig presets         |
| `typescript`          | `^5.4.0`      | TypeScript compiler (typecheck) |

---

## Package Scripts

```json
{
  "build": "tsup src/index.ts --format cjs,esm --dts",
  "dev": "tsup src/index.ts --watch",
  "preview": "email dev --dir src/templates --port 3333",
  "typecheck": "tsc --noEmit",
  "clean": "rm -rf dist",
  "test": "jest"
}
```

---

## Acceptance Criteria

- [x] `pnpm build --filter=@restopsiq/email` compiles CJS + ESM + `.d.ts` without errors
- [x] `pnpm --filter=@restopsiq/email typecheck` passes with 0 errors
- [x] Turbo pipeline dry-run resolves `@restopsiq/email#build` correctly
- [x] `node -e "require('./packages/email/dist/index.js')"` runs without error

---

## Validation Commands

```bash
pnpm build --filter=@restopsiq/email
pnpm --filter=@restopsiq/email typecheck
pnpm turbo run build --filter=@restopsiq/email --dry-run
git status --short
```

---

## Notes

- `tsconfig.json` extends `react-library.json` (not `base.json`) because React Email templates
  require `jsx: react-jsx` and DOM lib types. The `react-library.json` preset already provides both.
- `email#build` in `turbo.json` resolves to `@restopsiq/email#build` in turbo v2 (confirmed by dry-run).
- A peer dependency warning from `react-dom@18.3.1` requiring `react@^18.3.1` vs installed `18.2.0`
  is pre-existing and non-blocking. It can be resolved by bumping react to `^18.3.1` in a future pass.
