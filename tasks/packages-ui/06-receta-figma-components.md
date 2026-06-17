# Task: Receta UI Components (Figma) - `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[FIGMA]` `[RECETA]` `[TABLES]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `done`  
**Created:** 2026-05-26  
**Depends On:** `01-feedbacks.md`, `02-Formularios.md`, `03-Data-Display.md`, `05-field-ops-figma-components.md`

---

# Context

Implement the **Receta / Recipe Management** component set from Figma into the shared UI library:

```txt
packages/ui
```

These components support recipe listing and management flows: metric cards, search, recipe actions, table headers, editable rows, active/inactive status controls, recipe navigation, and history/result states.

**Figma is the visual source of truth** for layout, spacing, typography, icons, and states. This task defines behavior, API, sizing, theming, and acceptance criteria aligned with the rest of `packages/ui`.

All components MUST follow the same architectural patterns as:

- Button
- BadgeButton
- Feedback (Skeleton, EmptyState)
- Field Operations components

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

| Field     | Value                                                         |
| --------- | ------------------------------------------------------------- |
| File name | Opssynk                                                       |
| File key  | `owd5wBmVJgUE9n9MeOHxYb`                                      |
| Base URL  | `https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk` |

Append `?node-id={NODE}&m=dev` for dev-mode inspection per component below.

---

# Design Reference Assets (Local)

Export screenshots from Figma and store them in:

```txt
tasks/packages-ui/design-references/receta/
```

Create a `README.md` inside that folder with naming rules if it does not exist.

**Every component** MUST be validated against:

1. Figma dev-mode specs (primary)
2. Local PNG references in `design-references/receta/` (light + dark when available)

Do not implement Figma screenshots/images as UI. Use real markup, SCSS, design tokens, and icons from the existing icon library that are visually closest to Figma.

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

### Size scale

| Size   | Width behavior    | Height behavior              | Notes                       |
| ------ | ----------------- | ---------------------------- | --------------------------- |
| **sm** | compact per Figma | compact touch target         | Dense recipe/table contexts |
| **md** | default per Figma | default touch target         | Storybook default           |
| **xl** | `100%` of parent  | scales per Figma proportions | Full-width lists and tables |

Sizing MUST use CSS variables on the root class:

```scss
.size--sm {
  --control-width: ...;
  --control-min-height: ...;
}
.size--md {
  --control-width: ...;
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

Typography, padding, icon size, border radius, and gap MUST scale proportionally per size variant.

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
keyboard activation for buttons and navigation items
aria-label for icon-only buttons
aria-pressed / aria-current where applicable
minimum touch target 44px on md
semantic table roles for table-like rows
```

## Forbidden

```txt
- pure black / pure white surfaces
- hardcoded colors in TSX
- Figma screenshots used as rendered UI
- sizes that only change font-size without width/height
- duplicated button implementations where shared components can be composed
- table rows that reimplement EditButton or StatusButton instead of composing them
```

---

# Required Components (Figma Map)

