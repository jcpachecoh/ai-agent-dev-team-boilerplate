# Task: Field Operations UI Components (Figma) — `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[FIGMA]` `[MOBILE-OPS]` `[RIDER]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `pending`  
**Created:** 2026-05-20  
**Depends On:** `01-design-tokens.md`, `01-feedbacks.md`, `02-button-component.md`, `04-feedback-components.md`

---

# Context

Implement the **Field Operations** component set from Figma into the shared UI library:

```txt
packages/ui
```

These components support rider/manager flows: trip control, phase completion, PIN entry, status surfaces, and related actions.

**Figma is the visual source of truth** for layout, spacing, typography, icons, and states. This task defines behavior, API, sizing, theming, and acceptance criteria aligned with the rest of `packages/ui`.

All components MUST follow the same architectural patterns as:

- Button
- BadgeButton
- Feedback (Skeleton, EmptyState)

Reference implementation:

```txt
ComponentName/
 ├── ComponentName.tsx
 ├── ComponentName.module.scss
 ├── ComponentName.stories.tsx
 ├── index.ts
```

---

# Figma Source File

| Field     | Value                                                          |
| --------- | -------------------------------------------------------------- |
| File name | Untitled                                                       |
| File key  | `ZrRah3tdmgm0DFyuz7QHCE`                                       |
| Base URL  | `https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled` |

Append `?node-id={NODE}&m=dev` for dev-mode inspection per component below.

---

# Design Reference Assets (Local)

Export screenshots from Figma and store them in:

```txt
tasks/packages-ui/design-references/field-ops/
```

See `tasks/packages-ui/design-references/field-ops/README.md` for naming rules.

**Every component** MUST be validated against:

1. Figma dev-mode specs (primary)
2. Local PNG references in `design-references/field-ops/` (light + dark)

Global dashboard references still apply for surface hierarchy:

```txt
docs/design-references/dashboard-dark.png
docs/design-references/dashboard-light.png
```

---

# Global Requirements (All Components)

## Theme

Every component MUST support:

```ts
theme?: 'light' | 'dark';
```

Default in Storybook docs: **`light`**.

Each component MUST include a **`DarkMode`** story with `theme: 'dark'` and dark canvas background.

## Size (Width + Height)

Every component MUST support:

```ts
size?: 'sm' | 'md' | 'xl';
```

Default: **`md`**.

### Size scale (interactive / container components)

| Size   | Min width          | Min height                 | Notes                                 |
| ------ | ------------------ | -------------------------- | ------------------------------------- |
| **sm** | 220px              | 40px (buttons) / per Figma | Compact touch targets                 |
| **md** | 320px              | 48px (buttons) / per Figma | Default                               |
| **xl** | **100%** of parent | per Figma                  | **Full-width** layout where specified |

**Exception — `CompletePhaseButton`:** `xl` MUST span **full width** of the parent container (long CTA). `sm` / `md` use fixed max-widths from Figma.

**Exception — `PinKey` / keypad cells:** sizes scale **cell** dimensions (width + height), not only font size. See PinKey section.

Sizing MUST use CSS variables on the root class:

```scss
.size--sm {
  --control-width: 220px;
  --control-min-height: ...;
}
.size--md {
  --control-width: 320px;
  --control-min-height: ...;
}
.size--xl {
  --control-width: 100%;
  --control-min-height: ...;
}
```

```scss
width: min(100%, var(--control-width));
min-height: var(--control-min-height);
```

Typography, padding, icon size, and gap MUST scale proportionally per size variant.

## Shared SCSS

```scss
@use '../../styles/abstracts/variables' as *;
@use '../../styles/abstracts/mixins' as *;
```

Hardcoded hex in component TSX is forbidden. Approved semantic mappings and brand gold (`#d4a017`) may appear in SCSS only when tied to tokens or documented variants.

## Storybook

- `tags: ['autodocs']`
- Meta-level `args: { theme: 'light', size: 'md' }`
- Controls: `theme` (radio), `size` (select: sm | md | xl)
- Decorator: padded container so `xl` full-width is visible

## Accessibility

```txt
focus-visible outlines
keyboard activation for buttons and PIN keys
aria-label / aria-pressed where applicable
minimum touch target 44px on md (adjust sm/xl per Figma)
role="button" for actionable PIN cells
```

## Forbidden

```txt
- pure black / pure white surfaces
- inconsistent border radius vs design system
- sizes that only change font-size without width/height
- implementing dark mode as an afterthought
- skipping xl full-width on CompletePhaseButton
```

---

# Required Components (Figma Map)

