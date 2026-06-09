# Task: Proveedor / Supplier Management UI Components (Figma) — `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[FIGMA]` `[PROCUREMENT]` `[SUPPLIERS]` `[TABLES]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `done`  
**Created:** 2026-05-29  
**Depends On:** `01-feedbacks.md`, `02-Formularios.md`, `03-Data-Display.md`, `05-field-ops-figma-components.md`, `06-receta-figma-components.md`

---

# Context

Implement the **Supplier Management (Gestión de Proveedores)** component set from Figma into the shared UI library:

```txt
packages/ui
```

These components support procurement flows: supplier list KPIs, search/filters, supplier and catalog tables, supplier detail tabs, form sections, contact/ops panels, and product edit modal.

**Figma is the visual source of truth** for layout, spacing, typography, icons, and states. This task defines behavior, API, sizing, theming, and acceptance criteria aligned with the rest of `packages/ui`.

All components MUST follow the same architectural patterns as:

- Button / BadgeButton
- Receta components (`06-receta-figma-components.md`)
- Field Operations components (`05-field-ops-figma-components.md`)

Reference implementation:

```txt
ComponentName/
 ├── ComponentName.tsx
 ├── ComponentName.module.scss
 ├── ComponentName.stories.tsx
 ├── index.ts
```

Shared types (recommended):

```txt
packages/ui/src/components/proveedor/shared/proveedor-types.ts
```

```ts
export type ProveedorTheme = 'light' | 'dark';
export type ProveedorSize = 'sm' | 'md' | 'xl';
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
tasks/packages-ui/design-references/proveedor/
```

See `tasks/packages-ui/design-references/proveedor`

**Every component** MUST be validated against:

1. Figma dev-mode specs (primary)
2. Local PNG references in `design-references/proveedor/` (light + dark when available)

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

| Size   | Width behavior    | Height behavior              | Notes                                     |
| ------ | ----------------- | ---------------------------- | ----------------------------------------- |
| **sm** | compact per Figma | compact touch target         | Dense toolbar/table contexts              |
| **md** | default per Figma | default touch target         | Storybook default                         |
| **xl** | `100%` of parent  | scales per Figma proportions | **Full-width** tables, tab bars, toolbars |

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

### Dynamic tables (auto layout)

**`ProveedorSuppliersTable`** and **`ProveedorCatalogTable`** MUST:

- Grow vertically when more rows are passed (no fixed row count in code)
- Use flex/grid column templates aligned with their table headers
- At **`size="xl"`**, span **`width: 100%`** of the parent (full-bleed list/table)
- Support horizontal overflow on `sm` / `md` when columns exceed viewport (scroll container, not clipped text)

## Shared SCSS

```scss
@use '../../styles/abstracts/variables' as *;
@use '../../styles/abstracts/mixins' as *;
```

Hardcoded hex in component TSX is forbidden. Approved semantic mappings and brand gold (`#d4a017`) / enterprise orange (`#e8943a`) may appear in SCSS only when tied to tokens or documented variants.

## Storybook

- `tags: ['autodocs']`
- Meta-level `args: { theme: 'light', size: 'md' }`
- Controls: `theme` (radio), `size` (select: sm | md | xl)
- Decorator: padded container so `xl` full-width is visible

## Accessibility

```txt
focus-visible outlines
keyboard activation for buttons, tabs, and row actions
aria-label for icon-only buttons
aria-current="page" on active detail tabs
role="table" / role="row" / role="columnheader" / role="cell" for table compositions
minimum touch target 44px on md
```

## Forbidden

```txt
- pure black / pure white surfaces
- hardcoded colors in TSX
- Figma screenshots used as rendered UI
- sizes that only change font-size without width/height
- fixed-height tables that clip when rows.length increases
- duplicating badge/button styles inside rows instead of composing atomic components
- implementing ProveedorProductModal before ProveedorFormActions exists
```

---

# Implementation Order (Required)

Follow this sequence to match dependencies called out in design review:

```txt
1. Atomic: ProveedorStatusBadge, ProveedorActionButton, ProveedorMetricCard
2. Rows: ProveedorTableRow, ProveedorCatalogTableRow, ProveedorCatalogEditButton
3. Headers: ProveedorTableHeader, ProveedorCatalogTableHeader
4. Dynamic tables: ProveedorSuppliersTable, ProveedorCatalogTable
5. ProveedorDetailTab (single tab) → ProveedorDetailTabBar (composed, dynamic width at xl)
6. ProveedorFormActions (Cancelar / Guardar) — required before modal
7. ProveedorProductModal (compose form fields + footer actions pattern)
8. Layout/shell: ProveedorPageHeader, ProveedorListToolbar, ProveedorDetailHeader, form sections, info panels
```

