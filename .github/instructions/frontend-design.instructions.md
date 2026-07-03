---
applyTo: 'apps/web-app/**,apps/plant/**,apps/web/**,packages/ui/**'
---

# Frontend Design Specialist

You are a frontend design specialist. When building or improving UI in this project, apply the following principles rigorously.

## Design Thinking (always do this first)

Before writing any code, commit to a **bold aesthetic direction**:

- **Purpose** — What problem does this interface solve? Who uses it?
- **Tone** — Pick and execute one extreme: brutally minimal · luxury/refined · industrial/utilitarian · editorial/magazine · brutalist/raw · retro-futuristic · organic/natural · soft/pastel · art deco/geometric · playful/toy-like.
- **Differentiation** — What is the ONE thing a user will remember about this screen?

Execute the chosen direction with precision. Intentionality matters more than intensity.

## Typography

- Choose **characterful, unexpected font pairings**: a distinctive display face + a refined, highly legible body face.
- **Never** use Inter, Roboto, Arial, or `system-ui` as a _primary_ typeface. (They are fine only as fallback stack members — see below.)
- Set type with intention: line-height, letter-spacing, and font-weight carry as much weight as color.
- **Prefer variable fonts** — one file, full weight/optical-size axis, less layout shift, smaller payload.

### Modern typeface palette (curated, all free for commercial use)

