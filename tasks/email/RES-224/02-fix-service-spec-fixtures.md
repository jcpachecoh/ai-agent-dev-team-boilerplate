# Task 02 — Fix email.service.spec.ts fixtures after type change

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** Task 01 (types updated)

---

## Goal

After task 01 updates the interfaces, `email.service.spec.ts` will fail to compile because its fixtures use the old prop field names. Fix only the fixture data — no new tests, no logic changes.

---

## Scope

Modify **only** `packages/email/src/test/email.service.spec.ts`.

### Changes required

**`welcomeOptions` fixture** — replace old `WelcomeProps` fields:

```typescript
// Before
template: {
  type: 'welcome',
  props: { firstName: 'Alice', tenantName: 'Burger Palace', loginUrl: '...' },
}

// After
template: {
  type: 'welcome',
  props: { userName: 'Alice', role: 'owner', loginUrl: '...' },
}
```

**`types` array in "produces a string for each template type" test** — fix all 4 auth entries:

```typescript
// welcome
{ type: 'welcome', props: { userName: 'A', role: 'owner', loginUrl: 'u' } }

// reset-password
{ type: 'reset-password', props: { userName: 'A', resetUrl: 'u', expiresAt: 'mañana' } }

// verify-email
{ type: 'verify-email', props: { userName: 'A', otpCode: '123456', expiresInMinutes: 15 } }

// invite-user
{
  type: 'invite-user',
  props: { inviteeName: 'B', inviterName: 'C', workspaceName: 'T', acceptUrl: 'u', role: 'manager', expiresAt: 'en 48 horas' },
}
```

Leave `dian-invoice`, `stock-alert`, `shift-summary` entries unchanged.

---

## Out of Scope

- No new test cases
- No logic changes
- No other files

---

## Validation

```bash
pnpm --filter=@restopsiq/email typecheck
```

After this task, typecheck will still fail on `template-registry.tsx` (old fields). That is expected. The spec file itself must compile.

```bash
pnpm --filter=@restopsiq/email test -- --testPathPattern=email.service
```

Expected: all existing tests pass (renderAsync is mocked, so no real rendering happens).

---

## Files

| File                                            | Action                              |
| ----------------------------------------------- | ----------------------------------- |
| `packages/email/src/test/email.service.spec.ts` | Modify — fix 4 auth fixture objects |
