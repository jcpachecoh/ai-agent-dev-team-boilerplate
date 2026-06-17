# Task 05 — Verify-email template + unit test

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** Task 01

---

## Goal

Create the `verify-email` React Email template as a standalone component and its unit test.

---

## Scope

### Create `packages/email/src/templates/verify-email.tsx`

- Export a `VerifyEmailEmail` function component.
- Accept `VerifyEmailProps` + the 3 optional layout props.
- Wrap content in `<BaseLayout>`.
- `previewText`: `"Tu código de verificación es {otpCode}"`.
- Body content:
  - `<Heading>` — `"Verifica tu correo electrónico"`.
  - `<Text>` — greeting with `userName`.
  - OTP code block — large `<Text>` styled with `letter-spacing: 8px` and the tenant's `primaryColor` (default `#E8943A`).
  - Expiry `<Text>` — `"El código expira en {expiresInMinutes} minutos."`.
  - Tip `<Text>` — `"Si no solicitaste la verificación, ignora este correo."`.

### Create `packages/email/src/test/verify-email.spec.ts`

- Test cases:
  - Renders `userName`.
  - Renders `otpCode` visibly in the output.
  - Renders `expiresInMinutes`.
  - Applies `primaryColor` to the OTP element when provided.
  - Uses default color `#E8943A` when `primaryColor` is omitted.
  - Produces a non-empty HTML string.

---

## Out of Scope

- Do not touch `template-registry.tsx` yet (task 07).

---

## Validation

```bash
pnpm --filter=@restopsiq/email test -- --testPathPattern=verify-email
```

---

## Files

| File                                            | Action |
| ----------------------------------------------- | ------ |
| `packages/email/src/templates/verify-email.tsx` | Create |
| `packages/email/src/test/verify-email.spec.ts`  | Create |
