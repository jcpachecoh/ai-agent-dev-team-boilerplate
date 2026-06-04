# Task 03 — Welcome email template + unit test

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** Task 01

---

## Goal

Create the `welcome` React Email template as a standalone component and its unit test.

---

## Scope

### Create `packages/email/src/templates/welcome.tsx`

- Export a `WelcomeEmail` function component.
- Accept `WelcomeProps` + the 3 optional layout props (`tenantName`, `tenantLogoUrl`, `primaryColor`).
- Wrap content in `<BaseLayout>`.
- `previewText`: `"Tu cuenta en {tenantName} está lista"`.
- Body content:
  - `<Heading>` — `"¡Bienvenido, {userName}!"`.
  - `<Text>` — role badge and tenant intro sentence.
  - CTA `<Button href={loginUrl}>` — `"Iniciar sesión"`.
  - Conditional `<Text>` for `temporaryPassword` (only render if present): `"Tu contraseña temporal es: {temporaryPassword}"`.
- Use the color utilities from `BaseLayout`; accept `primaryColor` as prop.

### Create `packages/email/src/test/welcome.spec.ts`

Follow the same pattern as `base-layout.spec.ts`:

- Use synchronous `render` from `@react-email/render`.
- Do NOT mock `@react-email/render`.
- Test cases:
  - Renders `userName` in the output.
  - Renders the `loginUrl` in the output.
  - Renders `tenantName` in the output.
  - Renders `temporaryPassword` when provided.
  - Does NOT render a `temporaryPassword` block when omitted.
  - Has `role` text in the output.
  - Produces a non-empty HTML string.

---

## Out of Scope

- Do not touch `template-registry.tsx` yet (task 07).
- Do not modify `index.ts` yet (task 08).

---

## Validation

```bash
pnpm --filter=@restopsiq/email test -- --testPathPattern=welcome
```

Expected: all tests pass.

---

## Files

| File                                       | Action |
| ------------------------------------------ | ------ |
| `packages/email/src/templates/welcome.tsx` | Create |
| `packages/email/src/test/welcome.spec.ts`  | Create |
