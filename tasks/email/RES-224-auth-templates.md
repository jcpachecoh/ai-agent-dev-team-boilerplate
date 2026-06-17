# Task: EMAIL-03 — Auth Email Templates

**Linear:** RES-224  
**Parent:** RES-221 (Email Epic)  
**Depends on:** RES-223  
**Status:** Pending  
**Estimate:** 5 points

---

## Goal

Implement the 4 auth-related email templates as real React Email components:

1. `welcome.tsx` — sent when a user account is created or first invited
2. `reset-password.tsx` — sent when a password reset is requested
3. `verify-email.tsx` — sent to deliver an OTP for email verification
4. `invite-user.tsx` — sent when an owner invites a collaborator to a workspace

---

## Background

RES-223 established the full email package infrastructure:

- `BaseLayout` (`src/templates/base-layout.tsx`) is the white-label wrapper used by all templates.
- `EmailService.render()` calls `renderTemplateElement()` from `template-registry.tsx`, which dispatches on the `EmailTemplate` discriminated union and returns a `ReactElement`.
- All 7 template types already exist as **inline stubs** inside `template-registry.tsx`. They render minimal copy using the RES-223 prop shapes.

RES-224 replaces the 4 auth stubs with real, standalone `.tsx` files that contain the full copy, conditional blocks, and CTAs specified in the ticket. The non-auth stubs (`dian-invoice`, `stock-alert`, `shift-summary`) are left unchanged for future subtasks.

---

## Scope

| File                                                 | Action     | Reason                                                  |
| ---------------------------------------------------- | ---------- | ------------------------------------------------------- |
| `packages/email/src/types.ts`                        | **Modify** | Update 4 auth prop interfaces to match ticket contracts |
| `packages/email/src/templates/welcome.tsx`           | **Create** | Standalone `WelcomeEmail` component                     |
| `packages/email/src/templates/reset-password.tsx`    | **Create** | Standalone `ResetPasswordEmail` component               |
| `packages/email/src/templates/verify-email.tsx`      | **Create** | Standalone `VerifyEmailEmail` component                 |
| `packages/email/src/templates/invite-user.tsx`       | **Create** | Standalone `InviteUserEmail` component                  |
| `packages/email/src/templates/template-registry.tsx` | **Modify** | Delegate 4 auth cases to new components                 |
| `packages/email/src/test/email.service.spec.ts`      | **Modify** | Fix fixture props to compile after interface changes    |
| `packages/email/src/test/welcome.spec.ts`            | **Create** | Unit tests for `WelcomeEmail`                           |
| `packages/email/src/test/reset-password.spec.ts`     | **Create** | Unit tests for `ResetPasswordEmail`                     |
| `packages/email/src/test/verify-email.spec.ts`       | **Create** | Unit tests for `VerifyEmailEmail`                       |
| `packages/email/src/test/invite-user.spec.ts`        | **Create** | Unit tests for `InviteUserEmail`                        |

---

## Out of Scope

- Email worker implementation (future ticket)
- Resend SDK calls or any real email delivery
- API integration (`apps/api`) — no NestJS wiring
- Database or Prisma changes
- BullMQ queue behavior — `EmailService.send()` is not modified
- Non-auth templates (`dian-invoice`, `stock-alert`, `shift-summary`)
- Any real network calls in tests
- Dependency additions or lockfile changes
- Changes to `turbo.json`, `jest.config.js`, `tsconfig.json`, or `package.json`

---

## Template Contracts

### 1. `WelcomeProps`

```typescript
interface WelcomeProps {
  userName: string;
  role: 'owner' | 'manager' | 'cashier' | 'accountant';
  loginUrl: string;
  temporaryPassword?: string;
}
```

### 2. `ResetPasswordProps`

```typescript
interface ResetPasswordProps {
  userName: string;
  resetUrl: string;
  expiresAt: string; // human-readable, e.g. "hoy a las 4:30 p.m."
  ipAddress?: string;
}
```

### 3. `VerifyEmailProps`

