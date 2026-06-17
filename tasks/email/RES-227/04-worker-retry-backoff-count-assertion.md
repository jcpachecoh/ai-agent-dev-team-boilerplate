# Task 04 — Worker: Retry Attempts and Exponential Backoff Assertion (Gap G3)

## Goal

Add an explicit assertion to `email.worker.spec.ts` that the `EmailWorker` configures BullMQ with
`attempts: 3` and `backoff: { type: 'exponential' }` (or equivalent).

This closes **gap G3** from the ticket:

> `reintenta 3 veces con backoff exponencial en error de red`

The existing test `'re-throws a non-ResendError (network failure) for BullMQ backoff'` proves
that the worker re-throws on network errors, but does **not** assert the Worker is constructed
with the correct retry configuration.

---

## Scope

Add one or two `it()` blocks to `email.worker.spec.ts` inside an existing or new `describe` block
that captures the arguments passed to the BullMQ `Worker` constructor and asserts the
`defaultJobOptions` (or equivalent) contains `attempts: 3` and exponential backoff.

---

## Out of Scope

- Modifying `email.worker.ts`.
- Modifying `email.worker.config.ts`.
- Testing BullMQ's internal retry loop (BullMQ's own retry behavior is not our code to test).
- Adding a new spec file.
- Any change outside `packages/email/src/test/email.worker.spec.ts`.

---

## Files Allowed

- `packages/email/src/test/email.worker.spec.ts`

---

## Files Forbidden

- `packages/email/src/email.worker.ts` — do not touch implementation
- `packages/email/src/email.worker.config.ts` — do not touch config
- Any other file

---

## Implementation Notes

### What to capture

`email.worker.spec.ts` already mocks BullMQ:

```ts
jest.mock('bullmq');
import { Worker } from 'bullmq';
```

The `Worker` constructor is called inside `EmailWorker.start()` (or the `EmailWorker` constructor).
The BullMQ `Worker` constructor signature is:

```ts
new Worker(queueName, processor, workerOptions);
```

The `workerOptions` object should contain something like:

```ts
{
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: <some value> },
  }
}
```

or the options may be passed directly as top-level `attempts` and `backoff` on the worker options
(depends on the actual implementation).

**Before writing the test**, read `email.worker.ts` to confirm:

1. Where in the constructor or `start()` the BullMQ `Worker` is instantiated.
2. What property path holds `attempts` and backoff config.
3. What `email.worker.config.ts` exports for these values.

### Assertion pattern

```ts
describe('Worker configuration', () => {
  it('configures BullMQ Worker with attempts: 3', () => {
    const [, , workerOptions] = (Worker as jest.MockedClass<typeof Worker>).mock.calls[0];
    expect(workerOptions).toMatchObject({
      // adjust the property path based on actual implementation:
      defaultJobOptions: expect.objectContaining({ attempts: 3 }),
    });
  });

  it('configures BullMQ Worker with exponential backoff', () => {
    const [, , workerOptions] = (Worker as jest.MockedClass<typeof Worker>).mock.calls[0];
    expect(workerOptions).toMatchObject({
      defaultJobOptions: expect.objectContaining({
        backoff: expect.objectContaining({ type: 'exponential' }),
      }),
    });
  });
});
```

Adjust property paths after reading the actual `EmailWorker` implementation. The Worker constructor
mock is already captured in the existing `beforeEach` setup — confirm whether the mock is cleared
between tests and whether `Worker` is called in a `beforeEach` or inside each test.

### Do not test BullMQ internals

The goal is to assert **what we configure**, not how BullMQ handles retries. If the assertion
reveals that `email.worker.ts` does NOT configure `attempts: 3` or exponential backoff, that is
an **implementation gap** — stop and report before changing `email.worker.ts`.

---

## Acceptance Criteria

- [ ] At least one new `it()` block added that explicitly asserts `attempts: 3` in the Worker options.
- [ ] At least one new `it()` block (can be combined) asserting exponential backoff type.
- [ ] Both tests pass without modifying `email.worker.ts` or `email.worker.config.ts`.
- [ ] All 40 pre-existing tests in `email.worker.spec.ts` still pass.
- [ ] Total `packages/email` test count increases by at least 1 from the state after subtask 03.

---

## Validation Commands

```bash
# Run only the worker spec:
cd packages/email && npx jest --testPathPattern="email.worker" --no-coverage

# Full package suite (must stay green):
cd packages/email && npx jest --no-coverage
```
