# Task 02 — Template: OTP Monospace Font Assertion (Gap G1)

## Goal

Add the single missing assertion to `verify-email.spec.ts` that confirms the OTP code is rendered
inside an element that carries a monospace `font-family` style.

This closes **gap G1** from the ticket:

> `verify-email: muestra el OTP en fuente monoespaciada grande`

---

## Scope

Add one `it()` block to the existing `VerifyEmailTemplate` describe section in `verify-email.spec.ts`.
The test renders the template with a known OTP and inspects the raw HTML string for a monospace
font-family declaration on or wrapping the OTP text.

---

## Out of Scope

- Modifying the `VerifyEmailTemplate` implementation in `verify-email.tsx`.
- Adding a new spec file.
- Changing `jest.config.js`.
- Any other spec file.
- Adding dependencies.

---

## Files Allowed

- `packages/email/src/test/verify-email.spec.ts`

---

## Files Forbidden

- `packages/email/src/templates/verify-email.tsx` — do not touch implementation
- Any other file outside `packages/email/src/test/verify-email.spec.ts`

---

## Implementation Notes

### What to assert

The `VerifyEmailTemplate` renders the OTP in a styled element. Inspect the HTML to confirm
a monospace font is applied. The exact style attribute format depends on `@react-email/render`
output — typically inline styles.

Approach: render the template with a known OTP (e.g. `'123456'`), then assert the rendered HTML
contains either:

```
expect(html).toMatch(/font-family[^"]*monospace/)
```

or

```
expect(html).toContain('monospace')
```

The more specific regex is preferred because it ties the assertion to the actual CSS property,
not just the word appearing anywhere in the output.

### Where to add it

Add inside the existing describe block for `VerifyEmailTemplate`. Do not create a new describe block
unless the existing structure makes placement impossible.

### Pattern to follow

The `welcome.spec.ts` file uses this exact approach for `primaryColor`:

```ts
it('applies primaryColor to the CTA button', () => {
  const html = render({ primaryColor: '#FF0000' });
  expect(html).toContain('#FF0000');
});
```

Follow the same one-liner pattern:

```ts
it('renders the OTP code with a monospace font-family', () => {
  const html = render({ otpCode: '123456' });
  expect(html).toMatch(/font-family[^"]*monospace/);
});
```

Adjust the regex if the actual rendered output uses a different quoting style (single-quote,
no-quote). Run the test first and inspect the failure message to see what the actual HTML looks like.

### If the assertion fails

If the OTP is NOT rendered with a monospace font in the current implementation, this is a **real
implementation gap** in `verify-email.tsx`. Do not silently fix it here. Stop and report:

> "The OTP element in `verify-email.tsx` does not apply `font-family: monospace`. This is an
> implementation bug. Do you want to fix it as part of this task or open a separate ticket?"

Do not modify `verify-email.tsx` without explicit approval.

---

## Acceptance Criteria

- [ ] Exactly one new `it()` block added to `verify-email.spec.ts`.
- [ ] The test passes without modifying `verify-email.tsx`.
- [ ] The test asserts `font-family` monospace on the OTP element (not just that the word "monospace" appears randomly in the file).
- [ ] All 11 pre-existing tests in `verify-email.spec.ts` still pass.
- [ ] Total `packages/email` test count increases from 169 to 170.

---

## Validation Commands

```bash
# Run only the verify-email spec:
cd packages/email && npx jest --testPathPattern="verify-email" --no-coverage

# Full package suite (must stay green):
cd packages/email && npx jest --no-coverage
```
