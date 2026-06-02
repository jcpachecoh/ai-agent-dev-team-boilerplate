# WEB-LOGIN-01 — Componentes UI login (web-app)

**Domain:** `[UI]` `[WEB-APP]` `[LOGIN]`  
**Status:** `done`  
**Depends On:** —  
**Blocks:** `02-web-app-login-integration.md`

---

## Objetivo

Implementar en `packages/ui` la pantalla de login de backoffice reutilizable desde `apps/web-app`:

- **Layout split:** imagen a la izquierda, formulario **email + contraseña** a la derecha.
- **Responsive:** en viewports ≤ 900px ocultar la imagen y mostrar **solo el formulario** a ancho completo.
- Tokens `--web-login-*`, temas **light/dark**, tamaños **sm/md/xl**.

## Layout

| Breakpoint | Columna izquierda            | Columna derecha                        |
| ---------- | ---------------------------- | -------------------------------------- |
| ≥ 901px    | `WebLoginImagePanel` (cover) | `WebLoginFormPanel` (email + password) |
| ≤ 900px    | **oculta** (`display: none`) | `WebLoginFormPanel` full width         |

Grid base en `WebLoginPage`: `1.4fr` imagen · `0.9fr` formulario (min 320px).

## Componentes (`packages/ui/src/components/web-login/`)

| Componente                | Archivo                       | Responsabilidad                                      |
| ------------------------- | ----------------------------- | ---------------------------------------------------- |
| `WebLoginImagePanel`      | `web-login-image-panel/`      | Imagen full-bleed con overlay opcional (solo visual) |
| `WebLoginCredentialsForm` | `web-login-credentials-form/` | Email + contraseña, error, CTA                       |
| `WebLoginDemoPanel`       | `web-login-demo-panel/`       | Credenciales demo + autofill                         |
| `WebLoginFormPanel`       | `web-login-form-panel/`       | Badge, título, form + demo + volver                  |
| `WebLoginPage`            | `web-login-page/`             | Composición imagen + form                            |

**Legacy (no usar en `WebLoginPage`):** `WebLoginHeroPanel`, `WebLoginStatCard` — hero con copy/KPIs; conservados por compatibilidad Storybook.

Shared: `shared/_web-login-theme.scss`, `web-login-types.ts`, `web-login-classnames.ts`, `story-decorators.tsx`.

## Props principales (`WebLoginPage`)

```ts
interface WebLoginPageProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
  /** URL de imagen para panel izquierdo (desktop) */
  heroImageUrl: string;
  heroImageAlt?: string;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  demoCredentials?: { email: string; password: string; label?: string };
  onUseDemo?: () => void;
  backHref?: string;
  onBack?: () => void;
  // copy opcional del form panel
  badgeLabel?: string;
  title?: string;
  subtitle?: string;
}
```

## `WebLoginCredentialsForm`

| Campo      | Tipo input | Autocomplete       | Validación UI (web-app) |
| ---------- | ---------- | ------------------ | ----------------------- |
| Email      | `email`    | `username`         | formato email           |
| Contraseña | `password` | `current-password` | no vacío                |

## Storybook

Carpeta **`WebLogin/`** — controles globales `theme` y `size`.

| Componente                | Stories                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `WebLoginImagePanel`      | Default, DarkMode, LightMode, Sizes                                                     |
| `WebLoginCredentialsForm` | Default, WithError, Submitting, DarkMode, LightMode, Sizes                              |
| `WebLoginDemoPanel`       | Default, WithoutButton, DarkMode, LightMode, Sizes                                      |
| `WebLoginFormPanel`       | Default, WithError, Submitting, WithoutDemo, DarkMode, LightMode, Sizes                 |
| `WebLoginPage`            | Default, WithError, Submitting, WithoutDemo, DarkMode, LightMode, MobileViewport, Sizes |

Story **MobileViewport**: viewport ≤ 900px — debe mostrarse **solo formulario**, sin imagen.

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
- Login operacional (cédula + PIN).
- Keypad numérico estilo plant.

## Checklist

- [x] `WebLoginImagePanel` — imagen cover, overlay sutil
- [x] `WebLoginCredentialsForm` — email + password (reemplaza cédula/PIN)
- [x] `WebLoginDemoPanel` — email + password en demo
- [x] `WebLoginPage` — imagen izq + form der; mobile sin imagen
- [x] SCSS `--web-login-*` con temas **dark** y **light**
- [x] Props `theme` / `size` en surfaces
- [x] Accesibilidad: labels, `htmlFor` + `useId`, `aria-invalid`, `role="alert"`, `alt` en imagen
- [x] Responsive: `@media (max-width: 900px)` oculta `.hero`
- [x] Storybook por componente + story MobileViewport
- [x] Export en `@restopsiq/ui`
