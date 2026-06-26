# REC-FORM-10 — Formulario Nueva Receta: bloque Datos de la receta

**Domain:** `[FRONTEND]` `[WEB-APP]` `[UI]` `[RECETAS]` `[REST]`  
**Assigned Agent:** frontend-developer (con dependencias BE en tasks 01–05)  
**Status:** `pending`  
**Depends on:** `01-schema.md` … `05-api-dtos.md`, `recipe-images/07-module-wiring.md`  
**Epic:** `00-epic.md`

---

## Goal

Modificar el formulario de **Nueva receta** (paso `general` del wizard y flujo de creación en `RecipesManagementScreen`) para capturar el bloque **Datos de la receta** según la especificación de producto, con validaciones, código autogenerado, estado inicial `Prueba` y experiencia alineada a `@restopsiq/ui` (`RecetaRecipeWizard`).

---

## Scope

- Rediseñar campos del paso **Datos generales** / **Nueva receta**.
- Integrar catálogos dinámicos (categorías, sedes) y enums de negocio.
- Consumir API extendida de creación/actualización de receta (incl. borrador).
- Vista previa y carga de **foto de referencia** (1 imagen, JPG/PNG).
- Mensajes de validación y confirmación post-guardado con código generado.
- Listado: receta nueva visible con estado **Prueba**.

---

## Out of scope

- Rediseño de pasos **Fases** y **Revisión** del wizard (solo ajustar review si muestra nuevos campos).
- Motor de aprobación supervisor en app plant/iPad (`apps/plant`) — solo web-app en esta task; workflow BE en task 03.
- Reorden drag-and-drop de fases.
- Múltiples imágenes en el alta (solo 1 foto de referencia; galería completa queda en detalle).
- Cambios a `package.json`, `pnpm-lock.yaml`, `schema.prisma` o migraciones (tasks BE separadas).

---

## Bloque: Datos de la receta

| Campo                            | Tipo UI                | Detalle                                                                                                                          | Obligatorio                   |
| -------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Categoría**                    | Lista desplegable      | Cocina, Panadería, Bebidas, Postres, Combos + categorías configuradas en `RecipeCategory`                                        | Sí                            |
| **Código de receta**             | Texto readonly         | Generado al seleccionar categoría. Patrón: `{prefijo}-{consecutivo}` (ej. `COC-0001`, `PAN-0001`). Único por tenant. No editable | Auto (visible tras categoría) |
| **Tipo de receta**               | Lista desplegable      | Producto final, Subreceta, Producción base, Combo, Acompañamiento                                                                | Sí                            |
| **Nombre de receta**             | Texto                  | Nombre técnico o comercial. Máx. 150 caracteres                                                                                  | Sí                            |
| **Tamaño de lote**               | Número                 | Positivo, hasta 2 decimales                                                                                                      | Sí                            |
| **Unidad de lote**               | Lista desplegable      | Unidad, Porción, Kilo, Litro, Bandeja, Lote                                                                                      | Sí                            |
| **Peso aproximado por lote (g)** | Número entero          | Gramos, entero positivo                                                                                                          | Sí                            |
| **Rendimiento esperado**         | Número + unidad        | Cantidad final que entrega la receta (ej. 10 porciones, 5 kg)                                                                    | Sí                            |
| **Tiempo estimado**              | Número o h/min         | Minutos totales; UI puede separar horas y minutos                                                                                | Sí                            |
| **Estado**                       | Badge / texto readonly | Al crear: **Prueba** (no editable por creador)                                                                                   | Auto                          |
| **Centro de operación**          | Lista desplegable      | Planta, Sede, Todas. Si `Sede` → multi-select de sedes                                                                           | Sí                            |
| **Sedes**                        | Multi-select           | Visible solo si centro = `Sede`. Una o más sedes                                                                                 | Condicional                   |
| **Responsable técnico**          | Lista desplegable      | Chef, Producción, Calidad                                                                                                        | Sí                            |
| **Fecha de creación**            | Texto readonly         | Fecha/hora sistema al crear. No editable                                                                                         | Auto                          |
| **Alérgenos**                    | Multi-select           | Gluten, Lácteos, Huevo, Frutos secos                                                                                             | No                            |
| **Notas**                        | Textarea               | Hasta 500 caracteres                                                                                                             | No                            |
| **Foto de referencia**           | File input             | JPG o PNG, 1 imagen, preview en formulario                                                                                       | No                            |

