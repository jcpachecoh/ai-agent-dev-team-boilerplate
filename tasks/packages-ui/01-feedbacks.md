# Task: UI Feedback System Components — `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `pending`  
**Created:** 2026-05-16  
**Depends On:** `01-design-tokens.md`, `02-button-component.md`, `03-badge-component.md`

---

# Context

Build the complete Feedback & Loading System for the shared UI library located in:

```txt
packages/ui
```

All components MUST follow the exact same architectural and visual patterns already implemented in:

- Button
- BadgeButton

Reference implementation:

```txt
Button/
 ├── Button.tsx
 ├── Button.module.scss
 ├── Button.stories.tsx
```

---

# Design Reference Images

The following dashboard screenshots are the official design references for ALL components.

These screenshots define the visual language for:

- dark mode
- light mode
- borders
- shadows
- surface hierarchy
- spacing
- typography
- hover states
- card elevation
- muted colors
- semantic colors
- component sizing

Reference assets:

```txt
docs/design-references/dashboard-dark.png
docs/design-references/dashboard-light.png
```

---

# Theme Consistency Rules

## Dark Theme

Dark mode MUST use:

- layered dark surfaces
- subtle borders
- soft shadows
- muted secondary text
- gold/yellow accent system
- semantic status colors

Avoid:

- pure black surfaces
- aggressive shadows
- high saturation borders

---

## Light Theme

Light mode MUST preserve the exact same spacing and proportions as dark mode.

Must use:

- soft warm backgrounds
- subtle borders
- muted typography
- low contrast separators
- identical elevation hierarchy

Avoid:

- pure white surfaces
- strong borders
- inconsistent spacing

---

# Shared SCSS Variables

ALL components MUST use the shared SCSS variables from:

```scss
styles/abstracts/_variables.scss
```

Mandatory imports:

```scss
@use '../../styles/abstracts/variables' as *;
@use '../../styles/abstracts/mixins' as *;
```

The `_variables.scss` file MUST be the single source of truth for:

- colors
- typography
- spacing
- shadows
- border radius
- transitions
- z-index
- breakpoints

Hardcoded values are forbidden except explicitly approved gradients/shadows.

---

# Required Components

```txt
Toast / Sonner
Alert / AlertBanner
Skeleton
EmptyState
ErrorBoundary
ProgressBar
```

---

# Global Component Structure

Every component MUST include:

```txt
ComponentName/
 ├── ComponentName.tsx
 ├── ComponentName.module.scss
 ├── ComponentName.stories.tsx
 ├── index.ts
```

---

# Component Requirements

## Toast / Sonner

### Features

- success
- error
- warning
- info
- loading
- inline actions
- configurable duration
- configurable position
- stack limit = 3
- dark/light support

### Stories

```txt
Success
Error
Warning
Info
Loading
DarkMode
InlineAction
```

---

## Alert / AlertBanner

### Features

- dismissible
- optional icon
- optional title
- action slot
- inline mode
- banner mode
- responsive layout

### Stories

```txt
Success
Error
Warning
Info
Dismissible
Banner
DarkMode
```

---

## Skeleton

### Variants

```txt
text
circular
rectangular
table
```

### Requirements

- shimmer animation
- same dimensions as final content
- composable API
- dark/light support

---

## EmptyState

### Variants

```txt
search
create
error
```

### Props

```txt
icon
title
description
action
```

---

## ErrorBoundary

### Requirements

- page-level variant
- section-level variant
- retry button
- fallback UI
- automatic logging
- production-safe behavior

### Monitoring

Recommended service:

- Sentry

Must support:

```ts
captureException(error);
```

---

## ProgressBar

### Variants

```txt
success
warning
danger
info
```

### Types

```txt
linear
circular
```

### Threshold Rules

```txt
0-59 success
60-84 warning
85-100 danger
```

---

# Accessibility Rules

All components MUST support:

```txt
aria-live
aria-busy
aria-invalid
role="alert"
role="status"
focus-visible
keyboard navigation
```

---

# Dark / Light Validation

Every Storybook story MUST be validated in BOTH:

```txt
Light Mode
Dark Mode
```

Validation includes:

- borders
- spacing
- shadows
- typography
- hover states
- semantic colors
- readability
- elevation hierarchy

---

# Forbidden Design Patterns

The following are NOT allowed:

- pure black backgrounds
- pure white surfaces
- inconsistent border radius
- hardcoded colors outside `_variables.scss`
- different heights between themes
- inconsistent spacing scales
- strong saturated borders

---

# Acceptance Criteria

- [ ] All components compile successfully
- [ ] Storybook renders all stories
- [ ] Dark mode works correctly
- [ ] Light mode works correctly
- [ ] Components visually match dashboard references
- [ ] No accessibility violations
- [ ] All components use `_variables.scss`
- [ ] No hardcoded typography values
- [ ] No hardcoded spacing values
- [ ] Every component includes `.tsx + .module.scss + .stories.tsx + index.ts`
- [ ] All hover/focus states work in both themes
- [ ] Visual consistency maintained across all components

---

# Recommended Folder Structure

```txt
packages/ui/
 └── src/
      └── components/
           └── feedback/
                ├── toast/
                ├── alert/
                ├── skeleton/
                ├── empty-state/
                ├── error-boundary/
                └── progress/
```

Reference assets:

- `docs/design-references/dashboard-dark.png`
- `docs/design-references/dashboard-light.png`
