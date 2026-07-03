# Task: Data Display Components — `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[DATA-DISPLAY]` `[ANALYTICS]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `pending`  
**Created:** 2026-05-20  
**Depends On:** `01-design-tokens.md`, `02-button-component.md`, `03-badge-component.md`, `04-feedback-components.md`, `02-Formularios.md`

---

# Context

Build the complete Data Display Components for the shared UI library located in:

```txt
packages/ui
```

These components are used in supply chain workflows, analytics dashboards, operational reports, inventory visibility, purchasing flows, dispatch tracking, and POS screens.

All components MUST follow the same architectural and visual patterns already implemented in:

- Button
- BadgeButton
- Card
- Advanced Form Components
- Feedback Components

Reference implementation:

```txt
ComponentName/
 ├── ComponentName.tsx
 ├── ComponentName.module.scss
 ├── ComponentName.stories.tsx
 ├── index.ts
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
- readable table rows and fixed columns

Avoid:

- pure black surfaces
- aggressive shadows
- blue focus borders
- high saturation borders
- low-contrast table text

---

## Light Theme

Light mode MUST preserve the exact same spacing and proportions as dark mode.

Must use:

- soft warm backgrounds
- subtle borders
- muted typography
- low contrast separators
- identical elevation hierarchy
- readable selected/hover states

Avoid:

- pure white surfaces without borders
- strong borders
- inconsistent spacing
- invisible row dividers

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

Hardcoded values are forbidden except explicitly approved semantic status mappings and brand gold accents.

---

# Required Components

```txt
DataTable
KPICard / StatCard
StatusBadge / Semaforo
Timeline
DataList / DescriptionList
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

## DataTable

### Foundation

DataTable MUST be built on:

```txt
@tanstack/table-core v8
@tanstack/react-table v8
@tanstack/react-virtual
```

### Features

- Column sorting
- Column filtering
- Server-side pagination
- Row selection with checkbox
- Row actions via dropdown menu
- Sticky columns
- Column resizing
- Export to CSV
- Export to Excel
- Loading skeleton state
- Automatic EmptyState when no data exists
- Virtualization for large datasets
- dark/light support

### Server-Side Requirements

Pagination MUST be server-side friendly:

```ts
pageIndex;
pageSize;
sortBy;
filters;
totalRows;
isLoading;
onPageChange;
onSortChange;
onFilterChange;
```

CSV/Excel export MUST support exporting data from the server, not only the current visible page.

Required API shape:

```ts
onExport?: (format: 'csv' | 'xlsx') => Promise<DataTableExportRow[]>
```

### Loading / Empty States

- Skeleton must preserve table height and column layout
- EmptyState must be automatic when `data.length === 0 && !isLoading`
- Loading and empty states must not cause layout jump

### Performance

DataTable MUST handle:

```txt
1000+ rows without UI lag
```

Virtual scrolling is required for large datasets.

### Stories

```txt
Default
Sortable
Filterable
SelectableRows
RowActions
StickyColumns
ResizableColumns
ServerPagination
LoadingSkeleton
EmptyState
Virtualized1000Rows
ExportCsv
ExportExcel
DarkMode
```

---

## KPICard / StatCard

### Features

Card for individual metrics used in dashboards.

Props:

```ts
label: string
value: React.ReactNode
delta?: number | string
deltaLabel?: string
icon?: React.ReactNode
trend?: 'up' | 'down' | 'neutral'
color?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
variant?: 'default' | 'compact'
loading?: boolean
theme?: 'light' | 'dark'
```

### Requirements

- Supports formatted values
- Shows delta percentage vs previous period
- Delta colors must follow trend
- Icons must align with dashboard cards
- Compact variant must preserve visual hierarchy
- Skeleton must be exactly the same size as final content
- dark/light support

### Use Cases

```txt
Sales today
Pending purchase orders
Inventory value
Dispatch completion rate
Stock alerts
POS average ticket
```

### Stories

```txt
Default
WithDeltaUp
WithDeltaDown
NeutralTrend
Compact
WithIcon
LoadingSkeleton
DarkMode
```

---

## StatusBadge / Semaforo

### Features

Badge with a colored dot for business states.

Required automatic status mappings:

```txt
PENDING   -> yellow
SUCCESS   -> green
COMPLETED -> green
FAILED    -> red
ERROR     -> red
CANCELLED -> red
DRAFT     -> gray
ACTIVE    -> green animated dot
INACTIVE  -> gray
ARCHIVED  -> gray
WARNING   -> yellow
PROCESSING -> blue or gold animated dot
APPROVED  -> green
REJECTED  -> red
```

