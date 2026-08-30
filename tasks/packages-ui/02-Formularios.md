# Task: Advanced Form Components — `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[FORMS]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `pending`  
**Created:** 2026-05-19  
**Depends On:** `01-design-tokens.md`, `02-button-component.md`, `03-badge-component.md`, `04-feedback-components.md`

---

# Context

Build the complete Advanced Form Components for the shared UI library located in:

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

These components are used in supply chain flows, tenant configuration, and onboarding screens.

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
Select / Combobox
DatePicker / DateRangePicker
NumberInput
SearchInput
Form + FormField
FileUpload
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

## Select / Combobox

### Features

- Radix Select for fixed option lists
- Async search Combobox for long lists (suppliers, inputs, products)
- Multi-select with selection chips
- Virtualization via `@tanstack/virtual` for lists > 100 items
- dark/light support

### Stories

```txt
Default
WithSearch
MultiSelect
AsyncLoading
DarkMode
Virtualized
```

---

## DatePicker / DateRangePicker

### Features

- Calendar built with `react-day-picker`
- DateRangePicker for report filters
- Colombian date format: `dd/mm/yyyy`
- Manual date entry (keyboard input — not click-only)
- Shortcuts: today, this week, this month, this year
- Compatible with `react-hook-form`
- dark/light support

### Stories

```txt
Default
DateRange
WithShortcuts
ManualEntry
DarkMode
```

---

## NumberInput

### Features

- Increment/decrement buttons
- COP currency format: thousands separator = `.`, no decimals
- Quantity format with decimals for inventory (kg, l)
- Blocks non-numeric character input
- Never allows negative values in price fields
- Compatible with `react-hook-form`

### Stories

```txt
Currency
Quantity
WithBounds
Disabled
DarkMode
```

---

## SearchInput

### Features

- Search icon + clear (X) button
- Configurable debounce (default: 300ms)
- Dropdown results variant (Combobox mode)
- Loading state while searching
- dark/light support

### Stories

```txt
Default
WithDebounce
WithDropdown
LoadingState
DarkMode
```

---

## Form + FormField

### Features

- Wrapper integrating `react-hook-form` + `zod`
- `FormField` encapsulates: label, input, error message, hint text
- Configurable validation mode: `onChange` or `onBlur`
- Automatic `aria-describedby` wiring for error messages
- No extra wrapper required to integrate with any form input

### Stories

```txt
Default
WithValidation
OnBlurMode
WithHint
DarkMode
```

---

## FileUpload

### Features

- Drag and drop + click to upload
- Image preview before upload
- File type restriction
- Maximum file size enforcement
- Progress bar during upload
- dark/light support

### Use Cases

```txt
Tenant logos
Product images
DIAN certificate (.p12)
```

### Stories

```txt
Default
ImagePreview
WithRestrictions
UploadProgress
DarkMode
```

---

# Accessibility Rules

All components MUST support:

```txt
aria-live
aria-busy
aria-invalid
aria-describedby (for errors)
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
- [ ] Combobox async handles 1000+ options without lag (virtual scroll)
- [ ] DatePicker accepts manual keyboard date entry
- [ ] NumberInput never allows negative values in price fields
- [ ] All components integrate with `react-hook-form` without an extra wrapper

---

# Recommended Folder Structure

```txt
packages/ui/
 └── src/
      └── components/
           └── forms/
                ├── select/
                ├── combobox/
                ├── date-picker/
                ├── date-range-picker/
                ├── number-input/
                ├── search-input/
                ├── form/
                ├── form-field/
                └── file-upload/
```

Reference assets:

- `docs/design-references/dashboard-dark.png`
- `docs/design-references/dashboard-light.png`