### Valores de catálogo (MVP)

**Categorías seed sugeridas**

| Nombre    | Prefijo código |
| --------- | -------------- |
| Cocina    | `COC`          |
| Panadería | `PAN`          |
| Bebidas   | `BEB`          |
| Postres   | `POS`          |
| Combos    | `COM`          |

**Tipo de receta (`RecipeType`)**

- `FINAL_PRODUCT` → Producto final
- `SUB_RECIPE` → Subreceta
- `BASE_PRODUCTION` → Producción base
- `COMBO` → Combo
- `SIDE` → Acompañamiento

**Unidad de lote (`BatchDisplayUnit`)**

- `UNIT`, `PORTION`, `KILOGRAM`, `LITER`, `TRAY`, `BATCH`

> Mapear a `StockUnit` existente en persistencia donde aplique; exponer labels en español en UI.

**Estado (`RecipeLifecycleStatus`)**

- `TRIAL` → Prueba
- `ACTIVE` → Activa
- `INACTIVE` → Inactiva

**Centro de operación (`OperationCenter`)**

- `PLANT`, `LOCATION`, `ALL`

**Responsable técnico (`TechnicalResponsible`)**

- `CHEF`, `PRODUCTION`, `QUALITY`

**Alérgenos (`RecipeAllergen`)**

- `GLUTEN`, `DAIRY`, `EGG`, `NUTS`

---

## UI / UX requirements

### Layout

- Mantener wizard de 3 pasos; rediseñar solo el panel **Datos de la receta** en `RecetaRecipeWizardGeneralStep`.
- Grid responsive 2 columnas en desktop; 1 columna en móvil (patrón actual `RecetaWizardField`).
- Campo **Código** y **Fecha de creación** con estilo readonly/disabled consistente con tokens receta.
- **Estado** como badge (`RecetaStatusBadge` o equivalente) — nunca select editable en creación.

### Comportamiento dinámico

1. **Categoría → Código:** al seleccionar categoría, llamar endpoint de preview de código (`GET .../next-code?categoryId=`) o recibir código en response de borrador; mostrar placeholder "Se generará al guardar" si preview no disponible en MVP.
2. **Centro de operación → Sedes:** mostrar `RecetaFilterSelect` multi o checkbox list solo cuando valor = `Sede`; ocultar y limpiar selección si `Planta` o `Todas`.
3. **Foto:** al seleccionar archivo, validar MIME `image/jpeg` / `image/png`; mostrar thumbnail; al subir nueva, reemplazar preview y desactivar imagen anterior vía API.

### Estados async

- Loading skeleton en selects de categoría y sedes.
- Error + reintentar si fallan catálogos.
- Empty state si no hay categorías configuradas (link a `/recetas/categorias`).

### Acciones del formulario

| Acción                  | Comportamiento                                                                                                                |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Guardar borrador**    | Persiste con campos obligatorios mínimos según BE (`name` + `categoryId` o reglas task 02); opcionales incompletos permitidos |
| **Continuar / Guardar** | Valida todos los obligatorios del paso antes de avanzar o crear                                                               |
| **Cancelar**            | Cierra wizard sin persistir (confirmar si hay cambios)                                                                        |

### Mensaje post-guardado

Toast o banner: _"Receta creada correctamente. Código: **COC-0001**"_.

---

## API consumption (contrato esperado — task 05)

### Crear receta

```http
POST /api/mes/plant/recipes
```

```typescript
interface CreateRecipeFormPayload {
  categoryId: string;
  recipeType: RecipeType;
  name: string;
  batchSize: number;
  batchUnit: BatchDisplayUnit;
  packageWeightGrams: number;
  expectedYield: number;
  expectedYieldUnit: string;
  estimatedMinutes: number;
  operationCenter: OperationCenter;
  locationIds?: string[]; // requerido si operationCenter === 'LOCATION'
  technicalResponsible: TechnicalResponsible;
  allergens?: RecipeAllergen[];
  notes?: string;
  isDraft?: boolean;
  // finishedProductId y phases: paso posterior del wizard (sin cambio de contrato base)
}
```

### Response

