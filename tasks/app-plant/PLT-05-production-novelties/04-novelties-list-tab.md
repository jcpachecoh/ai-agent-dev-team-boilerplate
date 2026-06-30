# PLT-05 UI-02 — `PlantOrderNoveltiesList` + tab NOVEDADES en tarjeta OP

**Parent:** `../16-production-novelties.md`  
**Status:** `pending`  
**Depends on:** `03-incident-modal-redesign.md` (tipos compartidos)  
**Blocks:** `06-active-order-integration.md`

---

## Goal

Reemplazar el placeholder «Sin novedades registradas» en `PlantWorkstationCard` por un listado real de novedades de la orden, con empty state, badges de estado y formato touch-friendly.

---

## Scope

- Crear componente `PlantOrderNoveltiesList`:
  - Props: `items: PlantOrderNoveltyItem[]`, `loading?`, `theme`.
  - Cada ítem: tipo (label + ícono), gravedad (chip color), descripción (2 líneas max), fecha/hora relativa o `es-CO`, badge **Abierta** / **Resuelta**.
  - Orden: más reciente primero (el padre ordena o el componente asume pre-ordenado).
  - Empty state: «Sin novedades registradas» (copy actual).
  - Skeleton/loading opcional (3 filas).
- Tipo `PlantOrderNoveltyItem` en `plant-workstation-types.ts`.
- Integrar en `PlantWorkstationCard`:
  - Tab `incidents` renderiza `PlantOrderNoveltiesList` cuando `novelties` prop está definida.
  - Nueva prop opcional `novelties?: PlantOrderNoveltyItem[]` y `noveltiesLoading?: boolean`.
- Estilos SCSS alineados con tokens field-ops (borde rojo sutil en ítems abiertos de gravedad alta — opcional).
- Storybook: lista vacía, lista con 3 ítems (abierta + resuelta + alta gravedad).
- Export en `packages/ui/src/index.tsx`.

---

## Out of Scope

- Fetch de API (task PLT-02).
- Resolver novedad desde tablet (solo visualización; resolve es web supervisor).
- Cambios en `apps/plant/**`.

---

## Files allowed

- `packages/ui/src/components/field-ops/plant-dashboard/plant-order-novelties-list/**` (create)
- `packages/ui/src/components/field-ops/plant-dashboard/plant-workstation-card/**`
- `packages/ui/src/components/field-ops/plant-dashboard/shared/plant-workstation-types.ts`
- `packages/ui/src/index.tsx`

---

## Files forbidden

- `apps/api/**`
- `apps/plant/**`
- `package.json`, `pnpm-lock.yaml`

---

## Implementation notes

### Shape `PlantOrderNoveltyItem`

```typescript
interface PlantOrderNoveltyItem {
  id: string;
  noveltyType: PlantNoveltyType;
  severity: PlantNoveltySeverity;
  description: string;
  createdAt: string; // ISO
  resolvedAt?: string | null;
  requiresPause?: boolean;
}
```

### UX tab

- Al cambiar a tab NOVEDADES, no resetear tab PROCESO al cerrar modal (estado local `activeTab` ya existe).
- Badge contador opcional en label tab si `openCount > 0` (ej. `NOVEDADES (2)`).

---

## Acceptance criteria

- [ ] Placeholder reemplazado por lista cuando hay ítems.
- [ ] Empty state cuando `items.length === 0`.
- [ ] Ítem resuelto muestra badge distinto y estilo atenuado.
- [ ] Storybook documenta estados principales.
- [ ] `pnpm --filter @restopsiq/ui build` en verde.

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter @restopsiq/ui typecheck
```
