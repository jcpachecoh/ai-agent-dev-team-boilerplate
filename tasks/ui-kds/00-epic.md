# Epic: UI-KDS — Pantallas operario Plant (`apps/plant`)

**Domain:** `[UI-KDS]` `[PLANT]` `[TOUCH]` `[TABLET]` `[WEBSOCKET]` `[OFFLINE]`  
**Assigned Agent:** frontend-developer, ui-engineer  
**Status:** `pending`  
**Created:** 2026-05-22

---

## Contexto

Implementar la **UI del KDS del operario** en la app Plant del monorepo. La spec de producto en este repositorio la implementación es **React 18 + Vite + SCSS** en:

```txt
apps/plant
```

Pantallas en:

```txt
apps/plant/src/screens/
```

Cada pantalla usa **componentes reutilizables** de `@restopsiq/ui`, validados previamente en Storybook (`packages/ui`, puerto 6006, namespace **Field Ops/**).

### Acceso

| Modo          | URL                                                        |
| ------------- | ---------------------------------------------------------- |
| Subdominio    | `https://planta.restopsiq.co`                              |
| Ruta monorepo | `/plant/kds/:stationId` (o equivalente en router de Plant) |

### Dispositivo objetivo

- Tablet **10" landscape** (≈ 1280×800)
- **100 % touch** — sin dependencia de mouse
- Targets táctiles generosos (keypad login ≥ **80×80 px**)

---

## Stack y convenciones

| Capa             | Tecnología                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| App              | Vite, React, `react-router` (cuando esté cableado — ver `tasks/app-plant/03-routing-and-screen-shells.md`) |
| Estilos pantalla | `*.module.scss` + tokens `apps/plant/src/styles/_tokens.scss`                                              |
| UI compartida    | `@restopsiq/ui` — importar componentes, **no** copiar CSS del design system                                |
| Estado           | Zustand (`session.store`, `timer.store`, `connectivity.store`)                                             |
| Tiempo real      | `usePlantSocket` + `plant-socket.service`                                                                  |
| Cronómetro       | `timer.store` — `setInterval` local, **no** depende del servidor                                           |

### Patrón de carpeta por pantalla

```txt
apps/plant/src/screens/<ScreenName>/
 ├── <ScreenName>.tsx
 ├── <ScreenName>.module.scss
 ├── <ScreenName>.test.tsx      # rutas críticas
 └── index.ts
```

### Tema UI en Plant

- KDS operario: **`theme="dark"`** por defecto en todos los componentes Field Ops
- Storybook sirve como referencia visual light/dark; en producción KDS prioriza **dark**

---

## Componentes `@restopsiq/ui` (Field Ops)

Antes de implementar cada pantalla, revisar en Storybook:

```bash
pnpm --filter @restopsiq/ui storybook
```

| Pantalla    | Componentes Storybook                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login       | `PinKeypad`, `PinKey`, `FieldAlertBanner`, (éxito) animación + copy operario                                                                                                                     |
| Fase activa | `FieldStatusCard`, `OpsInfoPanel`, `StatusBadge`, `PhaseIndicator`, `TripActionButton`, `CompletePhaseButton` (`variant="default"`), `FieldAlertBanner`                                          |
| Cierre fase | `PhaseCompletionHeader`, `PhaseInfoCard`, `QuantityInputDisplay`, `DecimalKeypad`, `FieldObservationsPanel`, `PhaseSummaryPanel`, `PhaseBackButton`, `CompletePhaseButton` (`variant="confirm"`) |

Referencia de implementación de componentes: `tasks/packages-ui/05-field-ops-figma-components.md`  
Referencias PNG: `tasks/packages-ui/design-references/field-ops/`

---

## Tareas de pantalla (UI-KDS)

| #   | Archivo                                                              | Pantalla                            | Ruta sugerida     |
| --- | -------------------------------------------------------------------- | ----------------------------------- | ----------------- |
| 1   | [01-kds-login-screen.md](./01-kds-login-screen.md)                   | Login PIN                           | `/login`          |
| 2   | [02-kds-active-phase-screen.md](./02-kds-active-phase-screen.md)     | Fase activa                         | `/phase/active`   |
| 3   | [03-kds-complete-phase-screen.md](./03-kds-complete-phase-screen.md) | Cierre / cantidad                   | `/phase/complete` |
| 4   | [04-kds-cross-cutting.md](./04-kds-cross-cutting.md)                 | Touch, WS, offline, flujo ≤5 toques | —                 |

### Infraestructura previa (app-plant)

Estas tareas UI asumen o coordinan con:

- `tasks/app-plant/03-routing-and-screen-shells.md`
- `tasks/app-plant/04-zustand-stores.md`
- `tasks/app-plant/08-plant-socket-hook.md`
- `tasks/app-plant/09-offline-sync-queue.md`
- `tasks/app-plant/10-operator-login-screen.md` (UI detallada en UI-KDS 01)
- `tasks/app-plant/11-operator-phase-screens.md` (UI detallada en UI-KDS 02–03)

---

## Dependencia de paquete UI

Agregar en `apps/plant/package.json`:

```json
"@restopsiq/ui": "workspace:*"
```

Import ejemplo:

```tsx
import { PinKeypad, FieldStatusCard } from '@restopsiq/ui';
```

---

## Criterios globales de producto (resumen)

Ver detalle en [04-kds-cross-cutting.md](./04-kds-cross-cutting.md):

- [ ] Sin mouse — 100 % touch
- [ ] Flujo operario ≤ **5 toques** desde llegada a estación hasta fase en curso (medido en UX review)
- [ ] WebSocket actualiza estado **sin recargar**
- [ ] Sin WiFi: cronómetro local sigue; sincroniza al reconectar

---

## Validación

```bash
pnpm --filter @restopsiq/ui storybook          # componentes
pnpm turbo dev --filter=@restopsiq/plant      # pantallas
pnpm turbo test --filter=@restopsiq/plant
pnpm turbo typecheck --filter=@restopsiq/plant
```