| #   | Component           | Figma node                                                                                    | Node ID   |
| --- | ------------------- | --------------------------------------------------------------------------------------------- | --------- |
| 1   | FieldStatusCard     | [49:4895](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4895&m=dev) | `49-4895` |
| 2   | TripProgressStrip   | [49:4910](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4910&m=dev) | `49-4910` |
| 3   | PhaseIndicator      | [49:4922](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4922&m=dev) | `49-4922` |
| 4   | TripActionButton    | [49:4955](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4955&m=dev) | `49-4955` |
| 5   | CompletePhaseButton | [49:4960](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4960&m=dev) | `49-4960` |
| 6   | OpsInfoPanel        | [49:4811](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4811&m=dev) | `49-4811` |
| 7   | PinKey              | [49:4629](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4629&m=dev) | `49-4629` |
| 8   | PinKeypad           | [49:4628](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4628&m=dev) | `49-4628` |
| 9   | FieldAlertBanner    | [49:4720](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4720&m=dev) | `49-4720` |

> **Naming note:** Table names are provisional. Match Figma layer/component names during implementation; rename folders only if design confirms.

---

# Component Specifications

## 1. FieldStatusCard — Node `49-4895`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4895&m=dev)

### Requirements

- Match layout, typography, and spacing from Figma exactly
- `theme`, `size` (sm | md | xl)
- Optional `loading` → Skeleton
- Responsive width/height per size table
  -no pongas imagenes de figma, pon iconos lo mas parecidos a los que esten

### Stories

```txt
Default
DarkMode
Sizes
Loading
```

---

## 2. TripProgressStrip — Node `49-4910`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4910&m=dev)

### Requirements

- Horizontal progress / step strip per Figma
- `theme`, `size`
- Active vs completed step states from design
- Full width at `xl` if Figma shows full-bleed
  -no pongas imagenes de figma, pon iconos lo mas parecidos a los que esten

### Stories

```txt
Default
InProgress
Completed
DarkMode
Sizes
```

---

## 3. PhaseIndicator — Node `49-4922`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4922&m=dev)

### Requirements

- Phase label + visual state (icon/color) per Figma
- `theme`, `size`
- Supports current / upcoming / done states

### Stories

```txt
Default
Current
Done
DarkMode
Sizes
```

---

## 4. TripActionButton — Node `49-4955`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4955&m=dev)

### Requirements

Single button component with **variants** (same shell, different intent):

```ts
variant?: 'pause' | 'report-issue';
```

| Variant        | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `pause`        | Pausar viaje / operación (pause icon + label per Figma) |
| `report-issue` | Reportar novedad (icon + label per Figma)               |

- `onClick` handler
- `disabled`, `loading` states
- `theme`, `size` (sm | md | xl)
- Icon + label alignment per Figma
- Hover / pressed / focus-visible per theme

### Stories

```txt
Pause
ReportIssue
Disabled
Loading
DarkMode
Sizes
```

---

## 5. CompletePhaseButton — Node `49-4960`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4960&m=dev)

### Requirements

Primary CTA: **Completar fase**.

```ts
size?: 'sm' | 'md' | 'xl';
```

| Size   | Width behavior                             |
| ------ | ------------------------------------------ |
| sm     | Fixed width per Figma (compact)            |
| md     | Default width per Figma                    |
| **xl** | **`width: 100%`** — full-width long button |

- `onClick`, `disabled`, `loading`
- `theme` light / dark
- Label and icon from Figma

### Stories

```txt
Default
FullWidthXL
Disabled
Loading
DarkMode
Sizes
```

---

## 6. OpsInfoPanel — Node `49-4811`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4811&m=dev)

### Requirements

- Information panel / card per Figma (title, rows, actions if any)
- `theme`, `size`
- Optional slots: `children`, `footer`

### Stories

```txt
Default
WithFooter
DarkMode
Sizes
```

---

## 7. PinKey — Node `49-4629`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4629&m=dev)

### Requirements

PIN keypad **cell** (single key). Used inside `PinKeypad` and reusable standalone.

### Variants

```ts
variant?: 'default' | 'semantic';
```

#### `default`

- Displays a **digit** (0–9) or custom character
- Digit/content is **configurable** via prop:

```ts
value?: string; // e.g. "1", "•", backspace icon slot
onChange?: (value: string) => void; // when editable
```

- Default appearance matches Figma base key

#### `semantic`

- **Border color** driven by prop:

```ts
accentColor?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
```

Rules:

1. **Border** uses the semantic color token
2. **Inner content** (icon, text, or number) uses the **same** semantic color
3. **Background** uses the **same** color at **reduced opacity** (e.g. 12–18% alpha), not a unrelated fill
4. no pongas imagenes de figma, pon iconos lo mas parecidos a los que esten

```scss
// Pattern (SCSS — map accent to token variables)
border-color: $color-warning;
color: $color-warning;
background-color: rgba($color-warning, 0.14);
```

- `theme`, `size` scale **cell width and height** + font/icon size
- `onClick` for key press
- `aria-label` required (e.g. "Tecla 5")

### Stories

```txt
DefaultDigit
EditableValue
SemanticSuccess
SemanticWarning
SemanticDanger
DarkMode
Sizes
```

---