```typescript
interface CreateRecipeResponse {
  id: string;
  code: string; // ej. COC-0001
  lifecycleStatus: 'TRIAL';
  createdAt: string;
  // ...demás campos
}
```

### Preview código (opcional MVP+)

```http
GET /api/mes/plant/recipes/next-code?categoryId={id}
```

### Sedes

Reutilizar hook existente `useLocations` o equivalente en web-app (`GET /api/locations`).

### Foto

Flujo 2 pasos (epic recipe-images):

1. `POST /api/storage/upload` (`domain=RECIPES`, `entityType=ProductionRecipe`, `entityId`)
2. GraphQL `addRecipeImage` o REST asociado

---

## Files allowed

### `packages/ui` (extender wizard general)

- `packages/ui/src/components/receta/receta-recipe-wizard-general-step/RecetaRecipeWizardGeneralStep.tsx`
- `packages/ui/src/components/receta/receta-recipe-wizard-general-step/RecetaRecipeWizardGeneralStep.module.scss`
- `packages/ui/src/components/receta/receta-recipe-wizard-review-step/RecetaRecipeWizardReviewStep.tsx` — mostrar nuevos campos en resumen
- `packages/ui/src/components/receta/shared/receta-wizard-types.ts` — tipos de opciones si aplica
- `packages/ui/src/index.tsx` — exports si hay props nuevas públicas

### `apps/web-app`

- `apps/web-app/src/screens/RecipesManagementScreen/RecipesManagementScreen.tsx`
- `apps/web-app/src/screens/RecipesManagementScreen/RecipesManagementScreen.module.scss`
- `apps/web-app/src/features/recetas/types.ts` — tipos formulario
- `apps/web-app/src/features/recetas/validation/recipeForm.schema.ts` — create (zod)
- `apps/web-app/src/features/recetas/mappers/recipes.mapper.ts` — código y labels
- `apps/web-app/src/features/recetas/hooks/useSavePlantRecipe.ts` — payload extendido
- `apps/web-app/src/components/recetas/RecipeReferencePhotoField.tsx` — create (upload + preview)
- `apps/web-app/src/components/recetas/RecipeReferencePhotoField.module.scss` — create
- `apps/web-app/src/features/recetas/hooks/index.ts` — exports
- Tests: `apps/web-app/src/features/recetas/validation/recipeForm.schema.test.ts`

---

## Files forbidden

- `apps/api/**` (tasks BE 01–05)
- `apps/api/prisma/schema.prisma` y `migrations/**`
- `package.json`, `pnpm-lock.yaml`
- `scripts/validate-structure.js`
- Rutas o módulos no relacionados con recetas

---

## Acceptance criteria

### AC 1: Categoría y código de receta

- [ ] El campo **Categoría** es lista desplegable con Cocina, Panadería, Bebidas, Postres, Combos y categorías configuradas en el sistema.
- [ ] El **Código de receta** se genera automáticamente al seleccionar categoría (`{prefijo}-{consecutivo}`, ej. `COC-0001`).
- [ ] El código es único, no editable y visible tras seleccionar categoría.
- [ ] **Categoría** es obligatoria; sin ella no se genera código ni se puede guardar.

### AC 2: Tipo y nombre de receta

- [ ] **Tipo de receta**: Producto final, Subreceta, Producción base, Combo, Acompañamiento.
- [ ] **Nombre de receta**: texto libre hasta 150 caracteres.
- [ ] Ambos obligatorios; bloquean guardado si están vacíos.
- [ ] El sistema valida que no existan dos recetas con el mismo nombre en la misma categoría (error 409 con mensaje en español).

### AC 3: Tamaño de lote, unidad y peso

- [ ] **Tamaño de lote**: numérico positivo, hasta 2 decimales.
- [ ] **Unidad de lote**: Unidad, Porción, Kilo, Litro, Bandeja, Lote.
- [ ] **Peso aproximado por lote (g)**: entero positivo.
- [ ] Los tres campos son obligatorios.

### AC 4: Rendimiento esperado y tiempo estimado

- [ ] **Rendimiento esperado**: valor numérico positivo con unidad (ej. 10 porciones, 5 kg).
- [ ] **Tiempo estimado**: minutos totales o entrada horas + minutos.
- [ ] Ambos obligatorios.

### AC 5: Estado y flujo de aprobación

