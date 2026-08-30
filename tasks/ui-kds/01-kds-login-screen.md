# UI-KDS-01: Pantalla Login (PIN operario)

**Domain:** `[UI-KDS]` `[PLANT]` `[TOUCH]` `[AUTH]`  
**Assigned Agent:** frontend-developer  
**Status:** `pending`  
**Created:** 2026-05-22  
**Depends On:** [00-epic.md](./00-epic.md), `tasks/packages-ui/05-field-ops-figma-components.md`, `tasks/app-plant/03-routing-and-screen-shells.md`, `tasks/app-plant/04-zustand-stores.md`, `tasks/app-plant/05-station-id-provisioning.md`

---

## Objetivo

Pantalla de login del KDS: fondo oscuro, nombre de estación prominente, teclado numérico táctil y feedback de PIN correcto/incorrecto. Optimizada para tablet 10" landscape.

**Implementar con componentes de `@restopsiq/ui`**, componiendo en Plant solo layout, estado PIN y llamadas a API — no reimplementar teclas ni estilos del keypad.

---

## Ubicación

```txt
apps/plant/src/screens/LoginScreen/
 ├── LoginScreen.tsx
 ├── LoginScreen.module.scss
 ├── LoginScreen.test.tsx
 └── index.ts
```

**Ruta:** `/login` (o `/plant/kds/:stationId/login` según router final)  
**Acceso app:** `planta.restopsiq.co` · `pnpm turbo dev --filter=@restopsiq/plant`

---

## Storybook (fuente visual)

Validar en **Field Ops/** antes de integrar:

| Componente         | Story                            | Uso en pantalla                                                   |
| ------------------ | -------------------------------- | ----------------------------------------------------------------- |
| `PinKeypad`        | `WithInput`, `DarkMode`, `Sizes` | Teclado 0–9 + borrar + OK/ingresar                                |
| `PinKey`           | `SemanticDanger`, `Sizes`        | Celdas ≥80×80 en `size="xl"` + overrides SCSS plant si hace falta |
| `FieldAlertBanner` | `Error`, `DarkMode`              | Mensaje PIN incorrecto                                            |

Referencia PNG: `tasks/packages-ui/design-references/field-ops/reference_dark.png`

---

## Diseño y layout

### Estructura

1. **Header estación** — Nombre de planta/estación en grande (ej. "Palos de Leña" + badge `EST-02`). Puede usar tipografía/tokens `apps/plant` + badge gold local o `StatusBadge` si aplica.
2. **Título fase/área** — Ej. "Corte y deshuese" (desde API o store de estación).
3. **Indicador PIN** — 4 círculos vacíos/llenos (no usar imágenes Figma; CSS o componente ligero en Plant).
4. **`PinKeypad`** — `theme="dark"`, `size="xl"`; ajustar `--pin-cell-width/height` en SCSS de pantalla para **mínimo 80×80 px** por tecla.
5. **Hint demo** (solo dev/staging): texto pequeño "DEMO: PIN correcto = …" si el entorno lo permite.
6. **Barra estado** — Línea inferior: sistema operativo, turno, ciudad (copy desde store/API).

### Comportamiento PIN

| Evento             | UX                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tecla 0–9          | Añade dígito hasta longitud máxima (4, alinear con backend)                                                                                                                |
| Borrar             | Elimina último dígito                                                                                                                                                      |
| Ingresar / OK      | Valida contra API → `session.store.login`                                                                                                                                  |
| **PIN correcto**   | Animación éxito verde (CSS o `framer-motion` si ya está en app) + **nombre del operario** en pantalla 1–2 s → navegar a fase activa                                        |
| **PIN incorrecto** | **Vibración** del keypad (`navigator.vibrate` si disponible) + `FieldAlertBanner` variant danger: texto genérico **"PIN incorrecto"** — **no** revelar si el código existe |

### Seguridad / copy

- Mensaje de error único y genérico.
- No loguear PIN en consola ni analytics.

---

## Integración técnica

```tsx
import { PinKeypad, FieldAlertBanner } from '@restopsiq/ui';
import { useSessionStore } from '@/stores/session.store';
```

- `stationId` desde `session.store` o param `:stationId`
- Auth: `plant-api.service` / `auth.service` (crear si no existe)
- Tras éxito: `navigate('/phase/active')` o ruta que indique API (`pending` vs `active`)

### SCSS Plant

- Clase raíz: `.screen-operator` + `LoginScreen.module.scss`
- Layout: columna centrada, `min-height: 100vh`, safe-area para tablet
- **Prohibido** hardcodear colores hex en TSX; tokens en SCSS o variables de `@restopsiq/ui` vía tema dark

---

## Touch y accesibilidad

- [ ] Todas las teclas ≥ **80×80 px** (inspección DevTools)
- [ ] `aria-label` en cada tecla (viene de `PinKey`)
- [ ] Foco visible si hay teclado hardware (secundario)
- [ ] Contraste texto/ fondo cumple legibilidad a 2 m para título estación

---

## Testing

| Caso                                            | Tipo                 |
| ----------------------------------------------- | -------------------- |
| Render keypad + 4 dots                          | Unit (RTL)           |
| PIN incompleto no envía submit                  | Unit                 |
| PIN erróneo muestra banner + llama vibrate mock | Unit                 |
| PIN ok llama `login` del store                  | Unit — mock API      |
| Tamaño mínimo teclas                            | Unit o manual tablet |

```bash
pnpm turbo test --filter=@restopsiq/plant
```

---

## Criterios de aceptación

- [ ] Pantalla en `apps/plant/src/screens/LoginScreen/` con SCSS modules
- [ ] Usa `PinKeypad` / `PinKey` de `@restopsiq/ui` (`theme="dark"`)
- [ ] Teclas ≥ 80×80 px en tablet landscape
- [ ] Éxito: animación verde + nombre operario → navegación
- [ ] Error: vibración + "PIN incorrecto" sin filtrar información
- [ ] Nombre de estación visible sin scroll
- [ ] Storybook Field Ops revisado como referencia antes del PR
- [ ] Tests unitarios críticos pasan

---

## Fuera de alcance

- Pantalla fase activa ([02-kds-active-phase-screen.md](./02-kds-active-phase-screen.md))
- Provisioning de `stationId` (task app-plant 05)

---

## Comandos

```bash
pnpm --filter @restopsiq/ui storybook
pnpm turbo dev --filter=@restopsiq/plant
```
