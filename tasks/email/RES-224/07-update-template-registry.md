# Task 07 — Update template-registry.tsx to delegate to new components

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** Tasks 03, 04, 05, 06 (all 4 template files exist)

---

## Goal

Replace the inline JSX stubs in `template-registry.tsx` for the 4 auth cases with imports and delegation to the new standalone components. This makes `renderTemplateElement` a thin dispatcher.

---

## Scope

Modify **only** `packages/email/src/templates/template-registry.tsx`.

### Changes

1. Add 4 imports at the top:

```typescript
import { WelcomeEmail } from './welcome';
import { ResetPasswordEmail } from './reset-password';
import { VerifyEmailEmail } from './verify-email';
import { InviteUserEmail } from './invite-user';
```

2. Replace each inline JSX block in the switch statement with a call to the imported component, passing the correct props:

```typescript
case 'welcome':
  return (
    <WelcomeEmail
      {...template.props}
      tenantName={layoutProps.tenantName}
      tenantLogoUrl={layoutProps.tenantLogoUrl}
      primaryColor={color}
    />
  );
```

Apply the same delegation pattern for `reset-password`, `verify-email`, and `invite-user`.

3. Remove the now-unused `Heading`, `Text`, `Button`, `Section`, and `ctaStyle` / `headingStyle` / `textStyle` local definitions **only if they are no longer used** by the remaining non-auth cases (`dian-invoice`, `stock-alert`, `shift-summary`). Keep anything still needed.

---

## Out of Scope

- Do not modify the non-auth cases (`dian-invoice`, `stock-alert`, `shift-summary`).
- Do not modify `index.ts` yet (task 08).

---

## Validation

```bash
pnpm --filter=@restopsiq/email typecheck
```

Expected: zero type errors.

```bash
pnpm --filter=@restopsiq/email test
```

Expected: all existing tests pass, including `email.service.spec.ts` (uses `renderAsync` mock, so no real rendering in those tests).

---

## Files

| File                                                 | Action                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `packages/email/src/templates/template-registry.tsx` | Modify — replace 4 inline JSX blocks with component delegation |