| #   | Component             | Figma node                                                                                       | Node ID     |
| --- | --------------------- | ------------------------------------------------------------------------------------------------ | ----------- |
| 1   | RecetaMetricCard      | [2013:49](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-49&m=dev)     | `2013-49`   |
| 1a  | RecetaMetricCard      | [2013:54](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-54&m=dev)     | `2013-54`   |
| 1b  | RecetaMetricCard      | [2013:59](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-59&m=dev)     | `2013-59`   |
| 1c  | RecetaMetricCard      | [2013:912](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-912&m=dev)   | `2013-912`  |
| 1d  | RecetaMetricCard      | [2013:917](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-917&m=dev)   | `2013-917`  |
| 1e  | RecetaMetricCard      | [2013:922](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-922&m=dev)   | `2013-922`  |
| 1f  | RecetaMetricCard      | [2013:927](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-927&m=dev)   | `2013-927`  |
| 2   | RecetaSearch          | [2013:65](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-65&m=dev)     | `2013-65`   |
| 3   | RecetaActionButton    | [2013:80](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-80&m=dev)     | `2013-80`   |
| 4   | RecetaTableHeader     | [2013:88](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-88&m=dev)     | `2013-88`   |
| 5   | RecetaEditButton      | [2013:131](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-131&m=dev)   | `2013-131`  |
| 6   | RecetaStatusButton    | [2013:126](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-126&m=dev)   | `2013-126`  |
| 6a  | RecetaStatusButton    | [2013:206](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-206&m=dev)   | `2013-206`  |
| 7   | RecetaTableRow        | [2013:120](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-120&m=dev)   | `2013-120`  |
| 8   | RecetaNavItem         | [2013:12](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-12&m=dev)     | `2013-12`   |
| 8a  | RecetaNavItem         | [2013:22](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-22&m=dev)     | `2013-22`   |
| 9   | RecetaResultButton    | [2013:972](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-972&m=dev)   | `2013-972`  |
| 9a  | RecetaResultButton    | [2013:1008](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1008&m=dev) | `2013-1008` |
| 9b  | RecetaResultButton    | [2013:1045](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1045&m=dev) | `2013-1045` |
| 10  | RecetaHistoryTableRow | [2013:946](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-946&m=dev)   | `2013-946`  |
| 10a | RecetaHistoryTableRow | [2013:981](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-981&m=dev)   | `2013-981`  |
| 10b | RecetaHistoryTableRow | [2013:1018](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1018&m=dev) | `2013-1018` |

> **Naming note:** Component names are provisional. Match Figma layer/component names during implementation; rename folders only if design confirms a better shared-library name.

---

# Component Specifications

## 1. RecetaMetricCard - Nodes `2013-49`, `2013-54`, `2013-59`, `2013-912`, `2013-917`, `2013-922`, `2013-927`

### Figma

- [2013-49](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-49&m=dev)
- [2013-54](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-54&m=dev)
- [2013-59](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-59&m=dev)
- [2013-912](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-912&m=dev)
- [2013-917](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-917&m=dev)
- [2013-922](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-922&m=dev)
- [2013-927](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-927&m=dev)

### Requirements

The card set has **three main visual types** in Figma. Implement one reusable card component with variants instead of separate duplicated components.

```ts
variant?: 'type-1' | 'type-2' | 'type-3';
title?: string;
value?: string | number;
description?: string;
icon?: React.ReactNode;
loading?: boolean;
```

- Validate the final variant names against Figma layer/component names
- Support the seven Figma nodes as visual states/examples of the same card family
- `theme`, `size` (sm | md | xl)
- Optional `loading` -> Skeleton
- Icon slot should use the closest matching icon from the project icon library
- No Figma image assets as card content

### Stories

```txt
Type1
Type2
Type3
AllVariants
Loading
DarkMode
Sizes
```

---

## 2. RecetaSearch - Node `2013-65`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-65&m=dev)

### Requirements

Search input / buscador for receta lists.

```ts
value?: string;
placeholder?: string;
onChange?: (value: string) => void;
onClear?: () => void;
disabled?: boolean;
```

- Match Figma height, radius, icon placement, placeholder style, and spacing
- Search icon and optional clear icon must be real icons
- `theme`, `size`
- Keyboard and screen reader friendly

### Stories

```txt
Default
WithValue
Clearable
Disabled
DarkMode
Sizes
```

---

## 3. RecetaActionButton - Node `2013-80`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-80&m=dev)

### Requirements

Recipe action button / boton receta.

```ts
label?: string;
icon?: React.ReactNode;
onClick?: () => void;
disabled?: boolean;
loading?: boolean;
```

- Prefer composition with existing `Button` if the visual design can be matched
- Match icon + label alignment from Figma
- `theme`, `size`
- Hover / pressed / focus-visible states

### Stories

```txt
Default
WithIcon
Disabled
Loading
DarkMode
Sizes
```

---

## 4. RecetaTableHeader - Node `2013-88`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-88&m=dev)

### Requirements

Table title/header row for receta tables.

```ts
columns?: Array<{
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}>;
```

- Match Figma typography, column spacing, dividers, and surface
- `theme`, `size`
- Supports responsive overflow when used inside table/list containers

### Stories

```txt
Default
ManyColumns
DarkMode
Sizes
```

---

## 5. RecetaEditButton - Node `2013-131`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-131&m=dev)

### Requirements

Reusable edit button used by receta table rows.

