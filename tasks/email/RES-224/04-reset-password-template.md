# Task 04 — Reset-password email template + unit test

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** Task 01

---

## Goal

Create the `reset-password` React Email template as a standalone component and its unit test.

---

## Scope

### Create `packages/email/src/templates/reset-password.tsx`

- Export a `ResetPasswordEmail` function component.
- Accept `ResetPasswordProps` + the 3 optional layout props.
- Wrap content in `<BaseLayout>`.
- `previewText`: `"Restablece tu contraseña · expira el {expiresAt}"`.
- Body content:
  - `<Heading>` — `"Restablece tu contraseña"`.
  - `<Text>` — greeting with `userName`, expiry notice with `expiresAt`.
  - CTA `<Button href={resetUrl}>` — `"Restablecer contraseña"`.
  - Security note `<Text>` with `ipAddress` when provided: `"Solicitud desde: {ipAddress}"`.
  - Footer note: `"Si no solicitaste este cambio, ignora este correo."`.

### Create `packages/email/src/test/reset-password.spec.ts`

- Test cases:
  - Renders `userName`.
  - Renders `resetUrl` in the output.
  - Renders `expiresAt`.
  - Renders `ipAddress` when provided.
  - Does NOT render the IP block when `ipAddress` is omitted.
  - Produces a non-empty HTML string.

---

## Out of Scope

- Do not touch `template-registry.tsx` yet (task 07).

---

## Validation

```bash
pnpm --filter=@restopsiq/email test -- --testPathPattern=reset-password
```

---

## Files

| File                                              | Action |
| ------------------------------------------------- | ------ |
| `packages/email/src/templates/reset-password.tsx` | Create |
| `packages/email/src/test/reset-password.spec.ts`  | Create |