## 8. PinKeypad — Node `49-4628`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4628&m=dev)

### Requirements

- Full keypad grid composed of `PinKey` components
- Layout (3×4 or per Figma) MUST match node `49-4628`
- Props:

```ts
onKeyPress?: (key: string) => void;
value?: string;        // optional controlled PIN display elsewhere
theme?: 'light' | 'dark';
size?: 'sm' | 'md' | 'xl';
```

- Special keys: backspace, confirm — per Figma labels/icons
- Grid gap and cell size scale with `size`

### Stories

```txt
Default
WithInput
DarkMode
Sizes
```

---

## 9. FieldAlertBanner — Node `49-4720`

### Figma

[Open in Figma](https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4720&m=dev)

### Requirements

- Inline / banner alert for field context (distinct from global `Alert` if layout differs)
- `variant`: success | warning | danger | info (per Figma)
- `theme`, `size`
- Optional dismiss, optional action slot
- Full width at `xl` when Figma specifies

### Stories

```txt
Info
Warning
Error
Dismissible
DarkMode
Sizes
```

---

# Theme Consistency Rules

## Dark Theme

- layered dark surfaces
- subtle borders `rgba(white, 0.08–0.14)`
- muted secondary text
- gold accent `#d4a017` for primary emphasis
- semantic colors for PinKey `semantic` variant

## Light Theme

- same spacing and proportions as dark
- soft borders `rgba(black, 0.08–0.12)`
- readable primary text
- no pure white panels without border context

---

# Recommended Folder Structure

```txt
packages/ui/src/components/field-ops/
 ├── field-status-card/
 ├── trip-progress-strip/
 ├── phase-indicator/
 ├── trip-action-button/
 ├── complete-phase-button/
 ├── ops-info-panel/
 ├── pin-key/
 ├── pin-keypad/
 └── field-alert-banner/
```

---

# Export Barrel

Add to `packages/ui/src/index.tsx`:

```ts
export * from './components/field-ops/field-status-card';
export * from './components/field-ops/trip-progress-strip';
export * from './components/field-ops/phase-indicator';
export * from './components/field-ops/trip-action-button';
export * from './components/field-ops/complete-phase-button';
export * from './components/field-ops/ops-info-panel';
export * from './components/field-ops/pin-key';
export * from './components/field-ops/pin-keypad';
export * from './components/field-ops/field-alert-banner';
```

---

# Acceptance Criteria

- [ ] All 9 Figma nodes implemented and visually matched (light + dark)
- [ ] PNG references added under `tasks/packages-ui/design-references/field-ops/`
- [ ] Every component: `.tsx` + `.module.scss` + `.stories.tsx` + `index.ts`
- [ ] Every component supports `theme: 'light' | 'dark'`
- [ ] Every component supports `size: 'sm' | 'md' | 'xl'` with **width and height** scaling
- [ ] `CompletePhaseButton` `xl` is **full width** (100% parent)
- [ ] `TripActionButton` supports `pause` and `report-issue` variants
- [ ] `PinKey` `default` allows configurable inner value
- [ ] `PinKey` `semantic` derives border, content, and background from same accent color
- [ ] `PinKeypad` composes `PinKey` per Figma grid `49-4628`
- [ ] Storybook defaults to **light**; each component has **DarkMode** story
- [ ] Storybook exposes **Sizes** story or size control for sm / md / xl
- [ ] `pnpm --filter @restopsiq/ui typecheck` passes
- [ ] No hardcoded colors in TSX
- [ ] Components exported from `packages/ui/src/index.tsx`
- [ ] Focus and keyboard interaction verified on buttons and PIN keys

---

# Implementation Checklist (Agent)

1. Open each Figma node link in dev mode (`?m=dev`)
2. Export light/dark PNGs → `design-references/field-ops/`
3. Implement shared size/theme pattern first (`PinKey`, `TripActionButton`, `CompletePhaseButton` priority)
4. Build remaining components from table
5. Wire Storybook under `Field Ops/` (or `Operations/`) namespace
6. Run typecheck + Storybook visual pass
7. no pongas imagenes de figma, pon iconos lo mas parecidos a los que esten de una libreria

---

# Figma Links (Quick Reference)

```txt
49-4895  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4895&m=dev
49-4910  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4910&m=dev
49-4922  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4922&m=dev
49-4955  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4955&m=dev  (pause + reportar novedad)
49-4960  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4960&m=dev  (completar fase, xl full)
49-4811  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4811&m=dev
49-4629  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4629&m=dev  (PIN key + semantic color)
49-4628  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4628&m=dev  (PIN keypad grid)
49-4720  https://www.figma.com/design/ZrRah3tdmgm0DFyuz7QHCE/Untitled?node-id=49-4720&m=dev
```

Reference tasks:

- `tasks/packages-ui/03-Data-Display.md` (size + theme patterns)
- `tasks/packages-ui/04-charts.md` (acceptance criteria structure)
