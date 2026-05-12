# GitHub Copilot Code Review Instructions

# RestOpsIQ Platform

When reviewing pull requests in this repository, enforce the following standards.
Flag any violation as a blocking comment. Do not approve PRs that break these rules.

---

## 1. NestJS Module Structure (BLOCKING)

Every feature module must follow the `interfaces → repository → service → controller → test` layout.

**Block if:**

- A module is missing any of: `interfaces/`, `repository/`, `service/`, `controller/`, `test/` directories
- `controller/` imports from `repository/` directly (must go through `service/`)
- `repository/` contains business logic or throws HTTP exceptions (`NotFoundException`, `ConflictException`, etc.)
- `service/` injects `PrismaService` directly instead of the module's own Repository
- `interfaces/` contains classes, decorators, or runtime code (interfaces and type aliases only)
- `{feature}.interfaces.ts` is missing `I{Feature}Repository` or `I{Feature}Service` definitions
- A Repository class does not implement `I{Feature}Repository`
- A Service class does not implement `I{Feature}Service`
- `module.ts` registers `PrismaService` as a provider instead of importing `PrismaModule`
- DTOs live outside `controller/dto/`

**Reference:** `docs/MODULE-STRUCTURE.md`

---

## 2. TypeScript Strict Mode (BLOCKING)

**Block if:**

- `any` type is used without a comment justifying it
- A function is missing its return type annotation (especially in services and controllers)
- `as SomeType` type assertions are used instead of proper type guards
- `!` non-null assertions are used without a null-check guard
- Unused variables or imports are present

---

## 3. Unit Tests Required (BLOCKING)

**Block if:**

- A new Controller method has no corresponding test in `*.controller.spec.ts`
- A new Service method has no corresponding test in `*.service.spec.ts`
- A test uses `expect(true).toBe(true)` or other trivially passing assertions
- Tests do not cover the error/failure path (only happy path tested)
- Mocks are not reset between tests (missing `jest.clearAllMocks()` or `clearMocks: true`)

---

## 4. Integration Tests Required for Repositories (BLOCKING)

**Block if:**

- A new Repository method has no corresponding integration test
- Integration tests connect to a production database (must use `DATABASE_URL` from environment with `NODE_ENV=test`)

---

## 5. SCSS / Styling Rules (BLOCKING)

**Block if:**

- A component's styles are in a `.scss` file that is **not** named `ComponentName.module.scss`
- A component uses inline `style={{}}` props for anything other than truly dynamic values (colors from API, etc.)
- Hard-coded color values (hex, rgb, named colors) appear in SCSS — must use variables from `styles/abstracts/`
- `!important` is used in any SCSS file
- Nesting depth exceeds 3 levels
- ID selectors (`#id`) are used in SCSS
- `@import` is used instead of `@use` / `@forward` (deprecated SCSS syntax)

**Component folder structure — Block if a new component does NOT follow:**

```
ComponentName/
├── index.ts                     ← barrel export only
├── ComponentName.tsx            ← component implementation
└── ComponentName.module.scss    ← scoped styles
```

---

## 6. Clean Code Rules (BLOCKING)

**Block if:**

- A function/method exceeds 30 lines (extract smaller functions)
- A function has more than 4 parameters (use a DTO/options object)
- `console.log` / `console.info` appear in production code (use NestJS Logger or structured logging)
- Dead code is committed (commented-out code blocks without explanation)
- Magic numbers or strings without named constants (e.g., `setTimeout(fn, 3000)` → use `const RETRY_DELAY_MS = 3000`)

---

## 7. Security (BLOCKING)

**Block if:**

- Secrets, API keys, or passwords appear anywhere in the code or tests
- User input is used in a database query without parameterization / ORM abstraction
- `eval()` or `new Function()` is used
- `dangerouslySetInnerHTML` is used without sanitization
- HTTP endpoints that modify state (POST/PUT/PATCH/DELETE) lack authentication guards

---

## 8. API Contracts (WARN — discuss before merging)

- New API endpoints should have a corresponding DTO with validation decorators (`class-validator`)
- Response shapes should match the types defined in `packages/types/`
- Breaking changes to existing endpoints require a version bump or migration plan

---

## 9. Performance (WARN)

- N+1 query patterns in repositories (loading relations in loops)
- Missing `async/await` on Promise-returning functions
- Large bundle imports (e.g., `import * as _ from 'lodash'` — use specific imports)
