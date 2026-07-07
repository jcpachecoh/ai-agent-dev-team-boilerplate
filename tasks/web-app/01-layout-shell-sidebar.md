# Task: Layout Shell con Sidebar Navigation

**Domain:** `[FRONTEND]` `[WEB-APP]` `[FIGMA]` `[LAYOUT]` `[ROUTING]`
**Assigned Agent:** frontend-developer, ui-engineer
**Status:** `pending`
**Created:** 2026-05-29
**Depends On:** `tasks/app/01-scaffold.md`, `tasks/app/02-testing.md`

---

## Contexto

Implementar el **layout base** de `apps/web-app` — una shell application con sidebar colapsable que integre todos los módulos del sistema (Inventarios, Reportes, Usuarios, Nómina, Recetas, etc.).

**Figma es la fuente de verdad visual.** La implementación debe ser **figma-first**: colores, tipografía, espaciado (grid 4px), dimensiones del sidebar, estados hover/active y breakpoints deben extraerse del diseño antes de codificar valores hardcodeados.

La app corre en **Vite + React + React Router** (`apps/web-app`). No hay backend ni `fetch` en esta tarea — solo layout, navegación y placeholders de rutas.

### Estado actual

- `apps/web-app` ya tiene rutas sueltas (`/`, `/recetas`) **sin** layout shell.
- Existe un `AppLayout` mínimo (nav + footer) que debe **reemplazarse o evolucionar** hacia el diseño Figma.
- Componentes de recetas viven en `src/screens/` y se montan vía `src/pages/`.

### Objetivo

Crear la shell reutilizable que envuelva **todas** las rutas autenticadas del sistema web, empezando por el módulo de Recetas ya migrado y dejando placeholders para el resto de módulos.

---

## Figma Source File

| Campo     | Valor                                                         |
| --------- | ------------------------------------------------------------- |
| File name | Opssynk                                                       |
| File key  | `owd5wBmVJgUE9n9MeOHxYb`                                      |
| Base URL  | `https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk` |

### Referencias de diseño