```typescript
interface VerifyEmailProps {
  userName: string;
  otpCode: string;
  expiresInMinutes: number;
}
```

### 4. `InviteUserProps`

```typescript
interface InviteUserProps {
  inviteeName: string;
  inviterName: string;
  role: string;
  workspaceName: string;
  acceptUrl: string;
  expiresAt: string; // human-readable, e.g. "en 48 horas"
}
```

---

## Migration: Current Stubs → New Interfaces

The current stub interfaces in `types.ts` differ from the ticket contracts. The table below documents every renamed or added field to ensure `email.service.spec.ts` fixtures are updated atomically.

| Interface            | Current field              | New field           | Change                                  |
| -------------------- | -------------------------- | ------------------- | --------------------------------------- |
| `WelcomeProps`       | `firstName`                | `userName`          | Rename                                  |
| `WelcomeProps`       | `tenantName`               | _(removed)_         | Removed — comes from `SendEmailOptions` |
| `WelcomeProps`       | _(absent)_                 | `role`              | Added (required union)                  |
| `WelcomeProps`       | _(absent)_                 | `temporaryPassword` | Added (optional)                        |
| `ResetPasswordProps` | `firstName`                | `userName`          | Rename                                  |
| `ResetPasswordProps` | `expiresInMinutes: number` | `expiresAt: string` | Renamed + type change                   |
| `ResetPasswordProps` | _(absent)_                 | `ipAddress`         | Added (optional)                        |
| `VerifyEmailProps`   | `firstName`                | `userName`          | Rename                                  |
| `VerifyEmailProps`   | `otp`                      | `otpCode`           | Rename                                  |
| `InviteUserProps`    | `inviterName`              | `inviterName`       | Unchanged                               |
| `InviteUserProps`    | `tenantName`               | `workspaceName`     | Rename                                  |
| `InviteUserProps`    | `inviteUrl`                | `acceptUrl`         | Rename                                  |
| `InviteUserProps`    | `role`                     | `role`              | Unchanged                               |
| `InviteUserProps`    | _(absent)_                 | `inviteeName`       | Added (required)                        |
| `InviteUserProps`    | _(absent)_                 | `expiresAt`         | Added (required)                        |

`DianInvoiceProps`, `StockAlertProps`, and `ShiftSummaryProps` are **not changed**.

---

## Copy Guidelines

- **Language:** Colombian Spanish throughout. No exceptions.
- **Tone:** Friendly but operational. Avoid marketing language.
- **Anglicisms:** Avoid unless the product UI already uses the term. Use "contraseña" not "password", "correo" not "email", "código" not "OTP" in user-facing text.
- **"Workspace":** The product uses this term in the UI. In emails use "espacio de trabajo" on first mention, with "workspace" acceptable in parenthetical if needed for clarity.
- **Security emails** (`reset-password`, `verify-email`): Tone must be calm, direct, and reassuring. No alarming language. Keep the ignore/no-action instruction clearly visible.
- **Role labels in welcome:** Use Spanish terms in the copy (e.g. `owner` → "propietario/a", `manager` → "administrador/a", `cashier` → "cajero/a", `accountant` → "contador/a").

---

## Design and Layout Guidelines

