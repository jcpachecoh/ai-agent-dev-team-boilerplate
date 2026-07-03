# UI-KDS-02: Pantalla principal — Fase activa

**Domain:** `[UI-KDS]` `[PLANT]` `[TOUCH]` `[TIMER]` `[WEBSOCKET]`  
**Assigned Agent:** frontend-developer  
**Status:** `done`  
**Created:** 2026-05-22  
**Depends On:** [00-epic.md](./00-epic.md), [01-kds-login-screen.md](./01-kds-login-screen.md), `tasks/packages-ui/05-field-ops-figma-components.md`, `tasks/app-plant/08-plant-socket-hook.md`, `tasks/app-plant/04-zustand-stores.md`

---

## Objetivo

Pantalla principal del operario con **fase en curso**: header de OP/fase/prioridad, instrucciones con scroll, referencia visual opcional, **cronómetro grande con semáforo de tiempo**, área de estado de fase y footer con operarios activos. Acciones táctiles con **doble toque** para evitar errores.

Componer UI con **`@restopsiq/ui`** (Storybook **Field Ops/**) + lógica en `timer.store` y `usePlantSocket`.

---

## Ubicación

```txt
apps/plant/src/screens/ActivePhaseScreen/
 ├── ActivePhaseScreen.tsx
 ├── ActivePhaseScreen.module.scss
 ├── ActivePhaseScreen.test.tsx
 ├── components/                    # solo wrappers Plant-specific si hace falta
 │   ├── PhaseTimerBlock.tsx        # enlaza FieldStatusCard + timer.store
 │   ├── OperatorChipsFooter.tsx    # PhaseIndicator lista horizontal
 │   └── DoubleTapActionButton.tsx  # wrapper doble tap sobre Trip/Complete buttons
 └── index.ts
```

**Ruta:** `/phase/active`  
Referencia PNG: `tasks/packages-ui/design-references/field-ops/reference_dark.png`

---

## Storybook — componentes a reutilizar

| Componente            | Story                          | Uso                                                        |
| --------------------- | ------------------------------ | ---------------------------------------------------------- |
| `StatusBadge`         | `AnimatedActive`, variant pill | Prioridad **URGENTE** (rojo pulsante vía SCSS `animation`) |
| `OpsInfoPanel`        | `Default`, `DarkMode`          | Instrucciones de proceso (lista numerada + iconos lucide)  |
| `FieldStatusCard`     | `Default`, `DarkMode`          | Bloque cronómetro + tag alerta + barra % tiempo estándar   |
| `TripProgressStrip`   | `Default`                      | Meta cantidad "50 kg" (si aplica en layout derecho)        |
| `PhaseIndicator`      | `Default`                      | Chips operarios (reutilizar como lista; footer horizontal) |
| `TripActionButton`    | `Pause`, `ReportIssue`         | PAUSAR / REPORTAR NOVEDAD                                  |
| `CompletePhaseButton` | `Default`, `FullWidthXL`       | COMPLETAR (`variant="default"`)                            |
| `FieldAlertBanner`    | `Warning`                      | Alertas de fase / seguridad alimentaria                    |

**No** duplicar markup de Figma en Plant; importar desde `@restopsiq/ui`.

---

## Layout (tablet landscape)

### Header

- Logo / marca planta (opcional, tokens Plant)
- Badge estación (`EST-02`)
- **OP** + nombre producto (ej. `OP-000012` · Pollo asado porcionado)
- **Nombre fase** grande (ej. `FASE 2 — CORTE Y PORCIONADO`)
- `StatusBadge` **URGENTE** — rojo + animación pulse si `priority === 'urgent'`
- Reloj local + indicador alerta operario (si API lo envía)

### Centro (columna principal ~60 %)

- `OpsInfoPanel` — título "Instrucciones de fase", ítems con scroll (`max-height` + overflow)
- **Foto de referencia** — `<img>` o placeholder "Referencia visual"; URL desde API; lazy load
- **Área estado visual grande** — slot según `phaseVisualType` (icono, ilustración, o mensaje); puede ser wrapper SCSS alrededor de contenido API

### Columna derecha (~40 %)

- `FieldStatusCard` — cronómetro (ver sección Timer)
- `TripProgressStrip` — cantidad a producir si aplica
- Fila acciones: `TripActionButton` pause + report-issue
- `CompletePhaseButton` full width — **visible solo** si fase `status === 'in_progress'`

### Footer

- Título "Operadores en turno"
- Lista horizontal o grid de `PhaseIndicator` por operario (`name`, `timer`, `accent`)

---

## Cronómetro (requisito crítico)

**Fuente de verdad:** `useTimerStore` — `setInterval` 1 s local. **No** esperar ticks del servidor.

| Condición                            | Color UI (`FieldStatusCard` / wrapper) |
| ------------------------------------ | -------------------------------------- |
| `elapsed < 80%` estándar             | Verde (`accent` / clase `--on-time`)   |
| `elapsed >= 80%` y `< 100%` estándar | Amarillo (`--warning`)                 |
| `elapsed >= 100%` estándar           | Rojo (`--over`) + tag ALERTA           |

- Display **mm:ss** — tipografía grande, legible a **2 metros** (mín. ~3rem en md/xl)
- `standardDurationMs` desde API/fase; persistir en store al iniciar fase
- Offline: timer sigue; al reconectar, opcional sync de tiempo con servidor (no bloquea UI)

Implementación sugerida: `PhaseTimerBlock` lee `elapsedMs` + `standardMs` y pasa `progress` / `statusTag` a `FieldStatusCard`.

---

## Acciones y doble toque

| Acción           | Componente                                         | Ancho | Visible cuando                     |
| ---------------- | -------------------------------------------------- | ----- | ---------------------------------- |
| INICIAR          | `CompletePhaseButton` o botón Plant verde dedicado | 100 % | `idle` / fase asignada no iniciada |
| PAUSAR           | `TripActionButton` `variant="pause"`               | 50 %  | `running`                          |
| REPORTAR NOVEDAD | `TripActionButton` `variant="report-issue"`        | 50 %  | siempre en activa                  |
| COMPLETAR        | `CompletePhaseButton` `variant="default"`          | 100 % | solo `in_progress`                 |

**Doble toque:** wrapper `DoubleTapActionButton` — primer tap muestra hint "Toca de nuevo para confirmar" (2 s); segundo tap ejecuta `onConfirm`. Reset si pasa timeout.

Colores acción (alineados a spec):

- INICIAR / COMPLETAR: verde (teal/success del design system)
- PAUSAR: rojo/outline danger
- NOVEDAD: naranja — `TripActionButton` report-issue

---

## WebSocket

- Suscribir `usePlantSocket` a `phase:status_changed`, `operator:updated`, etc.
- Actualizar store de fase **sin** `window.location.reload`
- Si evento indica fase completada por otro operario → navegar según reglas de negocio

---

## Integración

```tsx
import {
  FieldStatusCard,
  OpsInfoPanel,
  PhaseIndicator,
  TripActionButton,
  CompletePhaseButton,
  StatusBadge,
  TripProgressStrip,
} from '@restopsiq/ui';
```

- `theme="dark"` en todos los componentes Field Ops
- `size="md"` o `xl` según breakpoint tablet

---

## Testing

| Caso                                           | Tipo                     |
| ---------------------------------------------- | ------------------------ |
| Timer verde/amarillo/rojo según umbrales       | Unit — `PhaseTimerBlock` |
| COMPLETAR oculto si no `in_progress`           | Unit                     |
| Doble tap dispara acción una vez               | Unit                     |
| Socket mock actualiza header OP                | Unit                     |
| Timer corre con store pausado/simulado offline | Unit — timer.store       |

---

## Criterios de aceptación

- [ ] Pantalla en `ActivePhaseScreen/` con layout 2 columnas + footer
- [ ] Header: OP + fase + badge urgente pulsante
- [ ] Instrucciones con scroll; foto referencia opcional
- [ ] Cronómetro mm:ss legible; colores 80 % / 100 % del estándar
- [ ] Timer usa `timer.store` únicamente para tick
- [ ] Acciones con doble confirmación
- [ ] COMPLETAR solo visible en proceso
- [ ] Footer con operarios (`PhaseIndicator`)
- [ ] Componentes importados de `@restopsiq/ui`, validados en Storybook
- [ ] WS actualiza UI sin reload ([04-kds-cross-cutting.md](./04-kds-cross-cutting.md))
- [ ] Tests unitarios críticos pasan

---

## Fuera de alcance

- Overlay cámara / incidente detallado (puede ser modal en misma pantalla — tarea futura o extensión app-plant 11)
- Pantalla cierre ([03-kds-complete-phase-screen.md](./03-kds-complete-phase-screen.md))

---

## Comandos

```bash
pnpm --filter @restopsiq/ui storybook
pnpm turbo dev --filter=@restopsiq/plant
pnpm turbo test --filter=@restopsiq/plant
```