| Elemento                       | Node ID    | Dev mode URL                                                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| **Pantalla principal (shell)** | `2070:3`   | [Abrir en Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2070-3&m=dev)   |
| **Sidebar (navegación)**       | `2070:144` | [Abrir en Figma](https://www.figma.com/design/owd5wBmVJgUE9n9MeOHxYb/Opssynk?node-id=2070-144&m=dev) |

Exportar capturas de referencia en:

```txt
tasks/web-app/design-references/layout/
```

---

## Componentes principales

### Layout Shell

| Componente    | Ubicación propuesta           | Responsabilidad                                     |
| ------------- | ----------------------------- | --------------------------------------------------- |
| `Layout`      | `src/components/Layout/`      | Composición sidebar + header + main + footer        |
| `Sidebar`     | `src/components/Sidebar/`     | Navegación lateral colapsable                       |
| `Header`      | `src/components/Header/`      | Top bar: logo, breadcrumbs, usuario, notificaciones |
| `Breadcrumbs` | `src/components/Breadcrumbs/` | Migas de pan según ruta activa                      |
| `UserMenu`    | `src/components/UserMenu/`    | Avatar + nombre + acciones (logout)                 |
| `AppLayout`   | `src/layouts/AppLayout/`      | Wrapper `<Outlet />` para rutas anidadas            |

Cada componente en carpeta propia:

```txt
ComponentName/
 ├── ComponentName.tsx
 ├── ComponentName.module.scss
 ├── ComponentName.test.tsx
 └── index.ts
```

### Navigation items

Definir en `src/constants/navigation.ts`:

| Módulo        | Rutas                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Dashboard     | `/`                                                                                                    |
| Inventarios   | `/inventory`, `/inventory/products`, `/inventory/movements`, `/inventory/alerts`, `/inventory/reports` |
| Reportes      | `/reports`                                                                                             |
| Usuarios      | `/users`, `/users/roles`, `/users/permissions`                                                         |
| Nómina        | `/payroll`, `/payroll/employees`, `/payroll/salaries`                                                  |
| Recetas       | `/recetas` (ya implementado — integrar en sidebar)                                                     |
| Configuración | `/settings`                                                                                            |
| Logout        | acción (no ruta)                                                                                       |

---

## Requisitos

### Layout & routing

- [ ] Crear `src/layouts/AppLayout/` como wrapper con `<Outlet />` de React Router
- [ ] Reestructurar `src/App.tsx` con rutas anidadas: layout shell envuelve módulos; rutas full-bleed (si las hay) quedan fuera
- [ ] Integrar módulo **Recetas** existente (`/recetas`) dentro del nuevo layout
- [ ] Crear páginas placeholder para rutas de inventario, reportes, usuarios, nómina y settings (contenido mínimo: título + breadcrumb)
- [ ] Crear `src/constants/navigation.ts` con ítems, iconos (`lucide-react`), rutas hijas y labels en español

### Sidebar

- [ ] Renderizar sidebar según Figma (`node-id=2070-144`)
- [ ] Ítems con icono + label; submenús expandibles para categorías con hijos (Inventarios, Usuarios, Nómina)
- [ ] Highlight del link activo (`NavLink` / `useLocation`)
- [ ] Colapsable: hamburger en mobile, toggle en tablet, siempre visible en desktop
- [ ] Ancho desktop ~260px, tablet ~280px (confirmar en Figma)
- [ ] Altura ítem nav ~44px; iconos ~20px (confirmar en Figma)
- [ ] Transición al colapsar ~300ms

### Header & breadcrumbs

- [ ] Header con logo/marca, breadcrumbs dinámicos y `UserMenu`
- [ ] Breadcrumbs derivados de la ruta actual + config en `navigation.ts`
- [ ] Avatar + nombre de usuario (mock local por ahora)

### Responsive

- [ ] Desktop (`> 1024px`): sidebar fijo visible
- [ ] Tablet (`768px–1024px`): sidebar colapsable
- [ ] Mobile (`< 768px`): sidebar overlay con hamburger
- [ ] Transiciones suaves al abrir/cerrar sidebar

### Estilos (figma-first)

- [ ] Tokens en `src/styles/tokens.scss` — extraer paleta, tipografía y espaciado de Figma
- [ ] Estilos de layout en `src/styles/layout.module.scss` o SCSS por componente (preferir CSS Modules por componente)
- [ ] Sin inline `style={{}}`; sin colores hardcodeados fuera de tokens
- [ ] Grid base 4px; `@use` / `@forward` — nunca `@import`
- [ ] Anidar SCSS máximo 3 niveles

### Dark mode (opcional)

- [ ] Toggle light/dark en header o settings
- [ ] Persistencia en `localStorage`
- [ ] Variables CSS / tokens para ambos temas

### Testing

- [ ] Unit tests por componente (`Layout`, `Sidebar`, `Header`, `Breadcrumbs`, `UserMenu`, `AppLayout`)
- [ ] Tests de navegación: click en ítem → ruta correcta
- [ ] Test de active link highlighting
- [ ] Test responsive: sidebar colapsado/overlay según breakpoint (mock `matchMedia` o resize)
- [ ] Cobertura objetivo > 80% en componentes de layout

### Performance (objetivos)

- [ ] Lazy-load de páginas placeholder con `React.lazy` + `Suspense` si el bundle crece
- [ ] `React.memo` solo donde haya re-renders medibles
- [ ] Core layout bundle razonable; Lighthouse performance > 90 en dev build (aspiracional)

---

## Criterios de aceptación

### AC 1 — Sidebar navigation

- [ ] Sidebar renderiza según Figma
- [ ] Ítems con iconos y labels clickeables
- [ ] Submenús para Inventarios, Usuarios, Nómina
- [ ] Link activo resaltado visualmente
- [ ] Colapsable en mobile/tablet

### AC 2 — Responsive design

- [ ] Desktop: sidebar siempre visible
- [ ] Tablet: sidebar colapsable con toggle
- [ ] Mobile: hamburger + overlay
- [ ] Transiciones suaves (~300ms)

### AC 3 — Componentes

- [ ] `Layout` compone sidebar + header + `<Outlet />` + footer opcional
- [ ] Header con logo y `UserMenu`
- [ ] Breadcrumbs actualizados según ruta
- [ ] Avatar + nombre visibles en header

### AC 4 — Navegación

- [ ] Todos los módulos accesibles desde sidebar
- [ ] Rutas configuradas en React Router
- [ ] `/recetas` funciona dentro del layout
- [ ] Back button del navegador funciona
- [ ] Redirect `/` → dashboard o hub según diseño Figma

### AC 5 — Estilo visual

- [ ] Colores, tipografía y espaciado alineados con Figma
- [ ] Hover states en nav items
- [ ] Iconos cargados correctamente (`lucide-react`)

### AC 6 — Dark mode (opcional)

- [ ] Toggle funcional
- [ ] Colores ajustados en dark mode
- [ ] Preferencia persistida

### AC 7 — Calidad

- [ ] `pnpm --filter=@restopsiq/web-app typecheck` exit 0
- [ ] `pnpm --filter=@restopsiq/web-app test` exit 0
- [ ] `pnpm --filter=@restopsiq/web-app build` exit 0

---

## Archivos a crear o modificar

### Nuevos

```txt
apps/web-app/src/
├── components/
│   ├── Layout/
│   ├── Sidebar/
│   ├── Header/
│   ├── Breadcrumbs/
│   └── UserMenu/
├── layouts/
│   └── AppLayout/
├── constants/
│   └── navigation.ts
├── pages/
│   ├── DashboardPage/          # o reutilizar hub existente
│   ├── InventoryPage/          # placeholders por sub-ruta
│   ├── ReportsPage/
│   ├── UsersPage/
│   ├── PayrollPage/
│   └── SettingsPage/
└── styles/
    └── tokens.scss             # ampliar con tokens Figma layout
```

### Modificar

```txt
apps/web-app/src/App.tsx                    # rutas anidadas con AppLayout
apps/web-app/src/main.tsx                   # si hace falta provider de tema
apps/web-app/src/pages/RecipesPage/         # montar dentro del layout shell
apps/web-app/src/pages/OperationsHubPage/   # evaluar si pasa a DashboardPage
apps/web-app/src/components/AppLayout/      # deprecar o migrar al nuevo layouts/AppLayout
```

### Backend

Ninguno — frontend only.

---

## Notas de implementación

1. **Prioridad Figma:** inspeccionar `2070:3` (shell completa) y `2070:144` (sidebar) en dev mode antes de fijar tokens. No inventar medidas si Figma las define.
2. **Convenciones monorepo:** seguir [.github/copilot-instructions.md](../../.github/copilot-instructions.md) — carpeta por componente, CSS Modules, tests junto al componente.
3. **Recetas:** el módulo ya existe sin API; solo hay que envolverlo en la shell y añadir entrada en sidebar. No duplicar pantallas.
4. **Hub vs Dashboard:** la pantalla `/` actual (`OperationsHubPage`) puede convertirse en dashboard o quedar como landing pre-layout; alinear con frame Figma `2070:3`.
5. **Sin Next.js:** ignorar referencias a `pages/_app.tsx` — en Vite el equivalente es `App.tsx` + `layouts/AppLayout`.
6. **Reutilizar `@restopsiq/ui`** donde existan componentes compatibles (p. ej. botones, badges); layout shell es específico de web-app.

---

## Definición de hecho

- [ ] Layout shell pixel-close a Figma en desktop (tolerancia razonable en responsive)
- [ ] Sidebar navega a todas las rutas definidas
- [ ] Módulo Recetas accesible y funcional dentro del layout
- [ ] Tests verdes; build sin errores TS
- [ ] Capturas de referencia exportadas en `tasks/web-app/design-references/layout/`
