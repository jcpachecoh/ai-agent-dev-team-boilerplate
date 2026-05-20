# Task: EMAIL-02 — BaseLayout + EmailService + ResendClient

**Linear:** RES-223  
**Parent:** RES-221 (Email Epic)  
**Depends on:** RES-222  
**Status:** Done  
**Estimate:** 5 points

---

## Goal

Implement the three core building blocks of the email package:

1. **`BaseLayout`** — the reusable, white-label React Email wrapper used by all templates
2. **`EmailService`** — the public API consumed by `apps/api`; enqueues all sends via BullMQ
3. **`ResendClient`** — thin Resend SDK wrapper for the future email worker

---

## Background

RES-222 created the package scaffold with stub exports. This task replaces the stub
`EmailService`, defines all shared types, implements the layout and service logic, and
establishes a placeholder routing layer (`template-registry`) that bridges the
`EmailTemplate` discriminated union to actual React elements.

---

## Scope

- `src/types.ts` — all exported interfaces, discriminated union, error classes
- `src/email.queue.ts` — queue and job name constants
- `src/templates/base-layout.tsx` — `BaseLayout` React Email component
- `src/templates/template-registry.tsx` — dispatch union → wrapped `ReactElement`
- `src/resend.client.ts` — `ResendClient` with typed `ResendError`
- `src/email.service.ts` — `EmailService` (BullMQ-only, never calls Resend)
- `src/index.ts` — updated public re-exports
- `src/test/` — unit tests for all three components
- `jest.config.js` — Jest configuration for the package

---

## Out of Scope

- Email worker implementation (RES-224)
- Real production-quality template bodies (EMAIL-03 through EMAIL-07)
- NestJS module wiring in `apps/api` (separate ticket)
- Redis connection changes in the API

---

## Proposed File Structure

```
packages/email/src/
├── types.ts                         ← all shared types/interfaces/errors
├── email.queue.ts                   ← EMAIL_QUEUE_NAME, EMAIL_JOB_NAME
├── email.service.ts                 ← EmailService class
├── resend.client.ts                 ← ResendClient class
├── templates/
│   ├── base-layout.tsx              ← BaseLayout component + RESTOPSIQ_LOGO_URL
│   └── template-registry.tsx       ← renderTemplateElement() dispatch function
├── test/
│   ├── base-layout.spec.ts
│   ├── email.service.spec.ts
│   └── resend.client.spec.ts
└── index.ts                         ← public exports
```

---

## BaseLayout Spec

**File:** `src/templates/base-layout.tsx`

### Props

```typescript
interface BaseLayoutProps {
  tenantName: string;
  tenantLogoUrl?: string;
  primaryColor?: string; // hex, default: '#E8943A'
  previewText: string; // visible in inbox before opening
  children: React.ReactNode;
}
```

### Behaviour

| Condition                | Expected                                             |
| ------------------------ | ---------------------------------------------------- |
| `tenantLogoUrl` provided | Render `<Img src={tenantLogoUrl} />`                 |
| `tenantLogoUrl` omitted  | Fall back to `RESTOPSIQ_LOGO_URL` constant           |
| `primaryColor` provided  | Apply to header background, footer link              |
| `primaryColor` omitted   | Default to `#E8943A`                                 |
| Always                   | Render `<Preview>{previewText}</Preview>`            |
| Always                   | Render footer with `tenantName` and unsubscribe link |

### Structure

```
Html (lang="es")
└── Head
└── Preview          ← previewText
└── Body             ← background #f4f4f5
    └── Container    ← max-width 600px, white bg
        ├── Section  ← header, backgroundColor = primaryColor
        │   └── Img  ← logoUrl
        ├── Section  ← content slot = {children}
        ├── Hr
        └── Section  ← footer
            ├── Text ← tenantName + address placeholder
            └── Text ← unsubscribe Link (styled with primaryColor)
```

### Constants

```typescript
export const RESTOPSIQ_LOGO_URL = 'https://placehold.co/180x44/E8943A/ffffff?text=RestOpsIQ';
```

The placeholder URL must be replaced with a real CDN URL once the CDN is configured.

---

## EmailService Spec

**File:** `src/email.service.ts`

### Constructor

```typescript
constructor(config: EmailServiceConfig)
```

`EmailServiceConfig`:

```typescript
{
  redisUrl: string;
  resendApiKey: string;
  from: string; // full format: "Name <email@domain.com>"
}
```

The constructor creates a `Queue<EmailJobPayload>` using `connection: { url: config.redisUrl }`.
BullMQ queue creation is lazy — no Redis connection is established in the constructor.

`defaultJobOptions`:

```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 1_000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
}
```

### `render(template, layoutProps): Promise<string>`

```typescript
async render(
  template: EmailTemplate,
  layoutProps: Omit<SendEmailOptions, 'to' | 'subject'>,
): Promise<string>
```

