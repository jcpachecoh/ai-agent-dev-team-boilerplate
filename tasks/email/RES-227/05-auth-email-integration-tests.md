# Task 05 — Auth Email Integration Tests (Gap G4)

## Goal

Create `apps/api/src/auth/test/auth-email-integration.spec.ts` — a thin integration spec that
wires `AuthController` with a **real `AuthEmailService`** and a **mocked `EmailService`**, so the
test can assert that `forgot-password` causes `EmailService.send()` to be called (i.e., a BullMQ
job is enqueued).

This closes **gap G4** from the ticket:

> `POST /auth/forgot-password: encola el job de email en BullMQ`

The file also consolidates all 8 ticket auth scenarios in one place for traceability. Requirements
that are already fully proven by existing unit tests are re-tested here at a shallower integration
level — the goal is to validate the wiring, not re-duplicate deep unit assertions.

---

## Scope

Create one new file: `apps/api/src/auth/test/auth-email-integration.spec.ts`.

The spec uses `NestJS TestingModule` with:

- Real `AuthController`.
- Real `AuthEmailService` (so its internal call to `EmailService.send` is observable).
- Mocked `AuthRepository` and `AuthEmailRepository` (no DB).
- Mocked `EmailService` with `{ send: jest.fn() }` (no BullMQ, no Redis, no Resend).
- Mocked `ioredis` (no Redis connection from `AuthEmailService.onModuleInit`).

No real database, Redis, Resend, or network calls.

---

## Out of Scope

- Modifying `auth.controller.ts`, `auth-email.service.ts`, `auth.module.ts`, or any source file.
- Creating files at `apps/api/test/` (outside `src/`) — the unit jest config would not pick them up
  and they belong in the e2e config which is for real infrastructure.
- Testing scenarios already deeply covered by `auth.controller.spec.ts` or `auth.service.spec.ts`
  beyond what is needed for wiring validation.
- Any change to `apps/api/jest.config.js`.

---

## Files Allowed

- `apps/api/src/auth/test/auth-email-integration.spec.ts` (new file — create it)

---

## Files Forbidden

- `apps/api/src/auth/` source files — do not touch implementation
- `apps/api/src/auth/test/auth.controller.spec.ts` — do not modify existing tests
- `apps/api/src/auth/test/auth-email.service.spec.ts` — do not modify existing tests
- `apps/api/jest.config.js` — no config changes needed
- `apps/api/test/` — do not create files outside `src/`
- Any `package.json` or lockfile

---

## Implementation Notes

### Test module setup

```ts
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
  return MockRedis;
});

// Mock the JwtService to avoid needing the full JwtModule
const jwtServiceMock = { sign: jest.fn().mockReturnValue('mock-token') };

// Mock Prisma
const prismaMock = {
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

// The key injectable: mocked EmailService
const emailServiceMock = {
  send: jest.fn().mockResolvedValue({ jobId: 'job-integration-001' }),
};
```

Build the module:

```ts
const module = await Test.createTestingModule({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthEmailService,
    AuthRepository,
    AuthEmailRepository,
    { provide: PrismaService, useValue: prismaMock },
    { provide: EmailService, useValue: emailServiceMock },
    { provide: JwtService, useValue: jwtServiceMock },
  ],
}).compile();

controller = module.get<AuthController>(AuthController);
```

### The 8 ticket scenarios

Map each scenario to a test. For scenarios already deeply covered in unit specs, the integration
test only validates the **wiring** (i.e., that calling the controller method reaches the expected
downstream mock):

| #   | Ticket scenario                                                     | Integration assertion                                                                                                               |
| --- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `POST /auth/forgot-password: retorna 200 aunque el email no exista` | Call `controller.forgotPassword({ email: 'nobody@example.com' })`, assert resolves with `{ message: ... }` even when user not found |
| 2   | `POST /auth/forgot-password: encola el job de email en BullMQ`      | Call with an email that DOES exist, assert `emailServiceMock.send` was called once                                                  |
| 3   | `POST /auth/reset-password: token válido cambia la contraseña`      | Mock `authEmailRepository.findResetToken` to return valid token, assert `prismaMock.user.update` called                             |
| 4   | `POST /auth/reset-password: token usado dos veces retorna 400`      | Mock token with `usedAt` set, assert `BadRequestException` thrown                                                                   |
| 5   | `POST /auth/reset-password: token expirado retorna 400`             | Mock token with past `expiresAt`, assert `BadRequestException` thrown                                                               |
| 6   | `POST /auth/verify-email: OTP válido verifica el email del usuario` | Mock `redis.get` to return valid OTP payload, assert resolves to `{ message: ... }`                                                 |
| 7   | `POST /auth/verify-email: OTP expirado retorna 400`                 | Mock `redis.get` to return `null`, assert `BadRequestException` thrown                                                              |
| 8   | `token de reset se guarda como SHA-256 (no texto plano) en DB`      | Capture `authEmailRepository.createResetToken` argument, assert `tokenHash` is 64-char hex and differs from rawToken in URL         |

### Critical test — scenario 2 (BullMQ enqueue)

This is the core reason this file exists. The controller calls `authEmailService.sendResetPassword`,
which internally calls `emailService.send`. Because this spec uses the **real `AuthEmailService`**
(not a mock), the call chain propagates all the way to `emailServiceMock.send`.

```ts
it('forgot-password enqueues an email job via EmailService.send', async () => {
  // User exists
  prismaMock.user.findUnique.mockResolvedValue(mockUser);
  prismaMock.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
  prismaMock.passwordResetToken.create.mockResolvedValue(mockTokenRecord);

  await controller.forgotPassword({ email: 'alice@example.com' });

  expect(emailServiceMock.send).toHaveBeenCalledTimes(1);
  expect(emailServiceMock.send).toHaveBeenCalledWith(
    expect.objectContaining({
      template: expect.objectContaining({ type: 'reset-password' }),
    }),
  );
});
```

### Module-level mock for ioredis

`AuthEmailService.onModuleInit` creates a Redis instance. Since `jest.mock('ioredis')` is at the
top of the file, this is replaced with a no-op mock. After `module.compile()`, manually assign the
mock Redis instance if needed:

```ts
const service = module.get<AuthEmailService>(AuthEmailService);
(service as any)['redis'] = redisMock;
```

This pattern is established in `auth-email.service.spec.ts` and must be followed here.

### Do not duplicate deep assertions

Scenario 3 (token valid → password changed) just needs to confirm the flow works end-to-end at the
controller level. The deep bcrypt/hash assertions live in `auth.service.spec.ts`. Reference that
coverage rather than re-proving it here.

---

## Acceptance Criteria

- [ ] New file `apps/api/src/auth/test/auth-email-integration.spec.ts` created.
- [ ] File contains all 8 ticket auth scenarios as `it()` blocks.
- [ ] Scenario 2 explicitly asserts `emailServiceMock.send` is called (BullMQ enqueue proxy).
- [ ] Real `AuthEmailService` is used (not mocked at DI level).
- [ ] Real `AuthController` is used.
- [ ] No real DB, Redis, Resend, or network calls.
- [ ] All 226 pre-existing `apps/api` auth tests still pass.
- [ ] Total `apps/api` test count increases by at least 8.
- [ ] `apps/api` global coverage threshold (≥ 80% all metrics) still passes.

---

## Validation Commands

```bash
# Run only the new integration spec:
cd apps/api && npx jest --testPathPattern="auth-email-integration" --no-coverage

# Full auth suite:
cd apps/api && npx jest --testPathPattern="auth" --no-coverage

# Full api suite with coverage gate:
cd apps/api && npx jest --coverage
```
