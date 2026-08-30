# Task: Analytics Chart Components — `packages/ui`

**Domain:** `[DESIGN-SYSTEM]` `[UI]` `[STORYBOOK]` `[SCSS]` `[CHARTS]` `[ANALYTICS]`  
**Assigned Agent:** frontend-developer, ui-engineer, design-system-engineer  
**Status:** `completed`  
**Created:** 2026-05-20  
**Depends On:** `01-design-tokens.md`, `01-feedbacks.md`, `03-data-display.md`

---

# Context

Build the complete **Chart System** for analytics dashboards, supply chain views, and operational reports in the shared UI library:

```txt
packages/ui
```

All charts MUST be built on **Recharts** with a consistent theme aligned to the design system (tokens, typography, spacing, light/dark surfaces).

Charts are consumed in:

```txt
Analytics dashboard
Supply chain dashboards
Operational reports
KPICard trend overlays (MiniChart / Sparkline)
```

All components MUST follow the same architectural patterns as:

- Button
- KPICard
- EmptyState / Skeleton (feedback)

Reference implementation:

```txt
Button/
 ├── Button.tsx
 ├── Button.module.scss
 ├── Button.stories.tsx
 ├── index.ts
```

---

# Design Reference Images

Official visual references for chart containers, axes, grids, tooltips, and legends:

```txt
docs/design-references/dashboard-dark.png
docs/design-references/dashboard-light.png
```

These define:

- dark / light surfaces behind charts
- axis and grid line contrast
- tooltip card elevation
- legend typography
- gold/yellow accent for highlights
- semantic series colors

---

# Technology Stack

## Required Dependency

```txt
recharts
```

Add to `packages/ui/package.json` if not present.

## Wrapper Pattern

Every public chart component MUST:

- wrap content in `ResponsiveContainer` (width/height `100%` of parent)
- accept `theme?: 'light' | 'dark'`
- accept `size?: 'sm' | 'md' | 'xl'` where applicable (container min dimensions)
- accept `loading?: boolean` and `empty?: boolean` (or derive empty from `data.length === 0`)

---

# Shared Chart Infrastructure

Create shared utilities and primitives under:

```txt
packages/ui/src/components/charts/
 ├── shared/
 │    ├── chart-theme.ts          # maps design tokens → Recharts config
 │    ├── chart-colors.ts         # series palette from SCSS tokens (no hex in components)
 │    ├── format-currency.ts      # COP: $1.250.000
 │    ├── format-number.ts        # auto K, M (1.2K, 3.4M)
 │    ├── ChartTooltip.tsx
 │    ├── ChartLegend.tsx
 │    ├── ChartContainer.tsx      # responsive shell + loading/empty states
 │    └── index.ts
```

## Currency Format (COP) — Mandatory

All monetary values in tooltips, axis labels, and center labels MUST use Colombian format:

```txt
Thousands separator: .
Decimal separator: , (only when decimals apply)
Prefix: $
Example: $1.250.000
```

```ts
formatCurrencyCOP(1250000); // → "$1.250.000"
```

Forbidden:

```txt
$1250000
USD formatting
hardcoded locale strings in each chart file
```

## Number Format (Axis) — Mandatory

Y-axis and non-currency numeric labels MUST auto-compact:

```txt
1_200      → 1,2K
3_400_000  → 3,4M
850        → 850
```

Implement once in `format-number.ts` and reuse across all charts.

## Series Colors — Mandatory

Series colors MUST come from design tokens via `chart-colors.ts` / `chart-theme.ts`.

Allowed sources:

```scss
$color-primary
$color-success
$color-warning
$color-danger
$color-info
$color-secondary
// gold accent: #d4a017 (approved chart accent — same as dashboard)
```

Forbidden in chart components:

```tsx
fill = '#ff0000';
stroke = '#3b82f6';
```

Expose a `getSeriesColor(index: number)` helper that cycles the token palette.

## Loading & Empty States — Mandatory

Every chart MUST support:

```tsx
loading?: boolean   // renders Skeleton (chart variant or rectangular)
empty?: boolean     // renders EmptyState when no data
```

When `loading === true`, do NOT render Recharts internals.

When `empty === true` (or `data.length === 0`), render:

```tsx
<EmptyState variant="search" title="..." description="..." />
```

inside the same `ChartContainer` dimensions.

---

# Theme Consistency Rules

## Dark Theme

- chart background: transparent or layered dark surface
- grid lines: `rgba(white, 0.08–0.12)`
- axis labels: muted inverse text
- tooltip: dark elevated card, gold accent on active series
- legend: interactive, readable on dark

## Light Theme

