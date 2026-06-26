# Epic: Formulario Nueva Receta — Datos generales y flujo de aprobación

**Domain:** `[BE]` `[REST]` `[GRAPHQL]` `[RECETAS]` `[WEB-APP]` `[UI]`  
**Branch sugerida:** `feat/recipe-form-nueva-receta`  
**Status:** `pending`  
**Priority:** High

---

## Goal

Rediseñar el bloque **Datos de la receta** del flujo **Nueva receta** (`RecetaRecipeWizard` paso `general`) para alinearlo con el modelo operativo de Palos de Leña: código autogenerado por categoría, tipo de receta, rendimiento, centro de operación, responsable técnico, alérgenos, foto de referencia y **flujo de aprobación** (estado `Prueba` → `Activa` / `Inactiva` por supervisor).

---

## Contexto actual vs. objetivo

| Campo / regla producto  | Estado hoy                                              | Gap                                                                                        |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Categoría               | Select opcional desde `RecipeCategory`                  | Debe ser **obligatoria**; opciones seed + configurables                                    |
| Código de receta        | `RC-{version}` en FE (`formatRecipeCode`)               | Debe ser **prefijo categoría + consecutivo** (ej. `COC-0001`), generado en BE, no editable |
| Tipo de receta          | No existe                                               | Nuevo enum + campo obligatorio                                                             |
| Nombre                  | Existe (`name`, max sin validar 150)                    | Validar longitud y unicidad por categoría                                                  |
| Tamaño / unidad de lote | Existe (`batchSize`, `batchUnit` / `StockUnit`)         | Ajustar opciones de unidad (porción, bandeja, lote) y validación 2 decimales               |
| Peso por lote           | `packageWeight` en **kg**                               | Cambiar a **gramos** enteros positivos                                                     |
| Rendimiento esperado    | No existe                                               | Nuevo campo valor + unidad                                                                 |
| Tiempo estimado         | `estimatedMinutes` entero                               | Mantener; permitir UI horas+minutos opcional                                               |
| Estado                  | `isActive` boolean editable                             | Reemplazar por workflow **Prueba / Activa / Inactiva**; creador no edita                   |
| Centro de operación     | No existe                                               | Enum Planta / Sede / Todas + multi-select sedes                                            |
| Responsable técnico     | No existe                                               | Enum Chef / Producción / Calidad                                                           |
| Fecha de creación       | `createdAt` en DB                                       | Mostrar readonly en formulario                                                             |
| Alérgenos               | No existe                                               | Multi-select opcional                                                                      |
| Notas                   | Existe (`notes`)                                        | Limitar 500 caracteres                                                                     |
| Foto de referencia      | `RecipeImagesManager` en detalle (epic `recipe-images`) | Integrar upload JPG/PNG en paso general (1 imagen, preview)                                |
| Guardar borrador        | No existe                                               | Permitir guardado parcial sin campos opcionales                                            |
| Auditoría               | `AuditLog` global                                       | Registrar creación/edición y cambios de estado                                             |
| RBAC                    | Parcial en plant MES                                    | Solo Chef, Producción, Calidad, Supervisor crean/editan                                    |

**Pantalla actual:** `apps/web-app/src/screens/RecipesManagementScreen/RecipesManagementScreen.tsx` + `RecetaRecipeWizard` (`packages/ui`).

**API actual:** `POST /api/mes/plant/recipes` (`CreateRecipeDto`) sobre `ProductionRecipe`.

---

## Design principles

### 1. Multi-tenancy

Todo filtro y mutación usa `tenantId` del JWT. Códigos de receta son únicos por tenant.

### 2. Código autogenerado

- Prefijo definido en `RecipeCategory` (nuevo campo `codePrefix`, ej. `COC`, `PAN`).
- Consecutivo atómico por `(tenantId, categoryId)` en transacción de creación.
- Campo `code` en `ProductionRecipe` — **no editable** por el usuario.

### 3. Flujo de estado

```
Crear receta → PRUEBA (automático)
Supervisor aprueba → ACTIVA
Supervisor rechaza → INACTIVA (+ rejectionReason)
```

Historial en tabla `recipe_status_history` (usuario, estado anterior, nuevo, motivo, timestamp).

### 4. Centro de operación

| Valor    | Comportamiento                                            |
| -------- | --------------------------------------------------------- |
| `PLANTA` | Sin selector de sedes                                     |
| `TODAS`  | Sin selector de sedes                                     |
| `SEDE`   | Multi-select obligatorio con al menos 1 sede (`Location`) |

Persistir en tabla join `production_recipe_locations` o JSON validado — preferir join para queries.

### 5. Foto de referencia

Reutilizar epic **recipe-images** + `StorageModule`:

1. Crear receta (o borrador) → obtener `recipeId`
2. `POST /api/storage/upload` → `addRecipeImage` (máx. 1 activa en paso general; nueva reemplaza anterior)

### 6. Validación nombre único

`@@unique([tenantId, categoryId, name])` o validación en service con `ConflictException`.

---

## Subtask breakdown

| File                              | Title                                                             | Layer | Depends on             |
| --------------------------------- | ----------------------------------------------------------------- | ----- | ---------------------- |
| `01-schema.md`                    | Prisma — campos receta, categoría, historial estado, sedes, enums | BE    | —                      |
| `01b-migration.md`                | Migración SQL + backfill código/estado                            | BE    | 01                     |
| `02-backend-recipe-metadata.md`   | Service: código, validaciones, borrador, unicidad nombre          | BE    | 01b                    |
| `03-backend-approval-workflow.md` | Aprobar/rechazar receta + historial estado                        | BE    | 02                     |
| `04-backend-audit-rbac.md`        | AuditLog + guards roles recetas                                   | BE    | 02                     |
| `05-api-dtos.md`                  | Extender `CreateRecipeDto` / responses plant REST                 | BE    | 02–04                  |
| `10-nueva-receta-formulario.md`   | **Frontend: formulario Nueva receta + AC 1–10**                   | FE    | 05, `recipe-images/07` |
| `11-tests-rollout.md`             | Tests BE/FE + checklist QA                                        | BE/FE | 10                     |

> Implementar **una task a la vez** siguiendo SDD. La task `10-nueva-receta-formulario.md` contiene el detalle funcional completo y los criterios de aceptación del producto.

---

## Validation commands (epic completo)

```bash
pnpm exec prisma validate --schema=./apps/api/prisma/schema.prisma
pnpm exec prisma generate --schema=./apps/api/prisma/schema.prisma
pnpm --filter @restopsiq/api typecheck
pnpm --filter @restopsiq/api test -- plant.service
pnpm --filter @restopsiq/ui build
pnpm --filter web-app typecheck
pnpm --filter web-app test -- RecipesManagement
node scripts/validate-structure.js
```
