# PLT-05 UI-01 — `PlantIncidentReportModal` v2 (grid tipos, gravedad, toggle pausa)

**Parent:** `../16-production-novelties.md`  
**Status:** `pending`  
**Depends on:** Ninguna (puede usar tipos mock); integración real en PLT-01/02  
**Blocks:** `04-novelties-list-tab.md`, `06-active-order-integration.md`

---

## Goal

Rediseñar el modal de reporte de novedad para tablet industrial: ~80% viewport, selector visual de 7 tipos con íconos, gravedad con colores, toggle de pausa, y CTA **REGISTRAR NOVEDAD**.

---

## Scope

- Refactor `PlantIncidentReportModal.tsx` + `.module.scss`:
  - Tamaño modal `~80vh` / ancho máximo tablet (reutilizar `PlantDashboardModalPortal`).
  - **Grid 2×4 o scroll** de 7 tipos touch (mín. 48×48px target):
    - Faltante de insumo, Falla equipo, Desviación receta, Paro no planificado, Seguridad, Calidad, Otro.
  - Íconos `lucide-react` (o set field-ops existente).
  - Textarea descripción **obligatorio** (validación visual si vacío al submit).
  - Chips gravedad: Baja (🟡), Media (🟠), Alta (🔴).
  - Toggle «¿Requiere pausa de la orden?».
  - Botón primario: **REGISTRAR NOVEDAD**; secundario: Cancelar.
- Actualizar `plant-workstation-types.ts`:
  - `PlantNoveltyType` (7 valores alineados con BE).
  - `PlantNoveltySeverity`: `LOW` | `MEDIUM` | `HIGH`.
  - Constantes `PLANT_NOVELTY_TYPE_OPTIONS` con `label`, `icon`, `value`.
- Props del modal: reemplazar `PlantIncidentType` legacy por `PlantNoveltyType` donde aplique; mantener compat export alias si hay consumidores.
- Storybook: story con modal abierto mostrando grid y estados.
- **Fase 2:** ocultar o dejar detrás de flag el bloque «Tomar foto» (no bloquear MVP).

---

## Out of Scope

- Llamadas API (task PLT-01).
- Lista tab NOVEDADES (task UI-02).
- Cambios en `apps/plant/**` (task PLT-02).
- `ReportNovedadModal` legacy en `packages/ui/src/components/Modal/` (deprecar en comentario, no eliminar en esta task).

---

## Files allowed

- `packages/ui/src/components/field-ops/plant-dashboard/plant-incident-report-modal/**`
- `packages/ui/src/components/field-ops/plant-dashboard/shared/plant-workstation-types.ts`
- `packages/ui/src/index.tsx` (exports si aplica)

---

## Files forbidden

- `apps/api/**`
- `apps/plant/**`
- `package.json`, `pnpm-lock.yaml`

---

## Implementation notes

### Accesibilidad

- Grid tipos: `role="radiogroup"`, cada opción `role="radio"` + `aria-checked`.
- Toggle pausa: `aria-label` descriptivo.
- Focus trap dentro del modal (portal existente).

### Validación UI

- Deshabilitar submit si descripción vacía o tipo no seleccionado.
- Mostrar error inline bajo textarea.

### Copy (es-CO)

| Value                 | Label UI                  |
| --------------------- | ------------------------- |
| `INGREDIENT_SHORTAGE` | Faltante de insumo        |
| `EQUIPMENT_FAILURE`   | Falla de equipo / máquina |
| `RECIPE_DEVIATION`    | Desviación de receta      |
| `UNPLANNED_STOP`      | Paro no planificado       |
| `SAFETY_INCIDENT`     | Incidente de seguridad    |
| `QUALITY_ISSUE`       | Calidad del producto      |
| `OTHER`               | Otro                      |

---

## Acceptance criteria

- [ ] Modal ocupa ~80% altura en viewport story/tablet breakpoint.
- [ ] 7 tipos seleccionables con íconos grandes; un solo tipo activo.
- [ ] Gravedad con 3 chips de color distinguibles.
- [ ] Toggle pausa visible y controlado por props.
- [ ] Submit invoca `onSubmit` solo con descripción no vacía.
- [ ] `pnpm --filter @restopsiq/ui build` en verde.

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter @restopsiq/ui typecheck
```
