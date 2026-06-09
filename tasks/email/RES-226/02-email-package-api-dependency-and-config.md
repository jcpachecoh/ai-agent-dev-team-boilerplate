# RES-226 Task 02 — Email Package: API Dependency and Config Fix

## Goal

1. Fix `EmailServiceConfig` in `packages/email/src/types.ts` to make `resendApiKey` and `from`
   optional (they are used only by `EmailWorkerConfig`, not by `EmailService`).
2. Add `@restopsiq/email: workspace:*` to `apps/api/package.json` dependencies.
3. Add `RESEND_API_KEY` and `EMAIL_FROM` to `apps/api/.env.example`.
4. Run `pnpm install` to update the lockfile.
5. Confirm `typecheck` passes on both packages.

---

## Scope

- `packages/email/src/types.ts` — make `resendApiKey?` and `from?` optional in `EmailServiceConfig`.
- `apps/api/package.json` — add `"@restopsiq/email": "workspace:*"`.
- `apps/api/.env.example` — add `RESEND_API_KEY` and `EMAIL_FROM` entries.
- Run `pnpm install` to regenerate `pnpm-lock.yaml`.

---

## Out of scope

- No NestJS module code yet.
- No service or controller code.
- No schema changes.
- No changes to `EmailService` runtime logic.

---

## Files allowed

- `packages/email/src/types.ts` — change only `EmailServiceConfig` fields
- `apps/api/package.json` — add one dependency
- `apps/api/.env.example` — add two env entries
- `pnpm-lock.yaml` — updated automatically by `pnpm install`

---

## Files forbidden

- Any file in `apps/api/src/`
- `packages/email/src/email.service.ts` or any other runtime file
- Any file in `tasks/` other than this task file

---

## Implementation notes

### Fix `EmailServiceConfig`

Current:

```typescript
export interface EmailServiceConfig {
  redisUrl: string;
  resendApiKey: string;
  from: string;
}
```

Change to:

```typescript
export interface EmailServiceConfig {
  redisUrl: string;
  resendApiKey?: string;
  from?: string;
}
```

Rationale: `EmailService` constructor only uses `config.redisUrl` to create the BullMQ `Queue`.
`resendApiKey` and `from` are `EmailWorkerConfig` concerns, not `EmailServiceConfig` concerns.
Making them optional is non-breaking — no existing code passes them today.

### Add API dependency

In `apps/api/package.json`, under `"dependencies"`:

```json
"@restopsiq/email": "workspace:*"
```

### Add .env.example entries

```bash
# Email (Resend)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@restopsiq.co
```

### Run pnpm install

```bash
pnpm install
```

This updates `pnpm-lock.yaml` to resolve the new workspace link.

---

## Acceptance criteria

- [ ] `EmailServiceConfig.resendApiKey` is optional (`?`).
- [ ] `EmailServiceConfig.from` is optional (`?`).
- [ ] `apps/api/package.json` lists `"@restopsiq/email": "workspace:*"` in dependencies.
- [ ] `apps/api/.env.example` includes `RESEND_API_KEY` and `EMAIL_FROM`.
- [ ] `pnpm install` exits 0.
- [ ] `pnpm --filter=@restopsiq/email typecheck` passes with 0 errors.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes with 0 errors.
- [ ] No runtime source files in `packages/email/src/` were changed beyond `types.ts`.

---

## Validation commands

```bash
pnpm install
pnpm --filter=@restopsiq/email typecheck
pnpm --filter=@restopsiq/api typecheck
```