```ts
label?: string;
ariaLabel?: string;
onClick?: () => void;
disabled?: boolean;
```

- Use closest edit/pencil icon from icon library
- May be icon-only or icon + label depending on Figma
- `theme`, `size`
- Required by `RecetaTableRow`

### Stories

```txt
Default
IconOnly
Disabled
DarkMode
Sizes
```

---

## 6. RecetaStatusButton - Nodes `2013-126`, `2013-206`

### Figma

- [Active](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-126&m=dev)
- [Inactive](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-206&m=dev)

### Requirements

Reusable active/inactive status button.

```ts
status?: 'active' | 'inactive';
label?: string;
onClick?: () => void;
disabled?: boolean;
```

- `active` MUST match node `2013-126`
- `inactive` MUST match node `2013-206`
- `aria-pressed` when used as a toggle
- `theme`, `size`
- Required by `RecetaTableRow`

### Stories

```txt
Active
Inactive
ToggleExample
Disabled
DarkMode
Sizes
```

---

## 7. RecetaTableRow - Node `2013-120`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-120&m=dev)

### Requirements

Recipe table info row. This component MUST compose:

- `RecetaEditButton`
- `RecetaStatusButton`

```ts
recipeName?: string;
category?: string;
updatedAt?: string;
status?: 'active' | 'inactive';
onEdit?: () => void;
onStatusChange?: (status: 'active' | 'inactive') => void;
```

- Match row layout, dividers, spacing, and table alignment from Figma
- Do not duplicate edit/status button styles inside the row
- `theme`, `size`
- Supports row content passed as structured props or slots if needed

### Stories

```txt
ActiveRow
InactiveRow
WithLongText
DarkMode
Sizes
```

---

## 8. RecetaNavItem - Nodes `2013-12`, `2013-22`

### Figma

- [Active](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-12&m=dev)
- [Inactive](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-22&m=dev)

### Requirements

Navigation list item for receta sections.

```ts
active?: boolean;
label?: string;
icon?: React.ReactNode;
href?: string;
onClick?: () => void;
```

- `active` MUST match node `2013-12`
- inactive/default MUST match node `2013-22`
- `aria-current="page"` when active and used as navigation
- `theme`, `size`

### Stories

```txt
Active
Inactive
WithIcon
DarkMode
Sizes
```

---

## 9. RecetaResultButton - Nodes `2013-972`, `2013-1008`, `2013-1045`

### Figma

- [OK](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-972&m=dev)
- [Advertence](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1008&m=dev)
- [Fallido](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1045&m=dev)

### Requirements

Reusable result/status button for history table states.

```ts
variant?: 'ok' | 'warning' | 'failed';
label?: string;
icon?: React.ReactNode;
onClick?: () => void;
disabled?: boolean;
```

- `ok` MUST match node `2013-972`
- `warning` MUST match node `2013-1008`
- `failed` MUST match node `2013-1045`
- Icon, border, text, and background should use semantic token mappings
- `theme`, `size`
- Required by `RecetaHistoryTableRow`

### Stories

```txt
Ok
Warning
Failed
Disabled
DarkMode
Sizes
```

---

## 10. RecetaHistoryTableRow - Nodes `2013-946`, `2013-981`, `2013-1018`

### Figma

- [2013-946](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-946&m=dev)
- [2013-981](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-981&m=dev)
- [2013-1018](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1018&m=dev)

### Requirements

History table info row using the result buttons from section 9.

```ts
recipeName?: string;
date?: string;
result?: 'ok' | 'warning' | 'failed';
details?: string;
onResultClick?: () => void;
```

- Compose `RecetaResultButton`
- Match all three Figma history/result examples
- Do not duplicate `RecetaResultButton` styles inside the row
- `theme`, `size`
- Supports structured row data and responsive overflow

### Stories

```txt
OkHistory
WarningHistory
FailedHistory
DarkMode
Sizes
```

---

# Theme Consistency Rules

## Dark Theme

- layered dark surfaces
- subtle borders `rgba(white, 0.08-0.14)`
- muted secondary text
- semantic colors for active/inactive and result states
- brand gold `#d4a017` only when Figma uses it for primary emphasis

## Light Theme

