# UI-KDS-03: Pantalla de cierre — Completar fase

**Domain:** `[UI-KDS]` `[PLANT]` `[TOUCH]` `[NUMPAD]`  
**Assigned Agent:** frontend-developer  
**Status:** `pending`  
**Created:** 2026-05-22  
**Depends On:** [00-epic.md](./00-epic.md), [02-kds-active-phase-screen.md](./02-kds-active-phase-screen.md), `tasks/packages-ui/05-field-ops-figma-components.md`, `tasks/app-plant/09-offline-sync-queue.md`

---

## Objetivo

Pantalla de **cierre de fase**: cantidad producida con teclado decimal, unidad, notas opcionales, resumen y confirmación final. Replica el flujo de la referencia "Completar fase" usando componentes **Field Ops** ya publicados en Storybook.

---

## Ubicación

```txt
apps/plant/src/screens/CompletePhaseScreen/
 ├── CompletePhaseScreen.tsx
 ├── CompletePhaseScreen.module.scss
 ├── CompletePhaseScreen.test.tsx
 └── index.ts
```

**Ruta:** `/phase/complete`  
Story compuesta de referencia: **Field Ops/Complete Phase Screen** (`packages/ui`)  
PNG / diseño: captura pantalla Completar fase (nodos Figma 45-505 … 45-571)

---

## Storybook — mapa de componentes

| Nodo / bloque            | Componente `@restopsiq/ui` | Story                                              |
| ------------------------ | -------------------------- | -------------------------------------------------- |
| Título éxito             | `PhaseCompletionHeader`    | `Default`, `DarkMode`                              |
| Tarjeta OP/fase/producto | `PhaseInfoCard`            | `Default`                                          |
| Cantidad producida       | `QuantityInputDisplay`     | `Default`                                          |
| Teclado decimal          | `DecimalKeypad`            | `WithInput`, `DarkMode`                            |
| Observaciones            | `FieldObservationsPanel`   | `Default`                                          |
| Resumen                  | `PhaseSummaryPanel`        | `Default`                                          |
| Volver                   | `PhaseBackButton`          | `Default`                                          |
| Confirmar                | `CompletePhaseButton`      | `Confirm`, `FullWidthXL` — **`variant="confirm"`** |

```tsx
import {
  PhaseCompletionHeader,
  PhaseInfoCard,
  QuantityInputDisplay,
  DecimalKeypad,
  FieldObservationsPanel,
  PhaseSummaryPanel,
  PhaseBackButton,
  CompletePhaseButton,
} from '@restopsiq/ui';
```

---

## Layout

### Columna principal (centro)

1. `PhaseCompletionHeader` — "Completar fase"
2. `PhaseInfoCard` — `opId`, `phaseLabel`, `productName` desde store/API
3. `QuantityInputDisplay` — valor controlado local (`quantity` string), `unit`, `hint` (meta vs real, ej. `Meta: 50.0 kg (-1.5 kg)` en teal)
4. `DecimalKeypad` — actualiza `quantity`; soporta decimal y backspace

### Sidebar (derecha en landscape)

1. `FieldObservationsPanel` — notas opcionales; `onChange` → store o estado local
2. `PhaseSummaryPanel` — filas: Fase, OP, Tiempo (gold), Meta, Real (success)
3. `PhaseBackButton` — navega `navigate(-1)` o `/phase/active`
4. `CompletePhaseButton` — `variant="confirm"`, `size="xl"`, ancho 100 %

### Selector de unidad

- Debajo o junto a `QuantityInputDisplay`: control Plant (segmented o `<select>` táctil) — `kg` | `un` | según API
- Actualiza `unit` mostrada en display
- Estilos con tokens Plant; no nuevo componente en `packages/ui` salvo que design system lo pida después

---

## Comportamiento

| Acción         | Comportamiento                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Tecla numérica | Append a `quantity` con validación (un solo `.`)                                                           |
| Borrar         | slice último carácter                                                                                      |
| Volver         | Descarta cambios no guardados (confirmar si hay delta)                                                     |
| Confirmar      | Validar `quantity > 0` → API `completePhase` o cola offline → éxito → `/phase/pending` o login según flujo |
| Offline        | Encolar en `offline-queue.service`; UI feedback con banner                                                 |

**Doble toque (opcional pero recomendado):** mismo patrón que [02-kds-active-phase-screen.md](./02-kds-active-phase-screen.md) en botón confirmar.

---

## Estado y datos

```ts
// Ejemplo estado local
quantity: string;      // "48.5"
unit: 'kg' | string;
notes: string;
phaseSummary: PhaseSummaryRow[];
```

- `Tiempo` en resumen: desde `timer.store` (`formatElapsed`)
- `Real`: `quantity` + unit
- `Meta`: desde API fase

---

## SCSS Plant

- Grid 2 columnas ≥ 992px; 1 columna en portrait (fallback)
- `theme="dark"` en todos los imports UI
- Pantalla: `.screen-operator` + module scoped

---

## Testing

| Caso                                    | Tipo      |
| --------------------------------------- | --------- |
| Keypad actualiza display                | Unit      |
| No permite segundo `.`                  | Unit      |
| Confirm deshabilitado si quantity vacía | Unit      |
| Confirm llama API / queue offline       | Unit mock |
| Back navega sin perder sesión           | Unit      |

---

## Criterios de aceptación

- [ ] `CompletePhaseScreen/` implementada con SCSS modules
- [ ] Todos los bloques usan componentes `@restopsiq/ui` listados arriba
- [ ] `CompletePhaseButton` usa **`variant="confirm"`** (nodo Figma 45-571)
- [ ] Campo cantidad grande + `DecimalKeypad`
- [ ] Selector de unidad funcional
- [ ] Notas opcionales en `FieldObservationsPanel`
- [ ] Resumen con tonos gold/success en valores correctos
- [ ] Confirmación persiste vía API o cola offline
- [ ] Validado contra Storybook **Complete Phase Screen** (Dark)
- [ ] Tests unitarios críticos pasan

---

## Fuera de alcance

- Login ([01-kds-login-screen.md](./01-kds-login-screen.md))
- Edición de fase en supervisor

---

## Comandos

```bash
pnpm --filter @restopsiq/ui storybook
pnpm turbo dev --filter=@restopsiq/plant
pnpm turbo test --filter=@restopsiq/plant
```
