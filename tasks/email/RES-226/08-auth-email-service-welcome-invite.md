# RES-226 Task 08 — AuthEmailService: Welcome and Invitation Flows

## Goal

Implement `AuthEmailService.sendWelcome()` and `AuthEmailService.sendInvitation()`.
`sendWelcome` is a simple dispatch with no token. `sendInvitation` generates an invite token,
stores it in Redis (TTL 172800s), and dispatches the invite email.

**Depends on:** Task 02 (API dep), Task 03 (EmailModule), Task 04 (interfaces), Task 07
(Redis client already set up in `AuthEmailService`).

---

## Scope

- Add `sendWelcome()` to `apps/api/src/auth/service/auth-email.service.ts`.
- Add `sendInvitation()` to `apps/api/src/auth/service/auth-email.service.ts`.
- Remove the placeholder stub implementations from Task 06.
- Extend `apps/api/src/auth/test/auth-email.service.spec.ts` with welcome and invitation tests.

---

## Out of scope

- Controller endpoints (Task 09).
- Module wiring (Task 10).
- Invitation acceptance endpoint (`POST /auth/accept-invite`) — out of RES-226 scope.
- Any UI redirect logic.

---

## Files allowed

- `apps/api/src/auth/service/auth-email.service.ts` — replace stub methods with real implementations
- `apps/api/src/auth/test/auth-email.service.spec.ts` — add welcome and invitation tests

---

## Files forbidden

- `auth.interfaces.ts` — no new interface changes needed in this task
- `auth.module.ts` (wiring is Task 10)
- `auth.controller.ts` (endpoints are Task 09)
- Any file in `packages/`
- `schema.prisma`

---

## Implementation notes

### sendWelcome()

```typescript
async sendWelcome(
  user: { email: string; name: string; role: string },
  tenant: TenantContext,
  temporaryPassword?: string,
): Promise<void> {
  const loginUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/login`;

  await this.emailService.send({
    to: user.email,
    subject: `Bienvenido a ${tenant.tenantName}`,
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    tenantLogoUrl: tenant.tenantLogoUrl,
    primaryColor: tenant.primaryColor,
    template: {
      type: 'welcome',
      props: {
        userName: user.name,
        role: user.role as WelcomeProps['role'],
        loginUrl,
        temporaryPassword,
      },
    },
  });
}
```

Note: `user.role` is cast to `WelcomeProps['role']`. The caller is responsible for passing a
valid role value. No runtime validation needed in the service layer for this ticket.

### sendInvitation()

```typescript
const INVITE_TOKEN_TTL_SECONDS = 172_800; // 48 hours

async sendInvitation(
  invitee: { email: string; name: string },
  inviter: { name: string },
  tenant: TenantContext,
  role: string,
  workspaceName: string,
): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await this.redis.set(`invite:${rawToken}`, invitee.email, 'EX', INVITE_TOKEN_TTL_SECONDS);

  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_SECONDS * 1000);
  const expiresAtFormatted = expiresAt.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
  const acceptUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/auth/accept-invite?token=${rawToken}`;

  await this.emailService.send({
    to: invitee.email,
    subject: `Invitación a ${workspaceName}`,
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    tenantLogoUrl: tenant.tenantLogoUrl,
    primaryColor: tenant.primaryColor,
    template: {
      type: 'invite-user',
      props: {
        inviteeName: invitee.name,
        inviterName: inviter.name,
        role,
        workspaceName,
        acceptUrl,
        expiresAt: expiresAtFormatted,
      },
    },
  });
}
```

### Minimum tests

**sendWelcome:**

- Calls `emailService.send` with `type: 'welcome'`.
- Passes `userName`, `role`, `loginUrl` to template props.
- Passes optional `temporaryPassword` when provided.
- Does not pass `temporaryPassword` when not provided.

**sendInvitation:**

- Stores invite token in Redis with key `invite:{token}` and TTL 172800s.
- Calls `emailService.send` with `type: 'invite-user'`.
- Passes correct `inviteeName`, `inviterName`, `role`, `workspaceName`, `acceptUrl`, `expiresAt`.

---

## Acceptance criteria

- [ ] `sendWelcome()` dispatches welcome email via `emailService.send`.
- [ ] `sendInvitation()` stores invite token in Redis with TTL 172800s.
- [ ] `sendInvitation()` dispatches invite email via `emailService.send`.
- [ ] Placeholder stubs from Task 06 are removed.
- [ ] All welcome and invitation tests pass.
- [ ] `pnpm --filter=@restopsiq/api typecheck` passes.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=auth-email.service
```