Semaforo stock mapping:

```txt
OK       -> green
LOW      -> yellow
CRITICAL -> red
```

### Requirements

- Dot variant
- Pill variant
- Optional animated dot for active/live states
- Business enum mapping must be centralized
- Unknown status must fall back to gray
- dark/light support

### Stories

```txt
Default
AllStatuses
StockSemaforo
AnimatedActive
PillVariant
DotOnly
DarkMode
```

---

## Timeline

### Features

Vertical list of events ordered by date.

Props per item:

```ts
timestamp: string | Date
title: string
description?: React.ReactNode
icon?: React.ReactNode
color?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold'
```

### Requirements

- Items must render in chronological or reverse chronological order
- Supports collapsible behavior when there are many items
- Collapsed view must show the most recent items first
- Expand/collapse control must be keyboard accessible
- Connector line must be visible in dark and light
- dark/light support

### Use Cases

```txt
Purchase order history
Dispatch status events
Order audit log
Inventory adjustment log
Payment status timeline
```

### Stories

```txt
Default
WithIcons
ManyItemsCollapsed
Expanded
BusinessEvents
DarkMode
```

---

## DataList / DescriptionList

### Features

Key-value list for entity details.

Props:

```ts
items: Array<{
  label: string
  value: React.ReactNode
  span?: 1 | 2
}>
columns?: 1 | 2
theme?: 'light' | 'dark'
```

### Requirements

- Grid layout with 2 columns by default
- `span: 2` item must occupy the full row
- Labels use muted typography
- Values use readable primary typography
- Supports links, badges, and formatted values
- Responsive layout collapses to 1 column on mobile
- dark/light support

### Use Cases

```txt
Supplier detail
Purchase order detail
DIAN invoice detail
Product master data
POS register detail
Shipment detail
```

### Stories

```txt
Default
TwoColumns
WithFullSpanItem
WithBadges
SupplierDetail
InvoiceDetail
DarkMode
```

---

# Accessibility Rules

All components MUST support:

```txt
aria-live
aria-busy
aria-sort
aria-selected
aria-expanded
aria-controls
aria-describedby
role="table"
role="row"
role="cell"
role="status"
focus-visible
keyboard navigation
```

DataTable specific accessibility:

- Sortable headers must announce sort direction
- Row selection must be keyboard accessible
- Row actions dropdown must be keyboard accessible
- Pagination controls must have accessible labels
- Export buttons must announce loading state

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
- selected states
- semantic colors
- empty states
- skeleton states
- elevation hierarchy
- table row readability
- sticky column readability

---

# Forbidden Design Patterns

The following are NOT allowed:

- pure black backgrounds
- pure white surfaces without borders
- blue focus borders in dark mode
- inconsistent border radius
- hardcoded typography values
- hardcoded spacing values
- different heights between themes
- inconsistent spacing scales
- strong saturated borders
- table cells that shift during loading
- skeleton states with different dimensions than loaded content
- CSV export that only exports the current UI page

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
- [ ] All hover/focus/selected states work in both themes
- [ ] Visual consistency maintained across all components
- [ ] DataTable handles 1000 rows without lag using virtualization
- [ ] DataTable supports server-side pagination
- [ ] DataTable supports column sorting and filtering
- [ ] DataTable supports row selection with checkbox
- [ ] DataTable supports row actions dropdown
- [ ] DataTable supports sticky columns
- [ ] DataTable supports column resizing
- [ ] DataTable exports CSV with server data, not only current page
- [ ] DataTable exports Excel with server data, not only current page
- [ ] DataTable shows skeleton automatically during loading
- [ ] DataTable shows EmptyState automatically when empty
- [ ] KPICard skeleton is exactly the same size as loaded content
- [ ] StatusBadge covers ALL system status enums
- [ ] StatusBadge stock semaforo covers OK, LOW, CRITICAL
- [ ] Timeline supports collapsed view for many items
- [ ] DataList supports `span: 1 | 2` and responsive layout

---

# Recommended Folder Structure

```txt
packages/ui/
 └── src/
      └── components/
           └── data-display/
                ├── data-table/
                ├── kpi-card/
                ├── status-badge/
                ├── timeline/
                └── data-list/
```

Reference assets:

- `docs/design-references/dashboard-dark.png`
- `docs/design-references/dashboard-light.png`
