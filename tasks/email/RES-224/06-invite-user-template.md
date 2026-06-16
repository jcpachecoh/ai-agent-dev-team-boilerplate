# Task 06 — Invite-user template + unit test

**Parent:** RES-224  
**Status:** Pending  
**Depends on:** Task 01

---

## Goal

Create the `invite-user` React Email template as a standalone component and its unit test.

---

## Scope

### Create `packages/email/src/templates/invite-user.tsx`

- Export an `InviteUserEmail` function component.
- Accept `InviteUserProps` + the 3 optional layout props.
- Wrap content in `<BaseLayout>`.
- `previewText`: `"{inviterName} te invita a {workspaceName}"`.
- Body content:
  - `<Heading>` — `"Te han invitado a {workspaceName}"`.
  - `<Text>` — `"{inviterName} te ha invitado como {role}."`.
  - `<Text>` — greeting to `inviteeName`.
  - CTA `<Button href={acceptUrl}>` — `"Aceptar invitación"`.
  - Expiry `<Text>` — `"Invitación válida hasta: {expiresAt}"`.
  - Decline note `<Text>` — `"Si no esperabas esta invitación, puedes ignorar este correo."`.

### Create `packages/email/src/test/invite-user.spec.ts`

- Test cases:
  - Renders `inviteeName`.
  - Renders `inviterName`.
  - Renders `workspaceName`.
  - Renders `role`.
  - Renders `acceptUrl`.
  - Renders `expiresAt`.
  - Produces a non-empty HTML string.

---

## Out of Scope

- Do not touch `template-registry.tsx` yet (task 07).

---

## Validation

```bash
pnpm --filter=@restopsiq/email test -- --testPathPattern=invite-user
```

---

## Files

| File                                           | Action |
| ---------------------------------------------- | ------ |
| `packages/email/src/templates/invite-user.tsx` | Create |
| `packages/email/src/test/invite-user.spec.ts`  | Create |
