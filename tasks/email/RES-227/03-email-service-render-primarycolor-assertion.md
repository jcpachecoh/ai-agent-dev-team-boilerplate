# Task 03 — EmailService: Real-Render Primary Color Assertion (Gap G2)

## Goal

Add a test to `email.service.spec.ts` that proves `EmailService.render()` produces actual HTML
containing the tenant's `primaryColor` value — using the **real** `@react-email/render` (not mocked).

This closes **gap G2** from the ticket:

> `render: el HTML contiene el color primario del tenant`

---

## Scope

Add one `it()` block inside a new (or existing) `describe('render')` block in `email.service.spec.ts`
that:

1. Does NOT mock `@react-email/render`.
2. Calls `service.render()` with a `primaryColor` value.
3. Asserts the returned HTML string contains that color value.

BullMQ `Queue` must still be mocked to prevent real Redis connections.

---

## Out of Scope

- Modifying `email.service.ts`.
- Mocking `@react-email/render` for this new test (the whole point is to use the real renderer).
- Adding a new spec file.
- Changing `jest.config.js`.
- Any change outside `packages/email/src/test/email.service.spec.ts`.

---

## Files Allowed

- `packages/email/src/test/email.service.spec.ts`

---

## Files Forbidden

- `packages/email/src/email.service.ts` — do not touch implementation
- `packages/email/src/templates/*.tsx` — do not touch templates
- Any other file

---

## Implementation Notes

### Current state of the spec

The existing `email.service.spec.ts` starts with:

```ts
jest.mock('bullmq');
jest.mock('@react-email/render');
```

Because `jest.mock()` is hoisted, this mock applies to the **entire file**. The new real-render
test therefore cannot simply be placed in the same file as-is — the mock would suppress the real
renderer.

### Solution: use `jest.isolateModules` or a separate describe with `jest.unmock`

**Option A — `jest.unmock` inside the test (preferred)**

After the module-level mock, use `jest.unmock('@react-email/render')` inside a dedicated
`describe` block and re-require the service so the unmocked renderer is used.

```ts
describe('render — real renderer (no @react-email/render mock)', () => {
  let realService: EmailService;

  beforeEach(() => {
    jest.unmock('@react-email/render');
    jest.resetModules();
    // Re-import the real render and rebuild EmailService with it
    // (or call render() via the already-instantiated service if the method is static/pure)
  });

  it('rendered HTML contains the tenant primaryColor', async () => {
    const html = await realService.render({
      tenantId: 'tenant-x',
      tenantName: 'Demo',
      primaryColor: '#AABBCC',
      template: { type: 'welcome', props: { ... } },
    });
    expect(html).toContain('#AABBCC');
  });
});
```

**Option B — `jest.isolateModules`**

Wrap the entire test in `jest.isolateModules()` to get a fresh module registry without the
`@react-email/render` mock:

```ts
it('rendered HTML contains the tenant primaryColor', async () => {
  let html: string;
  await jest.isolateModulesAsync(async () => {
    const { EmailService } = await import('../email.service');
    const svc = new EmailService({ redisUrl: 'redis://localhost', resendApiKey: 'x', from: 'a' });
    html = await svc.render({
      tenantId: 'tenant-x',
      tenantName: 'Demo',
      primaryColor: '#AABBCC',
      template: {
        type: 'welcome',
        props: {
          userName: 'Test',
          role: 'owner',
          loginUrl: 'https://app.example.com/login',
        },
      },
    });
  });
  expect(html!).toContain('#AABBCC');
});
```

Choose whichever option works with the current `EmailService.render()` signature. Inspect the
existing code first — if `render()` does not accept the options object in the same shape as `send()`,
adjust accordingly.

### Performance note

Real React Email rendering is slower than mocked rendering (~50–200ms per call). Isolate this test
inside its own `describe` block with a clear label:

```ts
describe('render — real HTML output (slow)', () => { ... });
```

### If `EmailService.render()` is not a public method

Examine `email.service.ts`. If `render()` is private or only called internally, the test may need
to call `send()` with a mocked Queue and inspect what was enqueued as `renderedHtml`. In that case,
unmock `@react-email/render` and mock only `Queue`.

---

## Acceptance Criteria

- [ ] Exactly one new `it()` added (may be inside a new `describe` block if isolation requires it).
- [ ] The test uses the **real** `@react-email/render` — not the mock.
- [ ] The test asserts the rendered HTML string contains the `primaryColor` hex value.
- [ ] BullMQ is still mocked (no real Redis connection in this test).
- [ ] All 19 pre-existing tests in `email.service.spec.ts` still pass.
- [ ] Total `packages/email` test count increases by 1 (from the state after subtask 02).

---

## Validation Commands

```bash
# Run only the service spec:
cd packages/email && npx jest --testPathPattern="email.service" --no-coverage

# Full package suite (must stay green):
cd packages/email && npx jest --no-coverage
```
