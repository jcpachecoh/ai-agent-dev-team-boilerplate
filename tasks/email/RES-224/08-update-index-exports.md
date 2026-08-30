# Task 08 — Update index.ts to export the 4 new template components

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** Tasks 03, 04, 05, 06

---

## Goal

Expose the 4 new standalone template components from the package's public entry point so consumers can import them directly (e.g. for the React Email preview server).

---

## Scope

Modify **only** `packages/email/src/index.ts`.

Add these 4 export lines under the `# Templates` section:

```typescript
export { WelcomeEmail } from './templates/welcome';
export { ResetPasswordEmail } from './templates/reset-password';
export { VerifyEmailEmail } from './templates/verify-email';
export { InviteUserEmail } from './templates/invite-user';
```

Keep all existing exports untouched.

---

## Out of Scope

- No logic changes
- No test changes

---

## Validation

```bash
pnpm --filter=@restopsiq/email build
```

Expected: build succeeds with no errors.

```bash
pnpm --filter=@restopsiq/email test
```

Expected: full suite passes.

```bash
node scripts/validate-structure.js
```

Expected: exits 0.

---

## Files

| File                          | Action                          |
| ----------------------------- | ------------------------------- |
| `packages/email/src/index.ts` | Modify — add 4 template exports |
