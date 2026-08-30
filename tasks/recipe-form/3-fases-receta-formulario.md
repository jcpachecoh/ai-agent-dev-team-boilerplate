# REC-FORM-30 — Formulario Nueva Receta: bloque Fases

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]` `[RECETAS]` `[REST]`  
**Assigned Agent:** frontend-developer (con dependencias BE en tasks 09, 12–13)  
**Status:** `pending`  
**Depends on:** `10-nueva-receta-formulario.md`, `20-composicion-receta-formulario.md`, `09-schema-fases.md`, `12-backend-fases.md`, `13-api-fases-dtos.md`  
**Epic:** `00-epic.md`  
**Wizard step:** 3 de 3 — **Fases** (último paso antes de guardar; el paso `review` actual del wizard se sustituye por guardado directo o resumen inline en esta task)

---

## Goal

Modificar el formulario de **Nueva receta** (tercer paso del wizard en `RecipesManagementScreen` / `RecetaRecipeWizard`) para capturar el bloque **Fases**: secciones expandibles por fase de proceso con tipo de fase, tiempo estándar, insumos (desde composición), utensilios/equipos filtrados, gramaje final, campos condicionales de empaque y almacén, criterios de rechazo, reordenamiento y validaciones de guardado.

---

## Scope

- Rediseñar el **paso 3** del wizard (actual `RecetaRecipeWizardPhasesStep` + modal de fase en `RecipesManagementScreen`).
- Wizard de **3 pasos:** Datos generales → Composición → **Fases** (actualizar `RecetaRecipeWizardStepId` y labels del stepper).
- Secciones expandibles/colapsables por fase con botón **+ Agregar fase**.
- Campos condicionales según tipo de fase (Empaque, Almacén).
- Multi-select de insumos **solo** desde líneas del paso 2 (Composición).
- Multi-select de utensilios/equipos filtrado por tipo de fase (+ Gramera global).
- Tiempo total acumulado vs `estimatedMinutes` del paso 1 (advertencia si diverge, no bloquea).
- Reordenar fases (DnD o subir/bajar); confirmación al eliminar si receta ya guardada.
- Integración API extendida de fases (tasks BE 09, 12–13).
- RBAC: readonly en `INACTIVE`; editable en `TRIAL` y `ACTIVE` para roles permitidos.

---

## Out of scope

- Bloques **Datos generales** (task `10`) y **Composición** (task `20`).
- App operativa `apps/plant` (iPad MES) — ejecución de fases en piso.
- Asignación de operarios / estaciones MES (`WorkStation`) en este formulario — el modelo legacy `workStationId` puede mantenerse oculto o mapearse en BE; la UI producto usa **tipo de fase** operativo.
- Cambios a `package.json`, `pnpm-lock.yaml`, `schema.prisma` o migraciones (tasks BE 09).
- `scripts/validate-structure.js`.

---

## Contexto actual vs. objetivo

| Campo producto              | Estado hoy (`ProductionPhase`)            | Gap                                                           |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Fase (tipo operativo)       | `name` texto libre + `workStationId`      | Enum: Dosificación, Cocción, Abatimiento, Empaque, Almacén    |
| Tiempo estándar             | `standardMinutes`                         | Mantener; UI horas + minutos opcional                         |
| Insumos por fase            | `PhaseInput` con select catálogo completo | Solo insumos de **Composición** (paso 2); multi-select        |
| Utensilios y equipos        | No existe                                 | Enum multi-select filtrado por fase                           |
| Gramaje final               | No existe                                 | Decimal positivo, 2 decimales, todas las fases                |
| Empaque requerido           | No existe                                 | Texto ≤ 100 chars; solo fase Empaque                          |
| Vida útil                   | No existe                                 | Valor + unidad tiempo; solo fase Almacén; obligatorio         |
| Condición de almacenamiento | No existe                                 | Refrigerado / Congelado / Ambiente; solo Almacén; obligatorio |
| Criterios de rechazo        | Parcial (`requiresQA` boolean)            | Multi-select: Temperatura, Olor, Color, Peso                  |
| Reorden / expandir          | Lista + modal edit                        | Acordeón expandible + DnD o botones                           |
| Trazabilidad                | Parcial AuditLog                          | Historial cambios fases (BE task 10)                          |

**Pantalla actual:** `RecipesManagementScreen` — modal de fase + `RecetaRecipeWizardPhasesStep` (lista de tarjetas).

**API actual:** `POST/PATCH /api/mes/plant/recipes/:id/phases`, `syncPlantRecipePhases`, `CreatePhaseDto` con `workStationId`, `inputs[]`.

---

## Bloque: Fases

### Campos por fase (sección expandible)

| Campo                           | Tipo UI           | Detalle                                                             | Obligatorio       |
| ------------------------------- | ----------------- | ------------------------------------------------------------------- | ----------------- |
| **Fase**                        | Lista desplegable | Dosificación y alistamiento, Cocción, Abatimiento, Empaque, Almacén | Sí                |
| **Tiempo estándar**             | Número o h + min  | Minutos positivos; tiempo esperado de elaboración                   | Sí                |
| **Insumos**                     | Multi-select      | Solo insumos del paso Composición; opcional por fase                | Regla global AC 4 |
| **Utensilios y equipos**        | Multi-select      | Filtrado por fase; Gramera siempre disponible                       | No                |
| **Gramaje final**               | Número            | Positivo, hasta 2 decimales; visible en todas las fases             | No                |
| **Empaque requerido**           | Texto             | ≤ 100 caracteres; **solo** fase Empaque                             | Condicional       |
| **Vida útil**                   | Número + unidad   | Horas, días o semanas; **solo** fase Almacén                        | Condicional (Sí)  |
| **Condición de almacenamiento** | Selector          | Refrigerado, Congelado, Ambiente; **solo** fase Almacén             | Condicional (Sí)  |
| **Criterios de rechazo**        | Multi-select      | Temperatura, Olor, Color, Peso; todas las fases                     | No                |

### Valores de catálogo (MVP)

**Tipo de fase (`RecipeProcessPhaseType`)**

| Valor Prisma (propuesto) | Label UI                    |
| ------------------------ | --------------------------- |
| `DOSIFICATION_PREP`      | Dosificación y alistamiento |
| `COOKING`                | Cocción                     |
| `CHILLING`               | Abatimiento                 |
| `PACKAGING`              | Empaque                     |
| `COLD_STORAGE`           | Almacén (Cuartos Fríos)     |

> Una misma fase puede repetirse (ej. dos bloques de Cocción).

**Utensilios y equipos (`RecipePhaseEquipment`) — filtro por fase**

| Fase / contexto             | Equipos (labels UI)                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `COOKING`                   | Horno, Ahumador, Freidoras, Horno Combi, Marmita Basculante, Pataconera, Licuadora, Batidora, Estufa |
| `CHILLING`                  | Ultracongelador                                                                                      |
| `DOSIFICATION_PREP`         | Bowl, Cucháron, Cuchillo, Hachuela, Pelapapa, Cutter                                                 |
| `COLD_STORAGE`              | Cuartos Fríos                                                                                        |
| `PACKAGING`                 | Máquina de empaque al vacío                                                                          |
| **Todas** (siempre visible) | Gramera                                                                                              |

**Criterios de rechazo (`RecipeRejectionCriterion`)**

- `TEMPERATURE` → Temperatura
- `SMELL` → Olor
- `COLOR` → Color
- `WEIGHT` → Peso

**Condición de almacenamiento (`StorageCondition`)**

- `REFRIGERATED` → Refrigerado
- `FROZEN` → Congelado
- `AMBIENT` → Ambiente

**Unidad vida útil (`ShelfLifeUnit`)**

- `HOURS`, `DAYS`, `WEEKS`

### Reglas de negocio

1. **Mínimo 1 fase** para guardar receta completa.
2. **Al menos una fase con insumos:** al menos un insumo de composición asignado a alguna fase (AC 4).
3. **Insumos:** solo IDs/líneas del estado composición del paso 2; un insumo puede estar en varias fases.
4. **Equipos:** al cambiar **Fase**, limpiar equipos no válidos para el nuevo tipo; mantener Gramera si estaba seleccionada.
5. **Campos condicionales:** ocultar/deshabilitar Empaque requerido, Vida útil y Condición fuera de sus fases; limpiar valores al cambiar tipo.
6. **Tiempo total:** suma `standardMinutes` de todas las fases; si |total − `estimatedMinutes` paso 1| > umbral (ej. 10 % o 15 min), advertencia visual (no bloquea).
7. **Eliminar fase** en receta persistida: confirmación.
8. **Estado Inactiva:** bloque readonly.
9. **Orden:** persistir `order` 1..n según UI; soportar reorder.

---

## UI / UX requirements

### Layout

- Título: **Fases** / **Fases del proceso**.
- Botón **+ Agregar fase** en header del bloque.
- Cada fase: acordeón (cabecera: número, label fase, tiempo estándar, acciones editar/eliminar/mover).
- Cuerpo expandido: grid 2 columnas desktop / 1 móvil (patrón `RecetaWizardField`).
- Footer del bloque:
  - **Tiempo total fases:** `{totalMin} min`
  - Advertencia si no coincide con tiempo estimado del paso 1.

### Navegación wizard (3 pasos)

| #   | Step ID (propuesto) | Label stepper   |
| --- | ------------------- | --------------- |
| 1   | `general`           | Datos generales |
| 2   | `composition`       | Composición     |
| 3   | `phases`            | Fases           |

- **Anterior** desde paso 3: conservar fases en memoria.
- **Guardar / Finalizar:** validar paso 3 + composición + datos generales; llamar API create/update completa.
- Eliminar o convertir paso `review` legacy a panel resumen colapsable opcional en paso 3 (MVP: botón **Guardar receta** sin paso revisión separado).

### Estados async

- Empty state: "Agrega al menos una fase" + CTA **+ Agregar fase**.
- Si paso 2 sin composición: mensaje en multi-select Insumos — "Registra insumos en Composición primero".
- Loading al sincronizar fases en edición.

### Accesibilidad

- Acordeón con `aria-expanded`, `aria-controls`.
- Labels en español; errores con `aria-describedby`.

---

## API consumption (contrato esperado — tasks BE 09, 12–13)

### Modelo propuesto (referencia)

```typescript
interface RecipeProcessPhase {
  id?: string;
  order: number;
  phaseType: RecipeProcessPhaseType;
  standardMinutes: number;
  compositionLineIds: string[]; // refs a RecipeCompositionLine del paso 2
  equipment: RecipePhaseEquipment[];
  finalWeight?: string | null; // decimal string, 2 decimales — gramaje final
  requiredPackaging?: string | null; // solo PACKAGING, max 100
  shelfLifeValue?: number | null; // solo COLD_STORAGE
  shelfLifeUnit?: ShelfLifeUnit | null;
  storageCondition?: StorageCondition | null;
  rejectionCriteria: RecipeRejectionCriterion[];
}
```

### Sincronización

Extender create/update receta o mantener sync dedicado:

```http
POST /api/mes/plant/recipes          # incluye phases[] en payload final
PATCH /api/mes/plant/recipes/:id
PUT  /api/mes/plant/recipes/:id/phases   # sync completo (reemplaza syncPlantRecipePhases actual)
```

**Compatibilidad legacy:** mapear `phaseType` ↔ `name`/`workStationId` en BE si MES plant aún consume estaciones; documentar en task `12-backend-fases.md`.

### Response detalle receta

```typescript
interface RecipeDetailResponse {
  // ...existente
  phases: RecipeProcessPhase[];
  composition: RecipeCompositionLine[];
}
```

---

## Files allowed

### `packages/ui`

- `packages/ui/src/components/receta/receta-recipe-wizard/RecetaRecipeWizard.tsx` — 3 pasos, wiring fases
- `packages/ui/src/components/receta/receta-recipe-wizard-phases-step/RecetaRecipeWizardPhasesStep.tsx` — rediseño acordeón fases
- `packages/ui/src/components/receta/receta-recipe-wizard-phases-step/RecetaRecipeWizardPhasesStep.module.scss`
- `packages/ui/src/components/receta/receta-recipe-wizard-review-step/RecetaRecipeWizardReviewStep.tsx` — deprecar o resumen mínimo pre-guardado (opcional)
- `packages/ui/src/components/receta/shared/receta-wizard-types.ts` — `RecetaRecipeWizardStepId` + tipos fase
- `packages/ui/src/components/receta/receta-step-card/RecetaStepCard.tsx` — ajustes si acordeón reutiliza card
- `packages/ui/src/index.tsx` — exports

### `apps/web-app`

- `apps/web-app/src/screens/RecipesManagementScreen/RecipesManagementScreen.tsx` — estado fases, eliminar modal legacy o refactor
- `apps/web-app/src/screens/RecipesManagementScreen/RecipesManagementScreen.module.scss`
- `apps/web-app/src/features/recetas/types.ts` — `RecipePhaseFormRow`, enums UI
- `apps/web-app/src/features/recetas/validation/recipePhases.schema.ts` — create (zod)
- `apps/web-app/src/features/recetas/validation/recipePhases.schema.test.ts` — create
- `apps/web-app/src/features/recetas/mappers/recipes.mapper.ts` — fases API ↔ UI, filtros equipos
- `apps/web-app/src/features/recetas/hooks/usePlantRecipeMutations.ts` — payload fases extendido
- `apps/web-app/src/features/recetas/hooks/useRecipePhases.ts` — create (carga/sync)
- `apps/web-app/src/features/recetas/constants/recipePhaseCatalogs.ts` — create (fases, equipos, criterios)
- `apps/web-app/src/components/recetas/RecipePhaseAccordion.tsx` — create
- `apps/web-app/src/components/recetas/RecipePhaseAccordion.module.scss` — create
- `apps/web-app/src/components/recetas/RecipePhaseFormFields.tsx` — create (campos condicionales)
- `apps/web-app/src/components/recetas/RecipePhaseFormFields.module.scss` — create
- `apps/web-app/src/features/recetas/hooks/index.ts` — exports
- `apps/web-app/src/api/plant/plant.api.ts` — tipos sync fases extendidos
- `apps/web-app/src/api/plant/types.ts`

---

## Files forbidden

- `apps/api/**` (tasks BE 09, 12–13)
- `apps/api/prisma/schema.prisma` y `migrations/**`
- `package.json`, `pnpm-lock.yaml`
- `scripts/validate-structure.js`

---

## Acceptance criteria

### AC 1: Visualización del bloque

- [ ] El formulario incluye un bloque claramente identificado como **Fases** (paso 3).
- [ ] Botón **+ Agregar fase** para múltiples fases.
- [ ] Cada fase es sección expandible/colapsable con todos sus campos.
- [ ] Cada fase tiene acción eliminar, con confirmación si la receta ya fue guardada.
- [ ] Las fases pueden reordenarse (drag & drop **o** botones subir/bajar).

### AC 2: Campo Fase

- [ ] Lista desplegable: Dosificación y alistamiento, Cocción, Abatimiento, Empaque, Almacén (Cuartos Fríos).
- [ ] La misma fase puede agregarse más de una vez.
- [ ] Campo obligatorio por fase.
- [ ] Al seleccionar fase, **Utensilios y equipos** se filtra automáticamente según catálogo.

### AC 3: Tiempo estándar

- [ ] Acepta minutos positivos o entrada horas + minutos.
- [ ] Obligatorio por fase.
- [ ] Al pie del bloque: **tiempo total acumulado** de todas las fases; advertencia si difiere del tiempo estimado del paso 1.

### AC 4: Insumos por fase

- [ ] Multi-select muestra **solo** insumos del bloque Composición (paso 2).
- [ ] Uno o varios insumos por fase; un insumo puede repetirse en varias fases.
- [ ] Opcional por fase; **al menos una fase** debe tener al menos un insumo para guardar la receta.

### AC 5: Utensilios y equipos requeridos

- [ ] Multi-select filtrado por fase según catálogo producto (Cocción, Abatimiento, Alistamiento, Almacén, Empaque).
- [ ] **Gramera** disponible en todas las fases.
- [ ] Campo opcional.

### AC 6: Gramaje final y empaque requerido

- [ ] **Gramaje final:** numérico positivo, 2 decimales, visible en todas las fases.
- [ ] **Empaque requerido:** solo visible/editable en fase Empaque; texto ≤ 100 caracteres.
- [ ] En otras fases, Empaque requerido oculto o deshabilitado.

### AC 7: Vida útil y condición de almacenamiento

- [ ] **Vida útil** y **Condición de almacenamiento** solo en fase Almacén (Cuartos Fríos).
- [ ] Ocultos/deshabilitados en otras fases.
- [ ] Vida útil: valor positivo + unidad (horas, días, semanas).
- [ ] Condición: Refrigerado, Congelado, Ambiente.
- [ ] Ambos obligatorios cuando la fase es Almacén.

### AC 8: Criterios de rechazo

- [ ] Multi-select en todas las fases: Temperatura, Olor, Color, Peso.
- [ ] Campo opcional.

### AC 9: Validaciones y guardado

- [ ] No guardar sin al menos una fase.
- [ ] Fase o Tiempo estándar incompletos → resaltado + mensaje de error.
- [ ] Campos condicionales validados solo cuando aplica su fase.
- [ ] Guardado exitoso: fases vinculadas y visibles en detalle en el orden definido.

### AC 10: Trazabilidad y permisos

- [ ] Modificaciones en fases (agregar, editar, reordenar, eliminar) en historial/auditoría (BE task 12).
- [ ] Solo roles permitidos editan fases en `TRIAL` o `ACTIVE`.
- [ ] Recetas `INACTIVE`: bloque fases readonly.

---

## Tests FE

- `recipePhases.schema.test.ts` — fase obligatoria, tiempo > 0, condicionales Empaque/Almacén, al menos una fase con insumos.
- Tests mapper: filtro equipos por fase, limpieza campos al cambiar tipo, total minutos.
- `RecipePhaseFormFields`: muestra/oculta Empaque, Vida útil, Condición según fase.
- Wizard/`RecipesManagementScreen`: no avanza sin fase; insumos vacíos si composición vacía.

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter web-app typecheck
pnpm --filter web-app test -- recipePhases
pnpm --filter web-app test -- RecipesManagement
pnpm --filter @restopsiq/api test -- plant.service
```

> Ejecutar tasks BE `09`, `12`–`13` y `pnpm exec prisma generate --schema=./apps/api/prisma/schema.prisma` antes de integrar API real.

---

## Notas de implementación

1. **Wizard 3 pasos:** actualizar `RecetaRecipeWizardStepId` de `'general' | 'phases' | 'review'` a `'general' | 'composition' | 'phases'` (task 20 + esta task coordinadas).
2. **Modal legacy:** `RecipesManagementScreen` hoy abre modal para editar fase; migrar a inline en acordeón o mantener modal como editor de sección expandida — preferir inline para AC 1.
3. **`workStationId` legacy:** BE puede derivar estación MES por `phaseType` para no romper ejecución plant; no exponer en UI producto.
4. **Composición requerida:** paso 3 asume paso 2 completado; validar al entrar o al guardar.
5. **DnD:** botones subir/bajar válidos para MVP si no hay librería DnD en el proyecto.
6. **i18n:** español Colombia; "Cucháron" según copy producto.

---

## Known dependencies

| Dependencia                          | Task propuesta                        |
| ------------------------------------ | ------------------------------------- |
| Composición (insumos por fase)       | `20-composicion-receta-formulario.md` |
| Datos generales (tiempo estimado)    | `10-nueva-receta-formulario.md`       |
| Schema fases + enums                 | `09-schema-fases.md`                  |
| Service fases + validaciones + audit | `12-backend-fases.md`                 |
| DTOs REST + sync phases              | `13-api-fases-dtos.md`                |

Implementar mocks en FE hasta API en staging.
