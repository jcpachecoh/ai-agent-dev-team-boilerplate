# Task: E2E tests + epic acceptance validation

> **Status: DEFERRED (UI)** — Ejecutar después de tareas 03, 10–12. Unit tests infra: `pnpm --filter @restopsiq/plant test` ✅

**Depends on:** All tasks `01`–`14`  
**Spec:** § Acceptance Criteria, Testing Strategy

---

## Goal

Automate critical paths where feasible; run a structured manual tablet checklist to close the epic acceptance criteria.

---

## Scope

### E2E setup (Playwright recommended — align with monorepo if `test:e2e` exists)

- `apps/plant/e2e/` or `apps/plant/playwright.config.ts`
- Register `test:e2e` in `package.json` and Turbo
- Base URL: `vite preview` or dev server in CI

### Automated scenarios (minimum)

| #   | Scenario                                                           | Type                         |
| --- | ------------------------------------------------------------------ | ---------------------------- |
| 1   | Boot with mocked `stationId` → Login shows station                 | **E2e**                      |
| 2   | PIN login → lands on phase screen                                  | **E2e**                      |
| 3   | Start timer → go offline → timer still increments                  | **E2e** (Playwright offline) |
| 4   | Submit incident offline → queue count > 0 → online → queue flushed | **E2e**                      |
| 5   | Supervisor dashboard receives mocked WS event → UI updates         | **E2e** or **integration**   |

### Manual tablet checklist (required — native features)

- [ ] APK on physical tablet Android 10+
- [ ] `npx cap run android -- --stationId=EST-02` (or QR) → login shows EST-02
- [ ] Wake lock during session
- [ ] Camera capture on incident
- [ ] Kiosk pin mode (if MDM available)
- [ ] Capgo staging update (if task 13 done)
- [ ] Low-light / glove usability spot check

### Integration (optional, staging)

- Real Plant API + WebSocket against staging env
- Document env vars for QA team

---

## Testing strategy summary

| Layer                 | Tool                    | Owner            |
| --------------------- | ----------------------- | ---------------- |
| Stores, queue, socket | Vitest                  | Tasks 04, 08, 09 |
| Components/screens    | Vitest + RTL            | Tasks 10, 11, 12 |
| PWA offline shell     | Playwright offline      | This task        |
| Capacitor native      | Manual checklist        | This task        |
| Full epic AC          | This checklist + CI e2e | This task        |

---

## Acceptance criteria

- [ ] `pnpm turbo test:e2e --filter=@restopsiq/plant` passes in CI (or documented skip with issue link)
- [ ] `pnpm turbo validate --filter=@restopsiq/plant` passes (typecheck + lint + test)
- [ ] All epic items in `00-epic.md` Global acceptance criteria checked
- [ ] README "QA / Acceptance" section links to this checklist
- [ ] Known gaps filed as follow-up tasks (do not block if backend WS not ready — mock documented)

---

## Files likely affected

- `apps/plant/playwright.config.ts`
- `apps/plant/e2e/*.spec.ts`
- `apps/plant/package.json`
- `apps/plant/README.md`
- `tasks/app-plant/00-epic.md` (check boxes when done)

---

## Out of scope

- Backend Plant API implementation
- Load testing

---

## Validation commands

```bash
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo test:e2e --filter=@restopsiq/plant
pnpm turbo build --filter=@restopsiq/plant
# Manual: run checklist on plant tablet
```
