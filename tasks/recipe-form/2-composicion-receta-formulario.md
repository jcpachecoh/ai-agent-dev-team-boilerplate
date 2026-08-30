# REC-FORM-20 — Formulario Nueva Receta: bloque Composición de la receta

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]` `[RECETAS]` `[REST]`  
**Assigned Agent:** frontend-developer (con dependencias BE en tasks 06–08)  
**Status:** `pending`  
**Depends on:** `10-nueva-receta-formulario.md`, `06-schema-composicion.md`, `07-backend-composition.md`, `08-api-composition-dtos.md`  
**Epic:** `00-epic.md`  
**Wizard step:** 2 de 3 — **Composición de la receta** (sustituye el contenido legacy del paso `phases`; el paso 3 **Fases** queda en task `30-fases-receta-formulario.md`)

---

## Goal

Modificar el formulario de **Nueva receta** (segundo paso del wizard en `RecipesManagementScreen` / `RecetaRecipeWizard`) para capturar el bloque **Composición de la receta**: tabla editable de componentes con insumos del maestro de inventarios, tipo de componente, unidades de uso, cantidades bruta/neta, merma calculada, totales y validaciones de guardado.

---

## Scope

- Rediseñar el **paso 2** del wizard (`RecetaRecipeWizardPhasesStep` → renombrar o sustituir por paso **Composición**).
- Tabla editable multi-fila con autocomplete de insumos (`SupplyItem`).
- Enums de negocio: tipo de componente y unidad de uso.
- Validaciones zod del bloque (mínimo 1 fila, campos obligatorios, neta ≤ bruta).
- Cálculo de % merma por fila y resumen de totales al pie.
- Acciones de fila: agregar, eliminar, duplicar, reordenar (drag & drop o botones subir/bajar).
- Integración con API de composición (sync al guardar receta o endpoint dedicado según task BE 08).
- Resumen parcial en guardado final o panel opcional (paso `review` legacy se elimina o fusiona con paso 3 — ver task `30`).
- Modo edición: cargar composición existente; confirmación al eliminar fila si la receta ya fue guardada.
- RBAC en FE: deshabilitar edición si `lifecycleStatus === INACTIVE`.

---

## Out of scope

- **Paso 3 del wizard (Fases)** — task `30-fases-receta-formulario.md`.
- Cambios al bloque **Datos generales** (task `10-nueva-receta-formulario.md`).
- App operativa `apps/plant` (iPad MES).
- Costeo automático, explosión BOM multi-nivel o conversión de unidades avanzada (solo advertencia si unidad ≠ unidad base del insumo).
- Cambios a `package.json`, `pnpm-lock.yaml`, `schema.prisma` o migraciones (tasks BE 06–07).
- `scripts/validate-structure.js`.

---

## Contexto actual vs. objetivo

| Concepto producto           | Estado hoy                                                                 | Gap                                                                |
| --------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Composición de receta (BOM) | No existe a nivel receta; solo `PhaseInput` anidado en fases de producción | Nuevo modelo **a nivel receta** con bruta/neta/merma               |
| Código de insumo            | Select simple en modal de fase                                             | Autocomplete contra maestro inventarios por `codigoInterno`        |
| Tipo de componente          | No existe                                                                  | Enum Ingrediente, Subreceta, Empaque, Salsa, Topping, Decoración   |
| Unidad de uso               | `StockUnit` en fase                                                        | Enum UI: Gramo, Mililitro, Unidad, Kilo, Litro, Onza               |
| Cantidad bruta / neta       | Solo `quantityPerBatch` en fase                                            | Dos campos editables; neta ≤ bruta; % merma calculado              |
| Reorden / duplicar filas    | No en composición                                                          | DnD o botones; duplicar fila                                       |
| Totales composición         | No                                                                         | Total neta + conteo componentes; advertencia vs peso lote (paso 1) |
| Trazabilidad composición    | Parcial vía `AuditLog` global                                              | Eventos específicos add/edit/delete componente (BE task 07)        |
| Edición según estado receta | Parcial                                                                    | Bloquear edición en `INACTIVE`; permitir en `TRIAL` y `ACTIVE`     |

**Pantalla actual:** `RecipesManagementScreen` + `RecetaRecipeWizard` paso `phases` (`RecetaRecipeWizardPhasesStep`).

**API actual:** no expone composición de receta; `PhaseInput` solo vía fases (`POST /api/mes/plant/recipes/:id/phases`).

---

## Bloque: Composición de la receta

### Tabla editable

| Columna                | Tipo UI           | Detalle                                                      | Obligatorio |
| ---------------------- | ----------------- | ------------------------------------------------------------ | ----------- |
| **Código de insumo**   | Autocomplete      | Busca en maestro de inventarios (`SupplyItem.codigoInterno`) | Sí          |
| **Nombre del insumo**  | Texto readonly    | Autocompletado al seleccionar código (`SupplyItem.nombre`)   | Auto        |
| **Tipo de componente** | Lista desplegable | Ingrediente, Subreceta, Empaque, Salsa, Topping, Decoración  | Sí          |
| **Unidad de uso**      | Lista desplegable | Gramo, Mililitro, Unidad, Kilo, Litro, Onza                  | Sí          |
| **Cantidad bruta**     | Número            | Positivo, hasta 3 decimales; cantidad antes de merma         | Sí          |
| **Cantidad neta**      | Número            | Positivo, hasta 3 decimales; cantidad real usada             | Sí          |
| **% Merma**            | Texto readonly    | `((bruta - neta) / bruta) * 100`, visible por fila           | Auto        |
| **Acciones**           | Botones           | Eliminar, duplicar, subir/bajar (o handle DnD)               | —           |

### Valores de catálogo (MVP)

**Tipo de componente (`RecipeComponentType`)**

| Valor Prisma (propuesto) | Label UI    |
| ------------------------ | ----------- |
| `INGREDIENT`             | Ingrediente |
| `SUB_RECIPE`             | Subreceta   |
| `PACKAGING`              | Empaque     |
| `SAUCE`                  | Salsa       |
| `TOPPING`                | Topping     |
| `DECORATION`             | Decoración  |

**Unidad de uso (`RecipeUsageUnit`)**

| Valor Prisma (propuesto) | Label UI  | Mapeo sugerido `StockUnit`             |
| ------------------------ | --------- | -------------------------------------- |
| `GRAM`                   | Gramo     | `GRAMS`                                |
| `MILLILITER`             | Mililitro | `ML`                                   |
| `UNIT`                   | Unidad    | `UNIT`                                 |
| `KILOGRAM`               | Kilo      | `KILOGRAMS`                            |
| `LITER`                  | Litro     | `LITERS`                               |
| `OUNCE`                  | Onza      | `GRAMS` (× 28.3495) — documentar en BE |

> Los valores exactos de enum los define la task `06-schema-composicion.md`. El FE consume labels en español.

### Reglas de negocio

1. **Insumo inexistente:** si el autocomplete no encuentra coincidencia en inventarios activos del tenant → advertencia y no permitir agregar la fila.
2. **Subreceta:** si `componentType === SUB_RECIPE`, validar (BE) que el insumo vinculado corresponda a una receta **activa** (`lifecycleStatus === ACTIVE`) o mostrar error al guardar.
3. **Unidad vs maestro:** si `usageUnit` no es coherente con `SupplyItem.unidadBase` → banner/advertencia por fila (no bloquea guardado).
4. **Neta ≤ bruta:** error inline en fila si `netQuantity > grossQuantity`.
5. **Mínimo 1 componente:** no avanzar al paso 3 ni guardar receta completa sin al menos una fila válida (borrador puede omitir composición — confirmar con BE task 07).
6. **Peso lote vs total neta:** si suma de cantidad neta (normalizada a gramos cuando aplique) > `packageWeightGrams` del paso 1 → advertencia visual amarilla al pie (no bloquea).
7. **Eliminar fila en receta ya persistida:** `window.confirm` o modal de confirmación.
8. **Estado Inactiva:** composición readonly; acciones de edición ocultas/deshabilitadas.

---

## UI / UX requirements

### Layout

- Título de sección: **Composición de la receta**.
- Tabla responsive: scroll horizontal en móvil; columnas fijas para código y acciones en desktop.
- Botón primario **+ Agregar componente** debajo o encima de la tabla.
- Pie de tabla (footer):
  - **Total componentes:** `{count}`
  - **Total cantidad neta:** `{totalNet} {unidadBaseReceta}` (unidad base = unidad de lote del paso 1 o gramos por defecto)
  - Banner advertencia peso lote si aplica.

### Navegación wizard

- Label paso 2 en stepper: **Composición** (reemplazar label "Fases" si este paso sustituye al actual).
- **Siguiente** desde paso 1: validar paso 1 (task 10) antes de entrar.
- **Siguiente** desde paso 2: validar composición (mínimo 1 fila + filas completas).
- **Anterior:** conservar estado de filas en memoria.

### Estados async

- Loading skeleton en autocomplete de insumos.
- Empty state: "Agrega al menos un componente para continuar" con CTA **+ Agregar componente**.
- Error de carga inventario: mensaje + **Reintentar** (patrón `RecipeImagesManager` / `RecetaRecipeWizardGeneralStep`).

### Accesibilidad

- `aria-label` en botones de fila (eliminar, duplicar, mover).
- Errores de celda con `aria-invalid` y `aria-describedby`.

---

## API consumption (contrato esperado — tasks BE 06–08)

### Modelo propuesto (referencia)

```typescript
interface RecipeCompositionLine {
  id?: string; // presente en edición
  supplyItemId: string;
  supplyItemCode: string; // denormalizado para display
  supplyItemName: string;
  componentType: RecipeComponentType;
  usageUnit: RecipeUsageUnit;
  grossQuantity: string; // decimal string, 3 decimales
  netQuantity: string;
  sortOrder: number;
  shrinkagePercent?: number; // calculado BE o FE
}
```

### Sincronización al guardar

**Opción A (preferida):** extender payload de create/update receta:

```http
POST /api/mes/plant/recipes
PATCH /api/mes/plant/recipes/:id
```

```typescript
interface SaveRecipePayload {
  // ...campos paso 1 (task 10)
  composition: RecipeCompositionLine[];
}
```

**Opción B:** endpoint dedicado:

```http
PUT /api/mes/plant/recipes/:id/composition
Body: { lines: RecipeCompositionLine[] }
```

### Autocomplete insumos

Reutilizar catálogo existente:

```http
GET /api/supply-items?isActive=true&search={codigo}
```

o hook FE `useEditorSupplyItems` / GraphQL `supplyItems` con filtro por `codigoInterno`.

### Validación subreceta (BE)

```http
GET /api/mes/plant/recipes/by-supply-item/:supplyItemId
→ 404 si no hay receta activa vinculada
```

> Contrato final lo fija `08-api-composition-dtos.md`.

---

## Files allowed

### `packages/ui`

- `packages/ui/src/components/receta/receta-recipe-wizard/RecetaRecipeWizard.tsx` — label paso 2, wiring props composición
- `packages/ui/src/components/receta/receta-recipe-wizard-phases-step/RecetaRecipeWizardPhasesStep.tsx` — **reemplazar contenido** por tabla composición (o renombrar a `RecetaRecipeWizardCompositionStep` si el equipo prefiere)
- `packages/ui/src/components/receta/receta-recipe-wizard-phases-step/RecetaRecipeWizardPhasesStep.module.scss` — estilos tabla composición
- `packages/ui/src/components/receta/receta-recipe-wizard-review-step/RecetaRecipeWizardReviewStep.tsx` — filas resumen composición (conteo + total neta)
- `packages/ui/src/components/receta/shared/receta-wizard-types.ts` — tipos fila composición / opciones select
- `packages/ui/src/index.tsx` — exports si hay componentes públicos nuevos

### `apps/web-app`

- `apps/web-app/src/screens/RecipesManagementScreen/RecipesManagementScreen.tsx` — estado composición, handlers filas, integración guardado
- `apps/web-app/src/screens/RecipesManagementScreen/RecipesManagementScreen.module.scss` — estilos locales si aplica
- `apps/web-app/src/features/recetas/types.ts` — `RecipeCompositionRow`, enums UI
- `apps/web-app/src/features/recetas/validation/recipeComposition.schema.ts` — create (zod)
- `apps/web-app/src/features/recetas/validation/recipeComposition.schema.test.ts` — create
- `apps/web-app/src/features/recetas/mappers/recipes.mapper.ts` — mapeo API ↔ filas UI, cálculo merma
- `apps/web-app/src/features/recetas/hooks/usePlantRecipeMutations.ts` — payload composición en save
- `apps/web-app/src/features/recetas/hooks/useRecipeComposition.ts` — create (carga/sync composición)
- `apps/web-app/src/components/recetas/RecipeCompositionTable.tsx` — create (tabla + filas)
- `apps/web-app/src/components/recetas/RecipeCompositionTable.module.scss` — create
- `apps/web-app/src/components/recetas/SupplyItemAutocomplete.tsx` — create (autocomplete código insumo)
- `apps/web-app/src/components/recetas/SupplyItemAutocomplete.module.scss` — create
- `apps/web-app/src/features/recetas/hooks/index.ts` — exports
- `apps/web-app/src/api/plant/plant.api.ts` — tipos/métodos composición (si task 08 lo expone)
- `apps/web-app/src/api/plant/types.ts` — tipos composición

---

## Files forbidden

- `apps/api/**` (tasks BE 06–08)
- `apps/api/prisma/schema.prisma` y `migrations/**`
- `package.json`, `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- Módulos no relacionados con recetas / inventario en web-app

---

## Acceptance criteria

### AC 1: Visualización del bloque

- [ ] El formulario de Nueva receta incluye un bloque claramente identificado como **Composición de la receta** (paso 2 del wizard).
- [ ] El bloque muestra una tabla editable con las columnas: Código de insumo, Nombre del insumo, Tipo de componente, Unidad de uso, Cantidad bruta y Cantidad neta.
- [ ] El bloque permite agregar múltiples filas (mínimo 1 componente requerido para guardar la receta completa).
- [ ] Cada fila tiene una acción para eliminarla individualmente.

### AC 2: Código y nombre del insumo

- [ ] El campo **Código de insumo** conecta con el maestro de inventarios mediante autocomplete.
- [ ] Al seleccionar un código, **Nombre del insumo** se completa automáticamente.
- [ ] Si el insumo no existe en el maestro, el sistema muestra advertencia y no permite confirmar la fila.
- [ ] **Código de insumo** es obligatorio por fila.

### AC 3: Tipo de componente

- [ ] **Tipo de componente** es lista desplegable: Ingrediente, Subreceta, Empaque, Salsa, Topping, Decoración.
- [ ] Si el tipo es **Subreceta**, el sistema valida que el insumo vinculado exista como receta activa (error BE/FE al guardar).
- [ ] El campo es obligatorio por fila.

### AC 4: Unidad de uso

- [ ] **Unidad de uso** es lista desplegable: Gramo, Mililitro, Unidad, Kilo, Litro, Onza.
- [ ] Si la unidad no coincide con la unidad base del insumo en inventarios, se muestra advertencia (no bloquea).
- [ ] El campo es obligatorio por fila.

### AC 5: Cantidad bruta y cantidad neta

- [ ] **Cantidad bruta**: numérico positivo, hasta 3 decimales, editable.
- [ ] **Cantidad neta**: numérico positivo, hasta 3 decimales, editable.
- [ ] Cantidad neta no puede ser mayor que cantidad bruta → error en la fila.
- [ ] El sistema calcula y muestra **% merma** por fila: `((bruta - neta) / bruta) * 100`.
- [ ] Ambos campos son obligatorios por fila.

### AC 6: Gestión de filas

- [ ] Botón **+ Agregar componente** agrega una fila nueva.
- [ ] El usuario puede reordenar filas (drag & drop **o** botones subir/bajar).
- [ ] El usuario puede duplicar una fila existente.
- [ ] Al eliminar una fila en receta ya guardada, el sistema solicita confirmación.

### AC 7: Totales y resumen del bloque

- [ ] Al pie de la tabla se muestra el **total de cantidad neta** en la unidad base configurada para la receta (gramos o unidad de lote del paso 1).
- [ ] Se muestra el **número total de componentes**.
- [ ] Si el total neto supera el **Peso aproximado por lote (g)** del paso 1, advertencia visual (no bloquea guardado).

### AC 8: Validaciones y guardado

- [ ] No es posible guardar/avanzar si la composición está vacía (receta completa, no borrador).
- [ ] Filas incompletas: celdas resaltadas + mensaje de error al intentar continuar/guardar.
- [ ] Al guardar exitosamente, la composición queda vinculada a la receta y visible en detalle/edición.

### AC 9: Trazabilidad y permisos

- [ ] Modificaciones en composición (agregar, editar, eliminar) registradas en historial/auditoría de la receta (BE task 07; FE muestra en detalle si API lo expone).
- [ ] Solo roles permitidos (Chef, Producción, Calidad, Supervisor) pueden editar composición en `TRIAL` o `ACTIVE`.
- [ ] Recetas en estado **Inactiva** no permiten editar la composición (UI readonly).

---

## Tests FE

- `recipeComposition.schema.test.ts` — bruta/neta, decimales (3), neta ≤ bruta, mínimo 1 fila, enums obligatorios.
- Tests de mapper: cálculo % merma, total neto, advertencia peso lote.
- Test componente `RecipeCompositionTable`: agregar/eliminar/duplicar fila; autocomplete selecciona nombre.
- Actualizar tests wizard/`RecipesManagementScreen` si existen — mock API composición.

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter web-app typecheck
pnpm --filter web-app test -- recipeComposition
pnpm --filter web-app test -- RecipesManagement
```

> Ejecutar tasks BE `06`–`08` y `pnpm exec prisma generate --schema=./apps/api/prisma/schema.prisma` antes de integrar API real.

---

## Notas de implementación

1. **Relación con `PhaseInput`:** la composición de receta (BOM) es distinta de los insumos por fase de producción. No reutilizar `PhaseInput` directamente; esperar modelo `RecipeCompositionLine` (task 06).
2. **Paso 3 pendiente:** el wizard mantiene 3 pasos; este task cubre solo el paso 2. No rediseñar revisión/fases operativas hasta la task del paso 3.
3. **Borrador:** alinear con BE si el borrador puede omitir composición; el FE debe permitir **Guardar borrador** desde paso 1 sin bloquear por composición vacía.
4. **DnD:** si `@dnd-kit` o similar no está en el proyecto, usar botones subir/bajar en MVP (AC 6 cumple con either/or).
5. **i18n:** labels y errores en español (Colombia).
6. **Onza:** documentar factor de conversión en mapper; validar con producto si onza es US fl oz o troy — MVP asumir onza avoirdupois (28.3495 g).

---

## Known dependencies (BE — crear antes de implementar FE)

| Dependencia                                | Task propuesta                  |
| ------------------------------------------ | ------------------------------- |
| Schema `RecipeCompositionLine` + enums     | `06-schema-composicion.md`      |
| Service: CRUD, validación subreceta, audit | `07-backend-composition.md`     |
| DTOs REST + sync en create/update          | `08-api-composition-dtos.md`    |
| Datos generales + código receta            | `10-nueva-receta-formulario.md` |

Implementar mocks en FE hasta que BE esté en staging; no mergear sin contrato API verificado.