---

# Required Components (Figma Map)

| #   | Component                   | Figma node                                                                                       | Node ID     | Notes                                                       |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------- |
| 1   | ProveedorPageHeader         | [2013:1874](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1874&m=dev) | `2013-1874` | Brand block: logo initial, title, subtitle                  |
| 2   | ProveedorMetricCard         | [2013:1886](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1886&m=dev) | `2013-1886` | KPI card; configurable value + color                        |
| 2a  | ProveedorMetricCard         | [2013:1891](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1891&m=dev) | `2013-1891` | Example: pending count                                      |
| 2b  | ProveedorMetricCard         | [2013:1896](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1896&m=dev) | `2013-1896` | Same shell as `1886`; different value style (currency)      |
| 2c  | ProveedorMetricCard         | [2013:1901](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1901&m=dev) | `2013-1901` | Example: product totals                                     |
| 3   | ProveedorListToolbar        | [2013:1906](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1906&m=dev) | `2013-1906` | Search + filter slots + action buttons                      |
| 4   | ProveedorActionButton       | [2013:1934](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1934&m=dev) | `2013-1934` | Primary CTA e.g. `NUEVO PROVEEDOR`                          |
| 4a  | ProveedorActionButton       | [2013:1928](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1928&m=dev) | `2013-1928` | Secondary: `EXPORTAR` (inside toolbar)                      |
| 4b  | ProveedorActionButton       | [2013:2105](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2105&m=dev) | `2013-2105` | Catalog: `NUEVO PRODUCTO`                                   |
| 5   | ProveedorTableHeader        | [2013:1941](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1941&m=dev) | `2013-1941` | Suppliers list columns                                      |
| 6   | ProveedorStatusBadge        | [2013:1956](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1956&m=dev) | `2013-1956` | Supplier + catalog status chips                             |
| 7   | ProveedorTableRow           | [2013:1952](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1952&m=dev) | `2013-1952` | Single supplier row                                         |
| 8   | ProveedorSuppliersTable     | [2013:1939](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1939&m=dev) | `2013-1939` | **Dynamic** header + rows; `xl` = full width                |
| 9   | ProveedorFormHeader         | [2013:1819](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1819&m=dev) | `2013-1819` | Back + form title                                           |
| 10  | ProveedorFormActions        | [2013:1826](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1826&m=dev) | `2013-1826` | **Cancelar / Guardar** — implement before modal             |
| 11  | ProveedorFormSection        | [2013:1837](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1837&m=dev) | `2013-1837` | `Información General` fields grid                           |
| 11a | ProveedorFormSection        | [2013:1857](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1857&m=dev) | `2013-1857` | `Condiciones Comerciales` fields grid                       |
| 12  | ProveedorDetailHeader       | [2013:2052](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2052&m=dev) | `2013-2052` | Supplier name, code/NIT, status badge                       |
| 13  | ProveedorDetailTab          | [2013:2076](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2076&m=dev) | `2013-2076` | **Implement first** (single tab)                            |
| 14  | ProveedorDetailTabBar       | [2013:2075](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2075&m=dev) | `2013-2075` | **Then** compose tabs; dynamic count; `xl` full width       |
| 15  | ProveedorCatalogTableHeader | [2013:2111](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2111&m=dev) | `2013-2111` | Catalog columns (parent table `2013:2110`)                  |
| 16  | ProveedorCatalogEditButton  | [2013:2129](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2129&m=dev) | `2013-2129` | Row `EDITAR` action                                         |
| 17  | ProveedorCatalogTableRow    | [2013:2120](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2120&m=dev) | `2013-2120` | Catalog product row                                         |
| 18  | ProveedorCatalogTable       | [2013:2110](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2110&m=dev) | `2013-2110` | **Dynamic** catalog table; `xl` = full width                |
| 19  | ProveedorProductModal       | [2013:2305](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2305&m=dev) | `2013-2305` | **After** `ProveedorFormActions`; reuse cancel/save pattern |
| 20  | ProveedorContactPanel       | [2013:2413](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2413&m=dev) | `2013-2413` | Read-only contact fields                                    |
| 21  | ProveedorMetricsPanel       | [2013:2437](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2437&m=dev) | `2013-2437` | Read-only operational metrics                               |