- Every template **must** use `BaseLayout` as the outer wrapper.
- `BaseLayout` already handles logo fallback, header bar, footer, and unsubscribe link. Templates must not duplicate these elements.
- **CTA buttons** must use the `primaryColor` from `layoutProps` as `backgroundColor`.
- **Links** (non-CTA) use `primaryColor` as text color and `textDecoration: underline`.
- Inline styles only — no CSS classes, no external stylesheets.
- Typography: consistent with existing `template-registry.tsx` style constants (24px heading, 16px body, 12px footer).
- Spacing: `margin: '0 0 12px 0'` for body text, `margin: '24px 0'` for CTA sections.
- OTP code: `fontSize: '36px'`, `fontWeight: '700'`, `letterSpacing: '8px'`, `textAlign: 'center'`, color = `primaryColor`.
- Keep max email width at 600px (enforced by `BaseLayout`'s `Container`).

---

## Template-Specific Content

### `welcome.tsx`

```
PreviewText: "Bienvenido a {tenantName}. Ya puedes acceder a tu espacio de trabajo."
```

Content blocks (in order):

1. **Heading:** `"¡Bienvenido/a, {userName}!"`
2. **Role description paragraph:** one sentence describing the role's main responsibility in the product. Content by role:
   - `owner` → "Como propietario/a, tienes acceso completo al sistema: ventas, inventario, reportes y configuración de tu espacio de trabajo."
   - `manager` → "Como administrador/a, puedes gestionar turnos, inventario, reportes y el equipo de tu espacio de trabajo."
   - `cashier` → "Como cajero/a, puedes registrar ventas, gestionar pedidos y consultar el menú de tu espacio de trabajo."
   - `accountant` → "Como contador/a, tienes acceso a los reportes financieros, facturación DIAN y cierres de turno de tu espacio de trabajo."
3. **CTA button:** `"Acceder a mi espacio de trabajo"` → href = `loginUrl`
4. **First steps section (heading "Primeros pasos"):** bullet list of 2–3 tips that vary by role:
   - `owner` → Configura tu perfil de negocio · Invita a tu equipo · Explora los reportes
   - `manager` → Revisa el inventario actual · Configura los turnos · Consulta los reportes
   - `cashier` → Verifica el menú del día · Abre tu turno · Registra tu primera venta
   - `accountant` → Revisa los cierres de turno pendientes · Descarga el primer reporte · Configura tu perfil
5. **Temporary password block** (render only if `temporaryPassword` is provided):
   - Text: "Tu contraseña temporal es:"
   - Password displayed in monospace, bold
   - Warning: "Te recomendamos cambiarla después de tu primer acceso."

### `reset-password.tsx`

```
PreviewText: "Recibimos una solicitud para restablecer tu contraseña."
```

Content blocks (in order):

1. **Heading:** `"Restablece tu contraseña"`
2. **Intro paragraph:** `"Hola {userName}, recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, usa el botón a continuación."`
3. **CTA button:** `"Restablecer contraseña"` → href = `resetUrl`
4. **Expiration notice:** `"Este enlace expira el {expiresAt}."`
5. **IP block** (render only if `ipAddress` is provided):
   - `"Esta solicitud fue realizada desde la dirección IP: {ipAddress}."`
6. **Ignore instruction** (always rendered):
   - `"Si no solicitaste restablecer tu contraseña, ignora este correo. Tu cuenta permanece segura."`

### `verify-email.tsx`

```
PreviewText: "Usa este código para verificar tu correo en {tenantName}."
```

Content blocks (in order):

1. **Heading:** `"Verifica tu correo electrónico"`
2. **Intro paragraph:** `"Hola {userName}, usa el siguiente código para verificar tu correo:"`
3. **OTP display:** large monospace text — `otpCode` — styled with `primaryColor`
4. **Expiration:** `"Este código expira en {expiresInMinutes} minutos."`
5. **Do-not-share warning:** `"Por tu seguridad, nunca compartas este código con nadie. RestOpsIQ jamás te pedirá este código por teléfono o chat."`

### `invite-user.tsx`

```
PreviewText: "{inviterName} te invitó a colaborar en {workspaceName}."
```

Content blocks (in order):

1. **Heading:** `"Tienes una invitación"`
2. **Invite description:** `"{inviterName} te ha invitado a unirte a {workspaceName} como {role}."`
3. **CTA button:** `"Aceptar invitación"` → href = `acceptUrl`
4. **Expiration notice:** `"Esta invitación vence el {expiresAt}."`
5. **Footer note:** `"Si no esperabas esta invitación, puedes ignorar este correo de manera segura."`

---

## PreviewText Strategy

`previewText` is passed to `BaseLayout` as a required prop. Each template constructs it dynamically using its own props:

| Template         | previewText                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `welcome`        | `"Bienvenido a {tenantName}. Ya puedes acceder a tu espacio de trabajo."` |
| `reset-password` | `"Recibimos una solicitud para restablecer tu contraseña."`               |
| `verify-email`   | `"Usa este código para verificar tu correo en {tenantName}."`             |
| `invite-user`    | `"{inviterName} te invitó a colaborar en {workspaceName}."`               |

`tenantName` for `welcome` and `verify-email` is not in their props — it comes from `layoutProps.tenantName` passed by the registry. Templates receive branding props alongside their own props.

---

## Template Component API

Each template file exports:

1. **Named component** — used by `template-registry.tsx` and tests:

```typescript
export function WelcomeEmail(props: WelcomeProps & LayoutProps): ReactElement;
```

where `LayoutProps` = `{ tenantName: string; tenantLogoUrl?: string; primaryColor?: string }`.

2. **Default export** — required by the React Email preview server (`email dev --dir src/templates`):

```typescript
export default function WelcomeEmailPreview(): ReactElement {
  return (
    <WelcomeEmail
      userName="Ana García"
      role="owner"
      loginUrl="https://app.restopsiq.co/login"
      tenantName="Burger Palace"
      primaryColor="#E8943A"
    />
  );
}
```

The default export must use realistic sample data that exercises all conditional blocks (e.g. provide `temporaryPassword` in the welcome preview, provide `ipAddress` in the reset-password preview).

---

## Template Registry Strategy

`template-registry.tsx` is updated to delegate the 4 auth cases to their new components:

```typescript
// Before (stub)
case 'welcome':
  return (
    <BaseLayout {...layoutProps} previewText={`Bienvenido a ${template.props.tenantName}`}>
      <Heading>¡Bienvenido, {template.props.firstName}!</Heading>
      ...
    </BaseLayout>
  );

// After (delegation)
case 'welcome':
  return <WelcomeEmail {...template.props} {...layoutProps} />;
```

Rules:

- The `dian-invoice`, `stock-alert`, and `shift-summary` cases remain as-is (inline stubs).
- `renderTemplateElement()` signature does **not** change.
- `EmailService.render()` is **not** touched.
- The `LayoutProps` interface inside `template-registry.tsx` does not change.

---

## Testing Strategy

Tests live in `packages/email/src/test/`. All tests use:

- `@react-email/render`'s synchronous `render()` (not `renderAsync`) — avoids `--experimental-vm-modules`.
- `createElement` from `react` for constructing elements in tests.
- No mocks of `BaseLayout` or React Email components — tests verify real HTML output.
- No Redis, no Resend SDK, no network calls.

### `welcome.spec.ts`

| Test                                                  | Assertion                                     |
| ----------------------------------------------------- | --------------------------------------------- |
| renders personalized greeting                         | output contains `userName`                    |
| renders CTA with correct href                         | output contains `loginUrl`                    |
| renders owner role description                        | output contains "propietario"                 |
| renders manager role description                      | output contains "administrador"               |
| renders cashier role description                      | output contains "cajero"                      |
| renders accountant role description                   | output contains "contador"                    |
| renders owner first-step tips                         | output contains "Configura tu perfil"         |
| renders temporary password block when provided        | output contains `temporaryPassword` value     |
| does NOT render password block when omitted           | output does not contain "contraseña temporal" |
| applies primaryColor to CTA button                    | output contains the color value               |
| renders with fallback logo when tenantLogoUrl omitted | output contains `RESTOPSIQ_LOGO_URL`          |
| renders with tenantLogoUrl when provided              | output contains the provided logo URL         |

### `reset-password.spec.ts`

| Test                                            | Assertion                                  |
| ----------------------------------------------- | ------------------------------------------ |
| renders heading                                 | output contains "Restablece tu contraseña" |
| renders CTA with correct href                   | output contains `resetUrl`                 |
| renders `userName` in intro                     | output contains `userName`                 |
| renders expiration text                         | output contains `expiresAt`                |
| renders IP block when ipAddress provided        | output contains `ipAddress`                |
| does NOT render IP block when ipAddress omitted | output does not contain "dirección IP"     |
| renders ignore instruction always               | output contains "ignora este correo"       |
| applies primaryColor to CTA                     | output contains color value                |

### `verify-email.spec.ts`

| Test                                | Assertion                          |
| ----------------------------------- | ---------------------------------- |
| renders OTP code                    | output contains `otpCode`          |
| renders `userName`                  | output contains `userName`         |
| renders expiration copy             | output contains `expiresInMinutes` |
| renders do-not-share warning        | output contains "nunca compartas"  |
| applies primaryColor to OTP display | output contains color value        |

### `invite-user.spec.ts`

| Test                          | Assertion                             |
| ----------------------------- | ------------------------------------- |
| renders inviteeName           | output contains `inviteeName`         |
| renders inviterName           | output contains `inviterName`         |
| renders workspaceName         | output contains `workspaceName`       |
| renders assigned role         | output contains `role`                |
| renders CTA with correct href | output contains `acceptUrl`           |
| renders expiration notice     | output contains `expiresAt`           |
| renders ignore instruction    | output contains "ignorar este correo" |
| applies primaryColor to CTA   | output contains color value           |

### `email.service.spec.ts` (existing file — fixture updates only)

The fixture `welcomeOptions` currently uses old prop shapes that will no longer compile after `types.ts` is updated. The following fixture lines must be updated:

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

The inline `types` array in `EmailService.render()` "produces a string for each template type" test must also be updated to use the new prop shapes for all 4 auth types.

No new test cases are added to `email.service.spec.ts` — only fixture corrections.

---

## Acceptance Criteria

- [ ] All 4 auth templates render without errors via `emailService.render()`
- [ ] All 4 templates appear in the React Email preview server (`pnpm --filter=@restopsiq/email preview`)
- [ ] CTA links are rendered as buttons using the tenant primary color
- [ ] All templates have descriptive `previewText` in Colombian Spanish
- [ ] Temporary password block renders only when `temporaryPassword` is provided
- [ ] IP address block renders only when `ipAddress` is provided
- [ ] Ignore instruction is always present in `reset-password`
- [ ] Do-not-share warning is always present in `verify-email`
- [ ] Role descriptions and first-step tips in `welcome` match the role value
- [ ] `email.service.spec.ts` passes without changes to its test assertions
- [ ] All new spec files pass with 0 failures
- [ ] `pnpm --filter=@restopsiq/email typecheck` exits 0
- [ ] `pnpm build --filter=@restopsiq/email` exits 0
- [ ] Non-auth template stubs remain functional (registry `default` case does not throw)

---

## Risks and Follow-ups

| Risk                                                                                                                      | Severity | Follow-up                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------- |
| `email.service.spec.ts` fixture uses old prop shapes — will fail to compile after `types.ts` change                       | High     | Update fixture in the same commit as the type change                  |
| "workspace" vs "espacio de trabajo" — product copy is not finalized                                                       | Medium   | Use "espacio de trabajo" in emails; review with product before launch |
| Non-auth stubs still render minimal copy in production until EMAIL-04..07                                                 | Low      | Do not expose to production until remaining templates are implemented |
| Default export required by React Email preview — missing default silently hides the template                              | Low      | Validate with `pnpm --filter=@restopsiq/email preview` before merging |
| `WelcomeProps.tenantName` was removed — any consumers outside this package using the old field will break at compile time | Medium   | Search codebase for `type: 'welcome'` usages before merging           |

---

## Validation Commands

```bash
# Run all email package tests
pnpm --filter=@restopsiq/email test

# Type-check the email package
pnpm --filter=@restopsiq/email typecheck

# Build the email package
pnpm build --filter=@restopsiq/email

# Launch React Email preview — verify all 4 auth templates appear in sidebar
pnpm --filter=@restopsiq/email preview

# Confirm no unexpected files were changed
git status --short
git diff --name-status
```