- [ ] Al crear, **Estado** = `Prueba`, no editable por el creador.
- [ ] Supervisor puede aprobar/rechazar desde detalle (task 03 BE + UI mínima en detalle).
- [ ] Aprobación → `Activa`; rechazo → `Inactiva` + motivo visible.
- [ ] Historial de cambios de estado con usuario, fecha y hora (visible en detalle para Supervisor/Admin).

### AC 6: Centro de operación

- [ ] Lista: Planta, Sede, Todas.
- [ ] Si `Sede`: selector múltiple con todas las sedes del tenant.
- [ ] Selección de una o varias sedes permitida.
- [ ] Si `Planta` o `Todas`: selector de sedes oculto.
- [ ] Campo obligatorio.

### AC 7: Responsable técnico, alérgenos y fecha de creación

- [ ] **Responsable técnico**: Chef, Producción, Calidad — obligatorio.
- [ ] **Alérgenos**: multi-select Gluten, Lácteos, Huevo, Frutos secos — opcional, siempre visible.
- [ ] **Fecha de creación**: auto, readonly.
- [ ] Responsable técnico obligatorio.

### AC 8: Notas y foto de referencia

- [ ] **Notas**: textarea hasta 500 caracteres — opcional.
- [ ] **Foto de referencia**: JPG/PNG, preview en formulario — opcional.
- [ ] Solo 1 imagen; nueva reemplaza la anterior.

### AC 9: Validaciones generales y guardado

- [ ] Campos obligatorios vacíos: resaltado por campo + resumen de errores.
- [ ] Guardar borrador permitido con opcionales incompletos (según reglas BE).
- [ ] Guardado exitoso: mensaje con código generado.
- [ ] Receta nueva en listado con estado **Prueba**, disponible para supervisor.

### AC 10: Trazabilidad y auditoría

- [ ] Creación/edición registrada en `AuditLog` (usuario, fecha, hora) — validar vía BE task 04.
- [ ] Solo roles Chef, Producción, Calidad, Supervisor pueden crear/editar (guard en BE; FE oculta acciones si no autorizado).
- [ ] Historial de cambios visible en detalle para Supervisor y Administrador.

---

## Tests FE

- `recipeForm.schema.test.ts` — validaciones zod (decimales, gramos enteros, sedes condicionales, nombre 150 chars).
- Actualizar tests de `RecipesManagementScreen` o wizard si existen — mock API extendida.
- Test: seleccionar categoría muestra código; centro `Sede` muestra sedes; centro `Planta` oculta sedes.

---

## Validation commands

```bash
pnpm --filter @restopsiq/ui build
pnpm --filter web-app typecheck
pnpm --filter web-app test -- recipeForm
pnpm --filter web-app test -- RecipesManagement
```

> Si falla typecheck en API por modelos nuevos, ejecutar primero tasks BE `01`–`05` y `pnpm exec prisma generate --schema=./apps/api/prisma/schema.prisma`.

---

## Notas de implementación

1. **Producto terminado (`finishedProductId`)**: mantener en wizard si el flujo operativo lo requiere; no eliminar sin confirmación de producto. Ubicar después de nombre/tipo o en subsección "Salida de producción".
2. **Migración desde `isActive`**: recetas existentes `isActive=true` → `ACTIVE`; `false` → `INACTIVE`; nuevas solo `TRIAL`.
3. **Código legacy `RC-{version}`**: dejar de usar en listado una vez exista `code`; mostrar `code` como identificador principal.
4. **i18n**: labels y mensajes de error en español (Colombia).
5. **Accesibilidad**: `aria-label` en selects, errores asociados con `aria-describedby`.

---

## Known dependencies (no bloquear redacción de FE)

| Dependencia                         | Task                                         |
| ----------------------------------- | -------------------------------------------- |
| Campos Prisma + enums               | `01-schema.md`                               |
| Generación código + unicidad nombre | `02-backend-recipe-metadata.md`              |
| Aprobar/rechazar + historial        | `03-backend-approval-workflow.md`            |
| AuditLog + RBAC                     | `04-backend-audit-rbac.md`                   |
| DTOs REST                           | `05-api-dtos.md`                             |
| Upload imagen                       | `recipe-images/08-frontend-recipe-images.md` |

Implementar mocks en FE hasta que BE esté disponible; no mergear sin API real en staging.