> **Naming note:** Component names are provisional. Match Figma layer/component names during implementation (`SupplierDetail`, `SuppliersList`, etc.). Rename folders only if design confirms a better shared-library name.

> **Status badge reference nodes (variants):** `ACTIVO` `2013-1956`, `INACTIVO` `2013-1992`, `PENDIENTE` `2013-2016`; catalog `DISPONIBLE` `2013-2127`, `LIMITADO` `2013-2169`.

---

# Component Specifications

## 1. ProveedorPageHeader — Node `2013-1874`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1874&m=dev)

### Requirements

Shell header for supplier management screens.

```ts
title?: string;           // default: "SUPPLIER MANAGEMENT"
subtitle?: string;        // default: "PROCUREMENT · RESTOPSIQ ENTERPRISE"
brandInitial?: string;    // default: "S"
icon?: React.ReactNode;
```

- Match logo block, title stack, and spacing from Figma
- `theme`, `size`
- Use icon library for brand mark if not using `brandInitial` text

### Stories

```txt
Default
CustomTitle
DarkMode
Sizes
```

---

## 2. ProveedorMetricCard — Nodes `2013-1886`, `2013-1891`, `2013-1896`, `2013-1901`

### Figma

- [2013-1886](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1886&m=dev) — numeric KPI (e.g. `6` / PROVEEDORES ACTIVOS)
- [2013-1891](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1891&m=dev) — pending approval
- [2013-1896](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1896&m=dev) — currency KPI (e.g. `$8.25M`)
- [2013-1901](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1901&m=dev) — product totals

### Requirements

One reusable KPI card. Nodes `1886` and `1896` share the same layout; **only value typography/color treatment differs**.

```ts
label?: string;
value?: string | number;
valueFormat?: 'plain' | 'currency' | 'compact'; // maps to Figma styles
valueColor?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'enterprise' | string;
loading?: boolean;
```

Rules:

1. **`value`** and **`valueColor`** are independently configurable (user requirement)
2. `valueColor` may be a semantic token **or** a CSS color string (hex) for one-off Figma accents
3. `valueFormat: 'currency'` matches `$8.25M` style from `2013-1896`
4. Optional left accent bar if present in Figma for a variant — bind to `valueColor`
5. `theme`, `size`; row of cards at `xl` distributes evenly at `width: 100%` when used inside a metrics bar container

### Stories

```txt
ActiveSuppliers
PendingApproval
AccountsPayableBalance
ProductTotals
CustomValueColor
Loading
DarkMode
Sizes
```

---

## 3. ProveedorListToolbar — Node `2013-1906`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1906&m=dev)

### Requirements

Toolbar composing search, filter dropdowns, and trailing actions.

```ts
searchValue?: string;
searchPlaceholder?: string;
onSearchChange?: (value: string) => void;
categoryFilter?: React.ReactNode;  // slot for Dropdown
statusFilter?: React.ReactNode;
exportAction?: React.ReactNode;    // ProveedorActionButton variant export
primaryAction?: React.ReactNode;   // ProveedorActionButton variant new-supplier
```

- Match Figma layout: search (320px at md), two dropdowns, `EXPORTAR`, `NUEVO PROVEEDOR`
- Prefer composing existing `RecetaSearch` or shared search input if visual parity is achievable
- `theme`, `size`; **`xl`** = full width with actions pinned to trailing edge

### Stories

```txt
Default
WithFilters
WithExport
FullWidthXL
DarkMode
Sizes
```

---

## 4. ProveedorActionButton — Nodes `2013-1934`, `2013-1928`, `2013-2105`

### Figma

- [Primary — NUEVO PROVEEDOR](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1934&m=dev)
- [Export](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1928&m=dev)
- [NUEVO PRODUCTO](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2105&m=dev)

### Requirements

```ts
variant?: 'primary' | 'secondary' | 'export' | 'new-product';
label?: string;
icon?: React.ReactNode;
onClick?: () => void;
disabled?: boolean;
loading?: boolean;
```

| Variant       | Figma reference | Notes                        |
| ------------- | --------------- | ---------------------------- |
| `primary`     | `2013-1934`     | Gold/enterprise emphasis CTA |
| `export`      | `2013-1928`     | Outlined/secondary with icon |
| `new-product` | `2013-2105`     | Catalog context CTA          |
| `secondary`   | —               | Generic fallback             |

