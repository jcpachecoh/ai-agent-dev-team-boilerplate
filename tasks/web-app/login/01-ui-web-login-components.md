# WEB-LOGIN-01 — Componentes UI login (web-app)

**Domain:** `[UI]` `[WEB-APP]` `[LOGIN]`  
**Status:** `done`  
**Depends On:** —  
**Blocks:** `02-web-app-login-integration.md`

---

## Objetivo

Implementar en `packages/ui` la pantalla compuesta de login (split layout) reutilizable desde `apps/web-app`, con tokens `--web-login-*`, temas **light/dark** y tamaños **sm/md/xl**.

## Componentes (`packages/ui/src/components/web-login/`)

| Componente                | Archivo                       | Responsabilidad                            |
| ------------------------- | ----------------------------- | ------------------------------------------ |
| `WebLoginStatCard`        | `web-login-stat-card/`        | KPI del hero (label, value, trend)         |
| `WebLoginHeroPanel`       | `web-login-hero-panel/`       | Marca RestOpsIQ, titular, grid 2×2, status |
| `WebLoginCredentialsForm` | `web-login-credentials-form/` | Cédula + PIN, error, CTA                   |
| `WebLoginDemoPanel`       | `web-login-demo-panel/`       | Credenciales demo + autofill               |
| `WebLoginFormPanel`       | `web-login-form-panel/`       | Badge, título, form + demo + volver        |
| `WebLoginPage`            | `web-login-page/`             | Composición full-viewport                  |

Shared: `shared/_web-login-theme.scss`, `web-login-types.ts`, `web-login-classnames.ts`, `story-decorators.tsx`.

## Props principales (`WebLoginPage`)

```ts
interface WebLoginPageProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
  brandName?: string; // default: COMMAND CENTER
  brandLocation?: string; // default: PLATFORM · RESTOPSIQ ENTERPRISE
  brandInitial?: string; // default: R
  headline?: string;
  description?: string;
  stats?: WebLoginStat[];
  statusLine?: string;
  heroLogo?: ReactNode;
  cedula: string;
  pin: string;
  onCedulaChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  demoCredentials?: { cedula: string; pin: string };
  onUseDemo?: () => void;
  backHref?: string;
  onBack?: () => void;
}
```

## Storybook

Carpeta **`WebLogin/`** — controles globales `theme` y `size` en cada meta.

| Componente                | Stories                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `WebLoginStatCard`        | SalesToday, ActiveOrders, Alerts, DarkMode, LightMode, Sizes                                    |
| `WebLoginHeroPanel`       | Default, DarkMode, LightMode, Sizes                                                             |
| `WebLoginCredentialsForm` | Default, WithError, Submitting, DarkMode, LightMode, Sizes                                      |
| `WebLoginDemoPanel`       | Default, WithoutButton, DarkMode, LightMode, Sizes                                              |
| `WebLoginFormPanel`       | Default, WithError, Submitting, WithoutDemo, DarkMode, LightMode, Sizes                         |
| `WebLoginPage`            | Default, WithError, Submitting, WithoutDemo, DarkMode, LightMode, SizeSmall/Medium/Large, Sizes |

```bash
pnpm --filter @restopsiq/ui storybook
```

## Export

```ts
// packages/ui/src/index.tsx
export * from './components/web-login';
```

## Fuera de alcance (tarea 02)

- React Query, HTTP, rutas protegidas en `web-app`.
- Keypad numérico estilo plant.

## Checklist

- [x] 6 componentes + barrel `index.ts`
- [x] SCSS `--web-login-*` con temas **dark** y **light**
- [x] Props `theme` / `size` en todos los surfaces
- [x] Marca hero: `COMMAND CENTER` · `PLATFORM · RESTOPSIQ ENTERPRISE` · inicial `R`
- [x] Accesibilidad: labels, `htmlFor` + `useId`, `aria-invalid`, `role="alert"`
- [x] Responsive: columna única &lt; 900px
- [x] Storybook por componente (dark/light/sizes)
- [x] Export en `@restopsiq/ui`