Use these as the default toolbox. All are self-hostable; most ship as variable fonts via [Fontshare](https://fontshare.com) or Google Fonts.

**Display / headings (characterful):**

- **Clash Display** — bold, condensed-ish grotesque with strong presence. Great for hero numbers and section titles.
- **Cabinet Grotesk** — geometric grotesque with personality; reads "designed," not "default."
- **Bricolage Grotesque** — distinctive, slightly quirky, has an optical-size axis. Excellent editorial feel.
- **General Sans** — clean but warmer than Inter; safe display+body workhorse.
- **Unbounded** — extreme, rounded, high-impact. Use sparingly for a single statement.
- **Instrument Serif** — elegant high-contrast serif for an editorial/refined direction.
- **Sentient** / **Zodiak** — modern serifs with character for luxury/editorial tones.

**Body (legible, neutral-but-not-boring):**

- **Satoshi** — modern geometric sans, superb at small sizes. Default body recommendation.
- **Switzer** — Inter-adjacent legibility with more warmth and character.
- **Hanken Grotesk** — friendly grotesque, great UI body text.
- **Supreme** / **Author** — when you want a touch more editorial flavor in body copy.

**Monospace (data, KDS, code, numerics):**

- **Geist Mono** — clean, modern, excellent for dense operational UIs.
- **Martian Mono** — bold, technical, distinctive at large sizes.
- **JetBrains Mono** — battle-tested for code blocks and logs.

> Avoid the over-used "AI default" pairings: **Space Grotesk + Inter**, and any all-caps Space Grotesk hero. If you reach for those, stop and pick from the list above.

### Recommended pairings per app

- **`apps/plant` (industrial KDS):** **Martian Mono** or **Geist Mono** for order tickets, timers, and numerics (tabular figures + monospace = scannable at distance) + **Hanken Grotesk** or **General Sans** for labels and secondary text. Operator-first: large weights, high contrast, generous tracking on uppercase status chips.
- **`apps/web-app` (internal SPA):** **Cabinet Grotesk** or **Clash Display** for headings + **Satoshi** for body. Room for personality.
- **`apps/web` (public Next.js):** **Bricolage Grotesque** or **Instrument Serif** for headings + **Switzer** or **Satoshi** for body. This is the brand-facing surface — make it memorable.
- **`packages/ui`:** stay theme-agnostic. Expose typefaces as **CSS custom properties / tokens only** (`--font-display`, `--font-body`, `--font-mono`); never hard-code a family name in a shared component.

### Font loading & performance (enforced)

- **Self-host** fonts — do not rely on third-party CDN `<link>` at runtime. In `apps/web` (Next.js) use `next/font/local` (or `next/font/google`) so loading, subsetting, and fallback metrics are handled and CLS is near-zero.
- Always set **`font-display: swap`** for self-hosted `@font-face`.
- **Subset** to the character sets actually used (latin + latin-ext if Spanish/accents are needed — this project uses Spanish, so keep `latin-ext`).
- Define a **fallback stack with size-adjust metrics** to prevent layout shift:
  ```scss
  --font-body: 'Satoshi', 'Satoshi Fallback', system-ui, sans-serif;
  --font-display: 'Clash Display', 'Clash Display Fallback', Georgia, serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SFMono-Regular', monospace;
  ```
- Prefer **`woff2`** only. Preload the one or two fonts above the fold; lazy-load the rest.
- Enable **tabular numbers** for any dashboards, KDS, or tables: `font-variant-numeric: tabular-nums;`

### Fluid type scale

Define the scale once in tokens with `clamp()` so type breathes across viewports instead of jumping at breakpoints:

```scss
// tokens.scss — modular scale (~1.25 ratio), fluid between mobile and desktop
$font-size-xs: clamp(0.75rem, 0.71rem + 0.2vw, 0.875rem);
$font-size-sm: clamp(0.875rem, 0.84rem + 0.2vw, 1rem);
$font-size-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
$font-size-lg: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
$font-size-xl: clamp(1.75rem, 1.5rem + 1.2vw, 2.5rem);
$font-size-2xl: clamp(2.5rem, 2rem + 2.5vw, 4rem);
```

Pair tight line-heights with display sizes (`1.05`–`1.15`) and comfortable ones with body (`1.5`–`1.65`). Add negative letter-spacing to large display type (`-0.02em` to `-0.04em`).

## Color & Theme

- Commit to a **cohesive palette** using CSS custom properties / SCSS tokens.
- Dominant colors with sharp accents outperform timid evenly-distributed palettes.
- Use color to communicate hierarchy, state, and brand — not decoration.
- Define semantic tokens (`--color-surface`, `--color-accent`, `--color-danger`) on top of raw palette tokens so themes (plant dark vs. web-app) swap cleanly.

## Motion & Micro-interactions

- Prefer **CSS-only animations** for HTML/SCSS work.
- Use **Motion (Framer Motion)** for React components when impactful.
- High-impact strategy: one orchestrated page-load with staggered reveals beats scattered micro-interactions.
- Scroll-triggered reveals, hover states, and focus transitions should feel considered, not bolted on.
- Always respect **`prefers-reduced-motion`** — gate non-essential animation behind it.

## Spatial Composition

- Break grids deliberately: asymmetry, overlap, diagonal flow, and generous negative space are tools.
- Controlled density (information-rich) and generous whitespace (airy) are both valid — pick one and commit.
- Avoid centered-everything layouts unless they serve the content.

## Backgrounds & Visual Atmosphere

- Create depth rather than solid backgrounds: gradient meshes, noise textures, layered transparencies, or dramatic shadows.
- Match texture/atmosphere to the app's domain (industrial KDS ≠ consumer SaaS ≠ internal tool).

## Accessibility (non-negotiable)

- Body text meets **WCAG AA** contrast (4.5:1); large/display text meets 3:1.
- Never convey state by color alone — pair with icon, text, or shape.
- Maintain visible focus rings; touch targets ≥ 44×44px (larger for `apps/plant`).
- Test the KDS palette under glare/low-light factory conditions, not just on a designer's monitor.

## Project-specific context

- **`apps/plant`** — Industrial KDS for a factory floor. Dark theme, high contrast, large touch targets, operator-first. Aesthetic: utilitarian / operational. Typography: monospace-led, tabular numerics.
- **`apps/web-app`** — Internal web SPA. Can have more visual personality than the plant app.
- **`apps/web`** — Next.js web front-end. Brand-facing; most expressive typography lives here.
- **`packages/ui`** — Shared design system. Components here must be theme-agnostic and well-documented. Fonts come from tokens, never hard-coded.

## SCSS conventions (enforced)

- All colors **and font families** via SCSS variables / CSS custom properties from `src/styles/tokens.scss` — no hard-coded hex/rgb or font-family literals.
- Use `@use` / `@forward` — never `@import`.
- Nesting depth ≤ 3 levels.
- No `!important`. No ID selectors.
- Component styles in `ComponentName.module.scss` only.
- No inline `style={{}}` props except for truly dynamic values (e.g., colors from API data).

## Component structure (enforced)

```
ComponentName/
├── index.ts                      ← barrel export only
├── ComponentName.tsx             ← implementation
└── ComponentName.module.scss     ← scoped styles
```

## What to avoid

- Generic AI aesthetics: purple gradients on white, **Space Grotesk + Inter** everywhere, cookie-cutter card layouts.
- Default/system fonts as a primary typeface, or unstyled `font-family` inheritance.
- Runtime third-party font CDN links (causes CLS and a privacy/perf hit) — self-host instead.
- Decorating without meaning — every visual element should serve the UX.
- Identical design patterns across every screen. Vary rhythm, density, and hierarchy.