- `theme`, `size`
- Icon + label alignment per Figma

### Stories

```txt
NewSupplier
Export
NewProduct
Disabled
Loading
DarkMode
Sizes
```

---

## 5. ProveedorTableHeader — Node `2013-1941`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1941&m=dev)

### Requirements

```ts
columns?: Array<{
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}>;
```

Default columns from Figma: ID, PROVEEDOR, CATEGORÍA, ESTADO, CONDICIÓN PAGO, LEAD TIME, CONFIABILIDAD, PRODUCTOS, SALDO CXP, ÚLTIMA OC.

- `theme`, `size`
- Sticky header optional if parent scrolls (document in props)

### Stories

```txt
Default
DarkMode
Sizes
```

---

## 6. ProveedorStatusBadge — Node `2013-1956` (+ variants)

### Figma

- [ACTIVO](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1956&m=dev)
- INACTIVO — see row `2013-1992`
- PENDIENTE — see row `2013-2016`
- DISPONIBLE / LIMITADO — catalog rows `2013-2127`, `2013-2169`

### Requirements

```ts
domain?: 'supplier' | 'catalog';
status?: 'active' | 'inactive' | 'pending' | 'available' | 'limited';
label?: string;
```

- Pill/chip layout from Figma (`Text` frame)
- Semantic background + border + text color per status
- `theme`, `size`
- Used by `ProveedorTableRow`, `ProveedorDetailHeader`, `ProveedorCatalogTableRow`

### Stories

```txt
SupplierActive
SupplierInactive
SupplierPending
CatalogAvailable
CatalogLimited
DarkMode
Sizes
```

---

## 7. ProveedorTableRow — Node `2013-1952`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1952&m=dev)

### Requirements

```ts
supplierId?: string;
name?: string;
category?: string;
status?: 'active' | 'inactive' | 'pending';
paymentTerms?: string;
leadTime?: string;
reliability?: string;
productCount?: number | string;
balance?: string;
lastPurchaseOrder?: string;
onClick?: () => void;
selected?: boolean;
```

- Compose `ProveedorStatusBadge`
- Column grid MUST align with `ProveedorTableHeader`
- `theme`, `size`
- Optional hover/selected row state

### Stories

```txt
Active
Inactive
Pending
Selected
DarkMode
Sizes
```

---

## 8. ProveedorSuppliersTable — Node `2013-1939`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1939&m=dev)

Reference PNG: `design-references/proveedor/2013-2075-table-xl-light.png` (validate xl full-width layout)

### Requirements

```ts
rows: Array<ProveedorTableRowProps>;
columns?: ProveedorTableHeaderProps['columns'];
onRowClick?: (rowId: string) => void;
emptyState?: React.ReactNode;
```

- Composes `ProveedorTableHeader` + `ProveedorTableRow[]`
- **Dynamic height:** adding `rows` increases table body height (auto layout)
- **`size="xl"`:** `width: 100%` of parent
- Dividers between rows per Figma

### Stories

```txt
Default
ManyRows
Empty
FullWidthXL
DarkMode
Sizes
```

---

## 9. ProveedorFormHeader — Node `2013-1819`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1819&m=dev)

### Requirements

```ts
title?: string;
onBack?: () => void;
backLabel?: string;
```

- Back icon button + title (e.g. `NUEVO PROVEEDOR`)
- `theme`, `size`

### Stories

```txt
Default
DarkMode
Sizes
```

---

## 10. ProveedorFormActions — Node `2013-1826`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1826&m=dev)

### Requirements

**Must be implemented before `ProveedorProductModal`.**

```ts
onCancel?: () => void;
onSave?: () => void;
cancelLabel?: string;
saveLabel?: string;
saveDisabled?: boolean;
saveLoading?: boolean;
```

- `Cancelar` secondary + `Guardar` primary with save icon
- `theme`, `size`
- Reused as footer pattern inside `ProveedorProductModal`

### Stories

```txt
Default
SaveLoading
SaveDisabled
DarkMode
Sizes
```

---

## 11. ProveedorFormSection — Nodes `2013-1837`, `2013-1857`

### Figma

- [Información General](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1837&m=dev)
- [Condiciones Comerciales](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1857&m=dev)

### Requirements

