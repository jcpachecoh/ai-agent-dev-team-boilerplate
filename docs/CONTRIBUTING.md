# Contributing to RestOpsIQ Platform

All changes go through pull requests. PRs that fail any quality gate are **automatically blocked from merging**.

---

## Setup

```bash
git clone <repo>
cd restopsiq-platform
npm install
```

---

## Before Every PR

Run the full validation suite locally — the same checks that run in CI:

```bash
npm run typecheck     # TypeScript strict
npm run lint          # ESLint (zero warnings)
npm run format:check  # Prettier
npm run stylelint     # SCSS rules
node scripts/validate-structure.js  # Facade pattern
npm run test          # Unit tests
npm run test:e2e      # Integration tests (needs local DB)
```

Or run everything at once:

```bash
npm run validate
```

---

## Branch Strategy

```
main        ← production, protected, always deployable
develop     ← integration branch, protected
feature/*   ← your work branch (from develop)
fix/*       ← bugfix branch
```

**Always branch from `develop`, never from `main`:**

```bash
git checkout develop
git pull
git checkout -b feature/42-orders-endpoint
```

---

## Enforcement Overview

Every PR triggers 9 quality gate jobs. **All must pass** for the merge button to unlock:

| Gate                | Tool                      | Failure = |
| ------------------- | ------------------------- | --------- |
| TypeScript strict   | `tsc --noEmit`            | Blocked   |
| ESLint (0 warnings) | `eslint --max-warnings 0` | Blocked   |
| Prettier            | `prettier --check`        | Blocked   |
| Stylelint SCSS      | `stylelint`               | Blocked   |
| Module structure    | `validate-structure.js`   | Blocked   |
| Unit tests API ≥80% | Jest + coverage           | Blocked   |
| Unit tests Web ≥80% | Jest + coverage           | Blocked   |
| Integration tests   | Jest e2e + Postgres       | Blocked   |
| Build               | `turbo run build`         | Blocked   |

Additionally:

- **GitHub Copilot** automatically reviews every PR against `docs/copilot-instructions.md`
- **CODEOWNERS** automatically requests the right team for review (1 approval required)
- Stale reviews are dismissed on new commits
- All conversations must be resolved before merge

---

## NestJS: Module Structure

See [`docs/MODULE-STRUCTURE.md`](./MODULE-STRUCTURE.md).

```
Controller → Service → Repository
    ↑ each layer backed by interfaces/ ↑
```

Every module must have: `interfaces/`, `repository/`, `service/`, `controller/`, `test/`.
The validator (`node scripts/validate-structure.js`) will block CI if any directory is missing.

---

## Frontend: SCSS Conventions

- Component styles → `ComponentName.module.scss` (co-located with component)
- Global tokens → `packages/ui/src/styles/abstracts/`
- Never use hard-coded colors, inline styles, or `!important`
- No plain `.scss` files inside component folders

Stylelint enforces: camelCase selectors, no ID selectors, max 3 nesting levels, CSS property ordering.

---

## Testing Conventions

**API (NestJS):**

```typescript
// Unit: mock the layer below
describe('OrdersService', () => {
  let service: OrdersService;
  let repo: jest.Mocked<OrdersRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [OrdersService, { provide: OrdersRepository, useValue: { findAll: jest.fn() } }],
    }).compile();
    service = module.get(OrdersService);
    repo = module.get(OrdersRepository);
  });

  it('returns all orders', async () => {
    repo.findAll.mockResolvedValue([]);
    expect(await service.findAll()).toEqual([]);
  });
});
```

**Web (React):**

```typescript
import { render, screen } from '@testing-library/react';

it('renders the order card', () => {
  render(<OrderCard order={mockOrder} />);
  expect(screen.getByText(mockOrder.id)).toBeInTheDocument();
});
```

---

## Activating Copilot Code Review (Admin Step)

1. Go to **Settings → Code and Automation → Code review**
2. Enable **Copilot code review**
3. Set to trigger on all PRs targeting `main` and `develop`

Copilot uses `.github/copilot-instructions.md` to understand project-specific rules.
