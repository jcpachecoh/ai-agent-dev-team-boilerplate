# Epic: Email Module — packages/email with Resend + React Email + BullMQ

**Linear:** RES-221  
**Status:** In Progress  
**Priority:** Urgent  
**Estimate:** 34 points

---

## Goal

Build a reusable, framework-agnostic email package at `packages/email` that handles all
transactional email needs of the platform. The package is imported by `apps/api` (and future
`services/gateway`) and never sends email synchronously from the HTTP request path.

---

## Design Principles

### 1. Single provider — Resend

Resend is the only email delivery provider. There is no multi-provider abstraction layer.
If the provider changes in the future, the `ResendClient` wrapper is the only file that changes.

### 2. React Email templates — no raw HTML strings

All email templates are typed React components that live in `src/templates/`. The HTML is
generated server-side with `@react-email/render`. No hand-written HTML strings anywhere in
the package.

### 3. Queue-first — BullMQ, never synchronous sends

Every call to `EmailService.send()` enqueues a BullMQ job and returns a `jobId` immediately.
Resend is never contacted from within the HTTP request pipeline. The email worker (a separate
process) dequeues jobs and calls Resend.

### 4. Multi-tenant awareness

Every email job carries a `tenantId` for traceability, per-tenant rate limiting, and audit.
Every rendered template receives `tenantName`, `tenantLogoUrl`, and `primaryColor` so that
emails can be white-labeled per tenant.

### 5. Retry policy belongs to the queue/worker flow

Retry logic (3x exponential backoff) is configured on the BullMQ queue's `defaultJobOptions`.
`EmailService.send()` itself does not retry — it only enqueues. A Dead Letter Queue (DLQ) with
a Slack alert is the responsibility of the worker (EMAIL-03).

### 6. White-label layout support

`BaseLayout` wraps every template. It accepts `tenantLogoUrl` (optional), `primaryColor`
(optional, default `#E8943A`), `tenantName`, and `previewText`. If no logo URL is provided,
the RestOpsIQ logo is used as a fallback.

---

## Initial Use Cases

| #   | Template                 | Trigger                                        |
| --- | ------------------------ | ---------------------------------------------- |
| 1   | Welcome / Registration   | New tenant created or user invited             |
| 2   | Reset Password           | User requests password reset                   |
| 3   | Email Verification (OTP) | User verifies email after signup               |
| 4   | User Invitation          | Owner invites manager or cashier               |
| 5   | DIAN Invoice             | Electronic invoice sent to restaurant customer |
| 6   | Stock Alert              | Ingredient falls below minimum stock           |
| 7   | Shift Summary            | Shift closed, PDF sent to manager              |

---

## Package Structure (target)

```
packages/email/
├── src/
│   ├── templates/
│   │   ├── base-layout.tsx         ← reusable white-label wrapper
│   │   ├── welcome.tsx             ← EMAIL-03
│   │   ├── reset-password.tsx      ← EMAIL-03
│   │   ├── verify-email.tsx        ← EMAIL-03
│   │   ├── invite-user.tsx         ← EMAIL-04
│   │   ├── dian-invoice.tsx        ← EMAIL-05
│   │   ├── stock-alert.tsx         ← EMAIL-06
│   │   ├── shift-summary.tsx       ← EMAIL-07
│   │   └── template-registry.tsx   ← dispatch union → ReactElement
│   ├── test/
│   │   ├── base-layout.spec.ts
│   │   ├── email.service.spec.ts
│   │   └── resend.client.spec.ts
│   ├── types.ts
│   ├── email.queue.ts
│   ├── email.service.ts
│   ├── email.worker.ts             ← EMAIL-03
│   └── resend.client.ts
├── package.json                    ← @restopsiq/email
├── tsconfig.json
└── jest.config.js
```

---

## Subtask Breakdown

| Ticket   | Title                                                    | Status  |
| -------- | -------------------------------------------------------- | ------- |
| RES-222  | EMAIL-01 — Package setup (dependencies, tsconfig, turbo) | ✅ Done |
| RES-223  | EMAIL-02 — BaseLayout, EmailService, ResendClient, types | ✅ Done |
| RES-224  | EMAIL-03 — BullMQ Worker + Resend integration            | Pending |
| RES-225+ | EMAIL-04..07 — Real template implementations             | Pending |

---

## Acceptance Criteria (Epic-level)

- [ ] `import { EmailService } from '@restopsiq/email'` works from `apps/api` without extra config
- [ ] All emails pass through BullMQ — no synchronous sends anywhere
- [ ] Templates render correctly in Gmail, Outlook, and Apple Mail
- [ ] White-label layout supports logo and primary color per tenant
- [ ] 3x exponential retry with DLQ + Slack alert after 3 failures
- [ ] Unit tests cover template rendering and job enqueuing