- same spacing and chart proportions as dark
- grid lines: `rgba(black, 0.06–0.10)`
- tooltip: light card with subtle border
- no pure white chart panels without border context

---

# Shared SCSS Variables

Chart SCSS modules MUST import:

```scss
@use '../../../styles/abstracts/variables' as *;
@use '../../../styles/abstracts/mixins' as *;
```

Chart container styles (`.chartContainer`, tooltip overrides) live in component `.module.scss` files.

Recharts inline styles SHOULD be minimized; prefer `chart-theme.ts` + CSS variables where possible.

---

# Required Components

```txt
LineChart
BarChart
AreaChart
PieChart / DonutChart
MiniChart / Sparkline
OccupancyHeatmap
```

---

# Global Component Structure

Every chart component MUST include:

```txt
ComponentName/
 ├── ComponentName.tsx
 ├── ComponentName.module.scss
 ├── ComponentName.stories.tsx
 ├── index.ts
```

Shared primitives live under `charts/shared/` (no Storybook required for every util; `ChartTooltip` / `ChartLegend` may have stories).

---

# Component Requirements

## LineChart

### Features

- multiple series (`dataKey` per series)
- custom tooltip with **COP format** when `valueType: 'currency'`
- Y-axis auto number format (K, M)
- interactive legend: **click toggles series visibility**
- `ResponsiveContainer` — fills parent width/height
- optional **reference line** (e.g. daily target / meta del día)
- `theme`, `size`, `loading`, `empty`

### Use Cases

```txt
Ventas por hora
Evolución CPP
Comparativa de sedes
```

### Stories

```txt
Default
MultiSeries
WithReferenceLine
CurrencyTooltip
Loading
Empty
DarkMode
```

---

## BarChart

### Features

- simple bars (single series)
- grouped bars (multiple series side by side)
- stacked bars (cost composition / composición de costos)
- horizontal layout for rankings (top productos, top insumos por costo)
- tooltip with **COP format**
- series colors from design tokens
- `theme`, `size`, `loading`, `empty`

### Variants

```ts
variant?: 'simple' | 'grouped' | 'stacked' | 'horizontal'
```

### Use Cases

```txt
Top productos por ventas
Top insumos por costo
Composición de costos (stacked)
Comparativa mensual (grouped)
```

### Stories

```txt
Simple
Grouped
Stacked
HorizontalRanking
CurrencyTooltip
Loading
Empty
DarkMode
```

---

## AreaChart

### Features

- smoothed trend lines (`type="monotone"` or equivalent)
- gradient fill under line (token-based gradient stops)
- Y-axis number format (K, M) and optional COP tooltip
- `ResponsiveContainer`
- `theme`, `size`, `loading`, `empty`

### Use Cases

```txt
Evolución de MRR
Valoración del inventario en el tiempo
```

### Stories

```txt
Default
MultiSeries
GradientFill
CurrencyTooltip
Loading
Empty
DarkMode
```

---

## PieChart / DonutChart

### Features

- percentage distribution
- donut variant with **total value centered** (COP when monetary)
- tooltip: **percentage + absolute value** (COP when applicable)
- legend with token colors
- `variant?: 'pie' | 'donut'`
- `theme`, `size`, `loading`, `empty`

### Use Cases

```txt
Composición de costos
Distribución de ventas por categoría
```

### Stories

```txt
Pie
Donut
DonutWithCenterTotal
CurrencyTooltip
Loading
Empty
DarkMode
```

---

## MiniChart / Sparkline

### Features

- inline micro chart **without axes or labels**
- simple line only (last 7 data points typical)
- fits inside **KPICard** footer or slot
- minimal height (e.g. 32–48px), width `100%`
- no tooltip required (optional on hover)
- token-based stroke color (trend up/down semantic optional)
- `theme`, `loading`

### Integration

```tsx
<KPICard
  label="Ventas hoy"
  value="$4.250.000"
  sparkline={<MiniChart data={last7Days} theme="light" />}
/>
```

### Stories

```txt
Default
TrendUp
TrendDown
InsideKPICard
Loading
DarkMode
```

---

## OccupancyHeatmap

### Features

- cell grid colored by intensity (value → color scale from tokens)
- X-axis: hours of day (**6am – 12pm** / configurable `hourRange`)
- Y-axis: days of week (Lun–Dom)
- tooltip with exact value on hover
- `ResponsiveContainer` or CSS grid with proportional cells
- `theme`, `size`, `loading`, `empty`

### Use Cases

```txt
Análisis de cámaras YOLO
Ocupación por franja horaria
```

### Color Scale

Use semantic gradient from low → high intensity based on tokens (e.g. muted → gold → warning), not random hex per cell.

