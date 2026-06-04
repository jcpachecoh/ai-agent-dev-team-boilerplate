# Task: SCSS industrial preset (touch + typography)

**Depends on:** `01-scaffold-apps-plant.md`  
**Spec:** § Accessibility Requirements, Technology Stack (SCSS)

---

## Goal

Add plant-specific SCSS tokens and global styles: minimum 18px body, 48px touch targets, 88×72px keypad targets, dark fullscreen operator theme.

---

## Scope

- `apps/plant/scss.config.ts` (or `src/styles/tokens.scss` + Vite SCSS config)
- Global import in `main.tsx`
- CSS variables / SCSS maps: `--font-size-base`, `--touch-target-min`, `--keypad-key-min-w/h`
- Utility classes: `.touch-target`, `.keypad-key`, `.screen-operator`, `.screen-supervisor`

---

## Requirements

| Token                      | Value                               |
| -------------------------- | ----------------------------------- |
| Minimum body font          | 18px                                |
| Minimum touch target       | 48×48px                             |
| PIN keypad key             | 88×72px minimum                     |
| Primary buttons (operator) | 120px min height where spec applies |

- Usable at ~60cm viewing distance (contrast, size — no tiny labels)
- Dark mode default for operator screens

---

## Testing strategy

- **Stylelint** — extend monorepo `stylelint` task for `apps/plant/**/*.scss`
- **No unit tests** — visual QA in task 15

---

## Acceptance criteria

- [ ] `pnpm turbo stylelint --filter=@restopsiq/plant` passes (or lint script added)
- [ ] Sample keypad component in Storybook or dev page meets 88×72px computed size
- [ ] Base `html` font-size ≥ 18px on operator routes

---

## Files likely affected

- `apps/plant/scss.config.ts`
- `apps/plant/src/styles/_tokens.scss`
- `apps/plant/src/styles/global.scss`
- `apps/plant/vite.config.ts` (scss additionalData if needed)

---

## Out of scope

- Full screen layouts (tasks 10–12)

---

## Validation commands

```bash
pnpm turbo stylelint --filter=@restopsiq/plant
pnpm turbo dev --filter=@restopsiq/plant
```