1. Calls `renderTemplateElement(template, layoutProps)` → `ReactElement`
2. Calls `renderAsync(element)` from `@react-email/render`
3. Returns the HTML string

### `send(options): Promise<{ jobId: string }>`

```typescript
async send(options: SendEmailOptions): Promise<{ jobId: string }>
```

**Invariants:**

- NEVER calls `Resend` SDK or `ResendClient`
- NEVER sends email synchronously
- Always enqueues a BullMQ job before returning

**Algorithm:**

1. `renderedHtml = await this.render(options.template, options)`
2. `payload: EmailJobPayload = { options, renderedHtml }`
3. `job = await this.queue.add(EMAIL_JOB_NAME, payload)`
4. If `queue.add` throws → re-throw as `EmailQueueError` (not `ResendError`)
5. Return `{ jobId: job.id ?? crypto.randomUUID() }`

### Error contract

| Error thrown                 | Scenario                                         |
| ---------------------------- | ------------------------------------------------ |
| `EmailQueueError`            | Redis unavailable; BullMQ `queue.add()` throws   |
| No error from `ResendClient` | `EmailService` never instantiates `ResendClient` |

---

## ResendClient Spec

**File:** `src/resend.client.ts`

### Purpose

Used exclusively by the **email worker** (RES-224). Not called from `EmailService.send()`.

### Constructor

```typescript
constructor(apiKey: string)
```

Instantiates the Resend SDK with the given API key.

### `sendEmail(payload): Promise<{ id: string }>`

```typescript
async sendEmail(payload: ResendSendPayload): Promise<{ id: string }>
```

`ResendSendPayload`:

```typescript
{
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}
```

**Algorithm:**

1. Call `resend.emails.send(payload)`
2. If `error` is present in response → log with `console.error`, throw `ResendError`
3. If `data.id` is absent → throw `ResendError('application_error', 500)`
4. Return `{ id: data.id }`

### `ResendError`

```typescript
class ResendError extends Error {
  code: string; // Resend error code key (e.g. 'rate_limit_exceeded')
  statusCode: number; // HTTP status derived from RESEND_STATUS_MAP
}
```

Worker can inspect `statusCode` to decide retry strategy:

- `429` → retry with increased delay
- `4xx` → do not retry (permanent failure)
- `5xx` → retry normally

---

## Template Registry Strategy

**File:** `src/templates/template-registry.tsx`

**Function:**

```typescript
function renderTemplateElement(
  template: EmailTemplate,
  layoutProps: { tenantName: string; tenantLogoUrl?: string; primaryColor?: string },
): ReactElement;
```

- Uses a `switch` over `template.type` (exhaustive discriminated union)
- Each case wraps its body in `<BaseLayout {...layoutProps} previewText={...}>`
- Placeholder stub bodies for all 7 types — replaced one-by-one in EMAIL-03..EMAIL-07
- Default case: `const _exhaustive: never = template; throw new Error(...)`

**Why a separate file?**
Decouples `EmailService.render()` from the template implementations. When EMAIL-03 adds
the real `welcome.tsx` component, only `template-registry.tsx` changes — not `email.service.ts`.

---

## Queue Strategy

- **Queue name:** `'email'` (constant `EMAIL_QUEUE_NAME`)
- **Job name:** `'send-email'` (constant `EMAIL_JOB_NAME`)
- **Job payload:** `{ options: SendEmailOptions; renderedHtml: string }`
- **Connection:** `{ url: redisUrl }` via BullMQ's `RedisOptions.url`
- **Retry:** 3 attempts, exponential backoff starting at 1 second
- **DLQ handling:** Configured in the worker (RES-224)

The `renderedHtml` is pre-rendered before enqueuing so the worker only needs to call
Resend — no React/JSX runtime required in the worker process.

---

## Error Handling Strategy

| Layer                      | Error                      | When                               |
| -------------------------- | -------------------------- | ---------------------------------- |
| `EmailService.render()`    | Propagates template errors | Malformed JSX, missing props       |
| `EmailService.send()`      | `EmailQueueError`          | Redis down, queue.add fails        |
| `ResendClient.sendEmail()` | `ResendError`              | Resend API error or no ID returned |

`EmailQueueError` and `ResendError` are separate classes so callers and the worker can
distinguish infrastructure failures (Redis) from provider failures (Resend).

---

## Testing Strategy

Tests live in `packages/email/src/test/`. Jest is configured via `jest.config.js` at the
package root, using `ts-jest` with `module: CommonJS` override (required because the
package tsconfig has `module: esnext` which Jest does not support).

Jest and ts-jest are available from the workspace root `node_modules` because
`.npmrc` sets `shamefully-hoist=true` — no new devDependencies required.

### Test files