### Stories

```txt
Default
CameraYolo
PartialWeek
Loading
Empty
DarkMode
```

---

# Responsive Behavior — Mandatory

All charts MUST:

```txt
- use ResponsiveContainer (or equivalent 100% parent sizing)
- never overflow parent card without scroll intent
- preserve min-height per size variant (sm / md / xl)
- preserve min-width per size variant (sm / md / xl)
- scale typography, spacing, legends and paddings proportionally by size
- degrade gracefully on mobile (rotate labels, reduce tick count)
- support both width and height responsive scaling
```

Recommended container sizes (align with data-display):

```txt
sm  → min-width 220px, min-height 160px
md  → min-width 320px, min-height 200px
xl  → min-width 480px, min-height 260px
```

Parent apps control final layout; charts fill available space.

---

# Accessibility Rules

Charts MUST support:

```txt
role="img" or aria-label on chart container describing the chart purpose
accessible tooltip content (readable text, not color-only)
legend buttons keyboard-focusable when interactive
sufficient contrast for axis labels in both themes
reduced motion: respect prefers-reduced-motion for animations
```

---

# Dark / Light Validation

Every Storybook story MUST be validated in BOTH:

```txt
Light Mode (default in docs)
Dark Mode
```

Validation includes:

- grid and axis readability
- tooltip contrast
- legend hit targets
- series distinguishability without relying on color alone
- skeleton and empty state appearance

---

# Forbidden Design Patterns

```txt
- hardcoded hex colors in chart TSX files
- USD or en-US currency formatting
- charts without loading/empty handling
- fixed pixel widths that break responsive layouts
- pure black chart backgrounds
- disabling ResponsiveContainer without documented exception
- duplicate format helpers per chart (use shared utils)
```

---

# Acceptance Criteria

- [ ] `recharts` added and typecheck passes
- [ ] Shared `formatCurrencyCOP` and `formatNumberCompact` implemented and tested
- [ ] `chart-colors.ts` reads palette from design tokens only
- [ ] All chart components compile successfully
- [ ] Storybook renders all stories (light default, dark variant per component)
- [ ] All charts are responsive inside parent containers
- [ ] All monetary tooltips/labels show COP format (`$1.250.000`)
- [ ] Y-axis uses K / M compaction where applicable
- [ ] LineChart legend click hides/shows series
- [ ] LineChart supports reference line
- [ ] BarChart supports simple, grouped, stacked, horizontal
- [ ] AreaChart supports gradient fill
- [ ] DonutChart shows center total
- [ ] Pie/Donut tooltip shows % and absolute value
- [ ] MiniChart renders without axes inside KPICard story
- [ ] OccupancyHeatmap renders 6am–12pm × weekdays grid
- [ ] Every chart shows Skeleton when `loading`
- [ ] Every chart shows EmptyState when no data
- [ ] Every component includes `.tsx + .module.scss + .stories.tsx + index.ts`
- [ ] Charts exported from `packages/ui/src/index.tsx`
- [ ] Every chart supports responsive width scaling
- [ ] Every chart supports responsive height scaling
- [ ] Every chart supports `sm`, `md`, and `xl`
- [ ] Typography scales correctly per size
- [ ] Legends remain readable in all sizes
- [ ] Tooltips do not overflow in compact layouts
- [ ] Axis labels adapt correctly in small layouts
- [ ] ChartContainer centrally controls sizing behavior

---

# Recommended Folder Structure

```txt
packages/ui/
 └── src/
      └── components/
           └── charts/
                ├── shared/
                │    ├── ChartContainer.tsx
                │    ├── ChartTooltip.tsx
                │    ├── ChartLegend.tsx
                │    ├── chart-theme.ts
                │    ├── chart-colors.ts
                │    ├── format-currency.ts
                │    ├── format-number.ts
                │    └── index.ts
                ├── line-chart/
                ├── bar-chart/
                ├── area-chart/
                ├── pie-chart/
                ├── mini-chart/
                └── occupancy-heatmap/
```

---

# Export Barrel

Add to `packages/ui/src/index.tsx`:

```ts
export * from './components/charts/line-chart';
export * from './components/charts/bar-chart';
export * from './components/charts/area-chart';
export * from './components/charts/pie-chart';
export * from './components/charts/mini-chart';
export * from './components/charts/occupancy-heatmap';
export * from './components/charts/shared';
```

---

Reference assets:

- `docs/design-references/dashboard-dark.png`
- `docs/design-references/dashboard-light.png`
- `tasks/packages-ui/01-feedbacks.md` (Skeleton, EmptyState)
- `tasks/packages-ui/03-data-display.md` (KPICard + MiniChart integration)