```ts
title?: string;
children?: React.ReactNode;
```

- Card/panel shell with section title and 2-column field grid
- **Do not reimplement** base inputs — compose existing form primitives from `02-Formularios.md` where possible
- `theme`, `size`; `xl` = full width

### Stories

```txt
GeneralInfo
CommercialTerms
DarkMode
Sizes
```

---

## 12. ProveedorDetailHeader — Node `2013-2052`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2052&m=dev)

### Requirements

```ts
name?: string;
code?: string;
taxId?: string;
status?: 'active' | 'inactive' | 'pending';
onBack?: () => void;
```

- Back control, title stack (`name` + `code · NIT`), trailing `ProveedorStatusBadge`
- `theme`, `size`

### Stories

```txt
Default
Inactive
DarkMode
Sizes
```

---

## 13. ProveedorDetailTab — Node `2013-2076`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2076&m=dev)

### Requirements

**Implement this component before `ProveedorDetailTabBar`.**

```ts
label?: string;
icon?: React.ReactNode;
active?: boolean;
onClick?: () => void;
```

- Single tab cell: icon + label (e.g. `INFORMACIÓN`, `CATÁLOGO`, `HISTORIAL OCs`, `CALIDAD`, `CUENTAS X PAGAR`)
- Active vs inactive visual states (inactive reference: sibling tabs in `2013-2075`)
- `theme`, `size`
- `aria-current="page"` when `active`

### Stories

```txt
Active
Inactive
WithIcon
DarkMode
Sizes
```

---

## 14. ProveedorDetailTabBar — Node `2013-2075`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2075&m=dev)

### Requirements

```ts
tabs: Array<{
  id: string;
  label: string;
  icon?: React.ReactNode;
}>;
activeTabId?: string;
onTabChange?: (id: string) => void;
```

- Composes `ProveedorDetailTab` only — no duplicated tab styles
- **Dynamic:** render any `tabs.length`; equal-width columns at `xl` (`width: 100%`)
- Default five tabs from Figma: Información, Catálogo, Historial OCs, Calidad, Cuentas x Pagar

### Stories

```txt
FiveTabs
ThreeTabs
FullWidthXL
DarkMode
Sizes
```

---

## 15. ProveedorCatalogTableHeader — Node `2013-2111`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2111&m=dev)

### Requirements

Default columns: product name, SKU, UNIDAD, PRECIO ACTUAL, PRECIO ANTERIOR, MOQ, ESTADO, ACCIONES.

- Same API pattern as `ProveedorTableHeader`
- `theme`, `size`

### Stories

```txt
Default
DarkMode
Sizes
```

---

## 16. ProveedorCatalogEditButton — Node `2013-2129`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2129&m=dev)

### Requirements

```ts
label?: string;
onClick?: () => void;
disabled?: boolean;
```

- Compact `EDITAR` button with pencil icon
- `theme`, `size`

### Stories

```txt
Default
Disabled
DarkMode
Sizes
```

---

## 17. ProveedorCatalogTableRow — Node `2013-2120`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2120&m=dev)

### Requirements

```ts
productName?: string;
sku?: string;
unit?: string;
currentPrice?: string;
previousPrice?: string;
moq?: string;
status?: 'available' | 'limited';
priceTrend?: 'up' | 'down' | 'neutral'; // for $28.500↑ / $18.900↓ styling
onEdit?: () => void;
```

- Compose `ProveedorStatusBadge` + `ProveedorCatalogEditButton`
- Price trend color/icon per Figma
- `theme`, `size`

### Stories

```txt
Available
Limited
PriceUp
PriceDown
DarkMode
Sizes
```

---

## 18. ProveedorCatalogTable — Node `2013-2110`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2110&m=dev)

### Requirements

```ts
rows: Array<ProveedorCatalogTableRowProps>;
onEditRow?: (sku: string) => void;
```

- Composes header + rows
- **Dynamic height** when rows are added
- **`size="xl"`:** `width: 100%`

### Stories

```txt
Default
ManyRows
Empty
FullWidthXL
DarkMode
Sizes
```

---

## 19. ProveedorProductModal — Node `2013-2305`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2305&m=dev)

Reference PNG: `design-references/proveedor/2013-2305-modal-dark.png`

### Requirements

**Depends on `ProveedorFormActions` (cancel/save) being implemented first.**