| File                    | What it tests                                                     |
| ----------------------- | ----------------------------------------------------------------- |
| `base-layout.spec.ts`   | Logo fallback, primaryColor, previewText, footer, children        |
| `email.service.spec.ts` | send() returns jobId, enqueues job, does not call ResendClient    |
| `resend.client.spec.ts` | sendEmail() success, ResendError on SDK error, statusCode mapping |

### Mocking strategy

| Dependency                           | Mock approach                                                            |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `bullmq`                             | `jest.mock('bullmq')` — mock Queue constructor and `add()`               |
| `@react-email/render`                | `jest.mock('@react-email/render')` — mock `renderAsync` in service tests |
| `resend`                             | `jest.mock('resend')` — mock Resend constructor and `emails.send`        |
| `@react-email/render` (layout tests) | **Not mocked** — use real renderer to verify HTML output                 |

No Redis connection required. No real API keys. No network calls.

---

## Implementation Review

### Compliant items

- [x] `EmailService.send()` calls `queue.add()` only — never instantiates or calls `ResendClient`
- [x] `EmailService.render()` uses `renderAsync` from `@react-email/render`
- [x] `BaseLayout` applies `primaryColor` to header background and footer link
- [x] `BaseLayout` uses `tenantLogoUrl ?? RESTOPSIQ_LOGO_URL` fallback
- [x] `BaseLayout` renders `<Preview>` with `previewText`
- [x] `BaseLayout` renders footer with `tenantName` and unsubscribe link
- [x] `ResendClient` throws `ResendError` with `code` and `statusCode` when SDK returns error
- [x] All 7 template types covered in `template-registry.tsx` (stubs — valid HTML)
- [x] Exhaustive switch with `never` guard in template registry
- [x] All types exported from `src/index.ts`
- [x] No NestJS decorators — package is framework-agnostic
- [x] No circular imports between source files
- [x] `typecheck` passes with 0 errors
- [x] `build` produces CJS + ESM + DTS

### Gaps

- [ ] `jest.config.js` was not created before RES-223 was implemented (SDD gap — corrected here)
- [ ] Unit tests were not written before implementation (SDD gap — corrected here)
- [ ] `RESTOPSIQ_LOGO_URL` uses a placeholder CDN (`placehold.co`) — needs a real CDN URL
- [ ] `EmailServiceConfig.resendApiKey` and `from` are accepted by the constructor but not
      stored (intentional — worker uses `ResendClient` separately); this should be noted in a
      follow-up when the NestJS provider wiring is done

### Required fixes

None. All acceptance criteria pass.

### Optional improvements

- Bump `"react": "^18.0.0"` → `"^18.3.1"` to resolve the `react-dom` peer dep warning
- Add a `tsup` config file (`tsup.config.ts`) for more explicit bundle control
- Replace `placehold.co` fallback logo URL with a real CDN URL

---

## Acceptance Criteria

- [x] `emailService.send()` returns `{ jobId }` without calling Resend
- [x] `emailService.send()` enqueues a BullMQ job
- [x] Provider errors (`ResendError`) never originate from `EmailService.send()`
- [x] `emailService.render()` returns valid HTML for all 7 template types
- [x] Tenant primary color applied to header background + footer link
- [x] Tenant logo rendered when `tenantLogoUrl` provided
- [x] `RESTOPSIQ_LOGO_URL` used when `tenantLogoUrl` is absent
- [x] `EmailService`, `SendEmailOptions`, `EmailTemplate`, `EmailAttachment`,
      `BaseLayout`, `ResendClient`, `ResendError` exported from `@restopsiq/email`
- [x] `typecheck` passes with 0 errors
- [x] `build` produces CJS + ESM + DTS artifacts
- [x] Unit tests pass with no Redis/Resend/network required

---

## Validation Commands

```bash
# Type checking
pnpm --filter=@restopsiq/email typecheck

# Build
pnpm build --filter=@restopsiq/email

# Tests
pnpm --filter=@restopsiq/email test

# Test with coverage
pnpm --filter=@restopsiq/email test -- --coverage

# Turbo pipeline dry-run
pnpm turbo run build --filter=@restopsiq/email --dry-run

# Verify exported symbols
node -e "const e = require('./packages/email/dist/index.js'); console.log(Object.keys(e).sort())"

# Git check
git status --short
git diff --name-status
```

---

## Risks and Follow-ups

| Risk                                                                              | Severity | Follow-up                                                                                 |
| --------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `placehold.co` logo URL blocked by some email clients                             | Low      | Replace with real CDN URL when available                                                  |
| `react-dom` peer dep warning (18.3.1 vs 18.2.0)                                   | Low      | Bump `react` to `^18.3.1`                                                                 |
| Template stubs render placeholder text in real emails until EMAIL-03..07 complete | Medium   | Do not expose `EmailService` to production traffic until worker + real templates are done |
| Worker not yet implemented — `send()` enqueues but nothing processes the queue    | High     | RES-224 (EMAIL-03) must be completed before the email feature is usable end-to-end        |
