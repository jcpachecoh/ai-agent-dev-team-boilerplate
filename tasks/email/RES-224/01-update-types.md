# Task 01 — Update auth prop interfaces in types.ts

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** RES-223 (done)

---

## Goal

Replace the 4 stub auth interfaces in `packages/email/src/types.ts` with the final contracts defined in RES-224. This is the prerequisite for all template files.

---

## Scope

Modify **only** `packages/email/src/types.ts`.

Replace these 4 interfaces:

```typescript
// WelcomeProps
interface WelcomeProps {
  userName: string;
  role: 'owner' | 'manager' | 'cashier' | 'accountant';
  loginUrl: string;
  temporaryPassword?: string;
}

// ResetPasswordProps
interface ResetPasswordProps {
  userName: string;
  resetUrl: string;
  expiresAt: string;
  ipAddress?: string;
}

// VerifyEmailProps
interface VerifyEmailProps {
  userName: string;
  otpCode: string;
  expiresInMinutes: number;
}

// InviteUserProps
interface InviteUserProps {
  inviteeName: string;
  inviterName: string;
  role: string;
  workspaceName: string;
  acceptUrl: string;
  expiresAt: string;
}
```

Do not touch `DianInvoiceProps`, `StockAlertProps`, `ShiftSummaryProps`, or any other type.

---

## Out of Scope

- No template files
- No registry changes
- No test changes yet

---

## Validation

```bash
pnpm --filter=@restopsiq/email typecheck
```

Expected: typecheck fails on `template-registry.tsx` (it still uses old fields like `firstName`, `tenantName`, `otp`, `inviteUrl`). This is expected and will be fixed in task 02 and 07. The types file itself must compile cleanly in isolation.

---

## Files

| File                          | Action                            |
| ----------------------------- | --------------------------------- |
| `packages/email/src/types.ts` | Modify — update 4 auth interfaces |