```ts
open?: boolean;
title?: string;
subtitle?: string;
onClose?: () => void;
onCancel?: () => void;
onSave?: () => void;
saveLoading?: boolean;
children?: React.ReactNode; // field groups
```

- Modal shell: header (title, subtitle, close), scrollable body, footer
- Footer MUST compose `ProveedorFormActions` (or share the same SCSS module)
- Fields from Figma: Nombre, SKU, Unidad, Precio (COP), MOQ, Estado — use shared form inputs
- Backdrop blur / overlay per Figma dark reference
- `theme`, `size` (modal max-width per size scale)

### Stories

```txt
EditProduct
Saving
DarkMode
Sizes
```

---

## 20. ProveedorContactPanel — Node `2013-2413`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2413&m=dev)

### Requirements

```ts
title?: string;
fields?: Array<{ label: string; value: string }>;
```

Default fields: EMAIL, TELÉFONO, DIRECCIÓN, CIUDAD.

- Read-only label + value stacks
- `theme`, `size`

### Stories

```txt
Default
DarkMode
Sizes
```

---

## 21. ProveedorMetricsPanel — Node `2013-2437`

### Figma

[Open in Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2437&m=dev)

### Requirements

```ts
title?: string;
metrics?: Array<{ label: string; value: string }>;
```

Default metrics: CONFIABILIDAD, LEAD TIME PROMEDIO, CONDICIÓN PAGO.

- Large value typography per Figma
- `theme`, `size`
- Pairs with `ProveedorContactPanel` in a 2-column detail layout

### Stories

```txt
Default
DarkMode
Sizes
```

---

# Theme Consistency Rules

## Dark Theme

- layered dark surfaces
- subtle borders `rgba(white, 0.08–0.14)`
- muted secondary text
- enterprise orange `#e8943a` for primary procurement CTAs when Figma uses it
- semantic colors for status badges and price trends

## Light Theme

- same spacing and proportions as dark
- soft borders `rgba(black, 0.08–0.12)`
- readable primary text
- no pure white panels without border context

---

# Recommended Folder Structure

```txt
packages/ui/src/components/proveedor/
 ├── shared/
 │   └── proveedor-types.ts
 ├── proveedor-page-header/
 ├── proveedor-metric-card/
 ├── proveedor-list-toolbar/
 ├── proveedor-action-button/
 ├── proveedor-table-header/
 ├── proveedor-status-badge/
 ├── proveedor-table-row/
 ├── proveedor-suppliers-table/
 ├── proveedor-form-header/
 ├── proveedor-form-actions/
 ├── proveedor-form-section/
 ├── proveedor-detail-header/
 ├── proveedor-detail-tab/
 ├── proveedor-detail-tab-bar/
 ├── proveedor-catalog-table-header/
 ├── proveedor-catalog-edit-button/
 ├── proveedor-catalog-table-row/
 ├── proveedor-catalog-table/
 ├── proveedor-product-modal/
 ├── proveedor-contact-panel/
 └── proveedor-metrics-panel/
```

---

# Export Barrel

Add to `packages/ui/src/index.tsx`:

```ts
export * from './components/proveedor/proveedor-page-header';
export * from './components/proveedor/proveedor-metric-card';
export * from './components/proveedor/proveedor-list-toolbar';
export * from './components/proveedor/proveedor-action-button';
export * from './components/proveedor/proveedor-table-header';
export * from './components/proveedor/proveedor-status-badge';
export * from './components/proveedor/proveedor-table-row';
export * from './components/proveedor/proveedor-suppliers-table';
export * from './components/proveedor/proveedor-form-header';
export * from './components/proveedor/proveedor-form-actions';
export * from './components/proveedor/proveedor-form-section';
export * from './components/proveedor/proveedor-detail-header';
export * from './components/proveedor/proveedor-detail-tab';
export * from './components/proveedor/proveedor-detail-tab-bar';
export * from './components/proveedor/proveedor-catalog-table-header';
export * from './components/proveedor/proveedor-catalog-edit-button';
export * from './components/proveedor/proveedor-catalog-table-row';
export * from './components/proveedor/proveedor-catalog-table';
export * from './components/proveedor/proveedor-product-modal';
export * from './components/proveedor/proveedor-contact-panel';
export * from './components/proveedor/proveedor-metrics-panel';
```

---

# Acceptance Criteria