- same spacing and proportions as dark
- soft borders `rgba(black, 0.08-0.12)`
- readable primary text
- no pure white panels without border context
- semantic colors must remain accessible on light backgrounds

---

# Recommended Folder Structure

```txt
packages/ui/src/components/receta/
 ├── receta-metric-card/
 ├── receta-search/
 ├── receta-action-button/
 ├── receta-table-header/
 ├── receta-edit-button/
 ├── receta-status-button/
 ├── receta-table-row/
 ├── receta-nav-item/
 ├── receta-result-button/
 └── receta-history-table-row/
```

---

# Export Barrel

Add to `packages/ui/src/index.tsx`:

```ts
export * from './components/receta/receta-metric-card';
export * from './components/receta/receta-search';
export * from './components/receta/receta-action-button';
export * from './components/receta/receta-table-header';
export * from './components/receta/receta-edit-button';
export * from './components/receta/receta-status-button';
export * from './components/receta/receta-table-row';
export * from './components/receta/receta-nav-item';
export * from './components/receta/receta-result-button';
export * from './components/receta/receta-history-table-row';
```

---

# Acceptance Criteria

- [ ] All Figma nodes listed in this task are inspected in dev mode
- [ ] PNG references added under `tasks/packages-ui/design-references/receta/`
- [ ] Every component: `.tsx` + `.module.scss` + `.stories.tsx` + `index.ts`
- [ ] Every component supports `theme: 'light' | 'dark'`
- [ ] Every component supports `size: 'sm' | 'md' | 'xl'` with width and height scaling
- [ ] `RecetaMetricCard` implements the three card types from Figma and covers all seven card nodes
- [ ] `RecetaTableRow` composes `RecetaEditButton` and `RecetaStatusButton`
- [ ] `RecetaHistoryTableRow` composes `RecetaResultButton`
- [ ] `RecetaStatusButton` supports active and inactive variants from Figma
- [ ] `RecetaNavItem` supports active and inactive variants from Figma
- [ ] `RecetaResultButton` supports ok, warning, and failed variants from Figma
- [ ] Storybook defaults to light; each component has a `DarkMode` story
- [ ] Storybook exposes `Sizes` story or size control for sm / md / xl
- [ ] No hardcoded colors in TSX
- [ ] No Figma screenshots/images rendered as UI
- [ ] Components exported from `packages/ui/src/index.tsx`
- [ ] Focus, keyboard, and screen reader behavior verified for interactive components
- [ ] `pnpm --filter @restopsiq/ui typecheck` passes

---

# Implementation Checklist (Agent)

1. Open each Figma node link in dev mode (`?m=dev`)
2. Export light/dark PNG references -> `design-references/receta/`
3. Confirm final component and variant names from Figma layer/component names
4. Implement shared size/theme pattern first
5. Build atomic buttons first: `RecetaEditButton`, `RecetaStatusButton`, `RecetaResultButton`
6. Build composed rows using the atomic buttons
7. Build cards, search, table header, and nav item
8. Wire Storybook under `Receta/` or `Recipes/` namespace
9. Run typecheck + Storybook visual pass
10. Use icons from the project icon library that are visually closest to Figma

---

# Figma Links (Quick Reference)

```txt
2013-49    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-49&m=dev
2013-54    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-54&m=dev
2013-59    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-59&m=dev
2013-912   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-912&m=dev
2013-917   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-917&m=dev
2013-922   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-922&m=dev
2013-927   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-927&m=dev
2013-65    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-65&m=dev
2013-80    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-80&m=dev
2013-88    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-88&m=dev
2013-131   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-131&m=dev
2013-126   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-126&m=dev
2013-206   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-206&m=dev
2013-120   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-120&m=dev
2013-12    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-12&m=dev
2013-22    https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-22&m=dev
2013-972   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-972&m=dev
2013-1008  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1008&m=dev
2013-1045  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1045&m=dev
2013-946   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-946&m=dev
2013-981   https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-981&m=dev
2013-1018  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1018&m=dev
```

Reference tasks:

- `tasks/packages-ui/03-Data-Display.md` (table/data-display patterns)
- `tasks/packages-ui/05-field-ops-figma-components.md` (Figma component task structure)