- [ ] All Figma nodes listed in this task are inspected in dev mode
- [ ] PNG references added/updated under `tasks/packages-ui/design-references/proveedor/`
- [ ] Every component: `.tsx` + `.module.scss` + `.stories.tsx` + `index.ts`
- [ ] Every component supports `theme: 'light' | 'dark'`
- [ ] Every component supports `size: 'sm' | 'md' | 'xl'` with width and height scaling
- [ ] `ProveedorMetricCard` supports configurable **`value`** and **`valueColor`**; `1886` and `1896` styles covered via props
- [ ] `ProveedorDetailTab` implemented before `ProveedorDetailTabBar`
- [ ] `ProveedorDetailTabBar` supports dynamic tab count; **`xl`** is full width
- [ ] `ProveedorSuppliersTable` and `ProveedorCatalogTable` grow with row count; **`xl`** is full width
- [ ] `ProveedorFormActions` (Cancelar / Guardar) implemented **before** `ProveedorProductModal`
- [ ] `ProveedorProductModal` footer reuses the same cancel/save pattern as `ProveedorFormActions`
- [ ] `ProveedorTableRow` composes `ProveedorStatusBadge`
- [ ] `ProveedorCatalogTableRow` composes `ProveedorStatusBadge` + `ProveedorCatalogEditButton`
- [ ] Status badges cover supplier (`active`, `inactive`, `pending`) and catalog (`available`, `limited`) variants
- [ ] Storybook defaults to light; each component has a `DarkMode` story
- [ ] Storybook exposes `Sizes` story or size control for sm / md / xl
- [ ] No hardcoded colors in TSX
- [ ] No Figma screenshots/images rendered as UI
- [ ] Components exported from `packages/ui/src/index.tsx`
- [ ] `pnpm --filter @restopsiq/ui typecheck` passes

---

# Implementation Checklist (Agent)

1. Open each Figma node link in dev mode (`?m=dev`)
2. Export light/dark PNG references → `design-references/proveedor/`
3. Confirm final component and variant names from Figma layer names (`SuppliersList`, `SupplierDetail`, etc.)
4. Implement shared `proveedor-types` and size/theme SCSS pattern
5. Build atomic pieces: metric card, status badge, action buttons, catalog edit button
6. Build rows + headers, then dynamic tables (`ProveedorSuppliersTable`, `ProveedorCatalogTable`)
7. Build `ProveedorDetailTab`, then `ProveedorDetailTabBar`
8. Build `ProveedorFormActions`, then `ProveedorProductModal`
9. Build panels (`ProveedorContactPanel`, `ProveedorMetricsPanel`) and form sections
10. Wire Storybook under `Proveedor/` namespace
11. Run typecheck + Storybook visual pass
12. Use icons from the project icon library closest to Figma

---

# Figma Links (Quick Reference)

```txt
2013-1874  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1874&m=dev  (page header)
2013-1886  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1886&m=dev  (metric — plain value)
2013-1891  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1891&m=dev  (metric — pending)
2013-1896  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1896&m=dev  (metric — currency style)
2013-1901  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1901&m=dev  (metric — products)
2013-1906  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1906&m=dev  (list toolbar)
2013-1934  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1934&m=dev  (NUEVO PROVEEDOR)
2013-1941  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1941&m=dev  (suppliers table header)
2013-1952  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1952&m=dev  (supplier row)
2013-1956  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1956&m=dev  (status badge)
2013-1939  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1939&m=dev  (suppliers table — dynamic)
2013-1819  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1819&m=dev  (form header)
2013-1826  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1826&m=dev  (cancel / guardar — before modal)
2013-1837  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1837&m=dev  (form section — general)
2013-1857  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-1857&m=dev  (form section — commercial)
2013-2052  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2052&m=dev  (detail header)
2013-2076  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2076&m=dev  (detail tab — implement first)
2013-2075  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2075&m=dev  (detail tab bar — dynamic, xl full)
2013-2110  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2110&m=dev  (catalog table — dynamic)
2013-2120  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2120&m=dev  (catalog row)
2013-2305  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2305&m=dev  (product modal — after form actions)
2013-2413  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2413&m=dev  (contact panel)
2013-2437  https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2013-2437&m=dev  (metrics panel)
```

Reference tasks:

- `tasks/packages-ui/06-receta-figma-components.md` (tables, metric cards, modals)
- `tasks/packages-ui/05-field-ops-figma-components.md` (Figma task structure)
- `tasks/packages-ui/03-Data-Display.md` (data tables and detail panels)
