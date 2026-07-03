# Epic: Recipe Images — Imágenes en recetas de producción

**Domain:** `[BE]` `[GRAPHQL]` `[STORAGE]` `[RECETAS]` `[WEB-APP]`  
**Branch sugerida:** `feat/recipe-images`  
**Status:** `pending`  
**Priority:** High

---

## Goal

Agregar soporte de imágenes a las **recetas de producción** (`ProductionRecipe`), permitiendo asociar una o varias imágenes a cada receta mediante la tabla `recipes_images`.

El flujo de subida de archivos reutiliza el **módulo Storage centralizado** (Cloudflare R2). El CRUD de metadatos de imagen por receta se expone vía **GraphQL** con autenticación JWT y filtro multi-tenant.

---

## Contexto del dominio

| Concepto producto | Modelo Prisma actual  | Tabla DB             |
| ----------------- | --------------------- | -------------------- |
| Receta            | `ProductionRecipe`    | `production_recipes` |
| Imagen de receta  | `RecipeImage` (nuevo) | `recipes_images`     |

> **Nota:** El módulo legacy `apps/api/src/recipe/` (in-memory) **no** es el target de este epic. Todas las FKs y validaciones apuntan a `ProductionRecipe` del dominio MES/planta.

---

## Design principles

### 1. Multi-tenancy obligatorio

Toda query/mutation filtra por `tenantId` extraído del JWT (`@CurrentUser()`).  
`RecipeImage.tenantId` se persiste y se valida contra `ProductionRecipe.tenantId` al crear/actualizar.

### 2. Soft delete vía estado

No hard delete. Desactivar imagen con `isActive: false` (equivalente al campo `state` del requerimiento).  
Las queries de listado devuelven solo imágenes activas por defecto; incluir inactivas solo si el input lo permite explícitamente.

### 3. Storage desacoplado

- **Paso 1 (REST):** `POST /api/storage/upload` con `domain=RECIPES`, `imageProfile=RECIPE`, `entityType=ProductionRecipe`, `entityId=<recipeId>`.
- **Paso 2 (GraphQL):** mutation `addRecipeImage` persiste el registro en `recipes_images` con `url`, `nameImage`, `alt`, y opcionalmente `storageObjectId`.

La `url` pública se obtiene de `StorageService.buildPublicUrl(key)` o del campo `publicUrl` del resultado de upload.

### 4. Proveedor de almacenamiento

Usar el proveedor ya configurado en el proyecto:

- **Prod/staging:** Cloudflare R2 (`CloudflareR2StorageProvider`)
- **Dev/local:** `MockStorageProvider` si `STORAGE_PROVIDER=LOCAL`

No introducir Cloudinary ni S3 directo — el módulo `StorageModule` es la única vía de upload.

### 5. Límite de imágenes e imagen principal

| Decisión               | Valor MVP                                                                   |
| ---------------------- | --------------------------------------------------------------------------- |
| Máximo por receta      | **10 imágenes activas** (configurable vía constante en service)             |
| Imagen principal       | **Fuera de scope** — reservar campo `isMain` para task futura               |
| Orden de visualización | Campo `sortOrder Int @default(0)` en schema para ordenar en FE sin `isMain` |

---

## Module structure (backend)

```
apps/api/src/recipe-images/
├── interfaces/
│   └── recipe-images.interfaces.ts
├── repository/
│   └── recipe-images.repository.ts
├── service/
│   └── recipe-images.service.ts
├── resolver/
│   ├── recipe-images.resolver.ts
│   └── dto/
│       ├── recipe-image.type.ts
│       ├── add-recipe-image.input.ts
│       └── update-recipe-image.input.ts
├── test/
│   ├── recipe-images.repository.spec.ts
│   ├── recipe-images.service.spec.ts
│   └── recipe-images.resolver.spec.ts
└── recipe-images.module.ts
```

---

## GraphQL operations

| Tipo     | Operación               | Auth           | Descripción                               |
| -------- | ----------------------- | -------------- | ----------------------------------------- |
| Query    | `recipeImages`          | `JwtAuthGuard` | Lista imágenes de una receta (`recipeId`) |
| Mutation | `addRecipeImage`        | `JwtAuthGuard` | Asocia imagen ya subida a una receta      |
| Mutation | `updateRecipeImage`     | `JwtAuthGuard` | Actualiza `alt`, `nameImage`, `sortOrder` |
| Mutation | `deactivateRecipeImage` | `JwtAuthGuard` | Soft delete (`isActive: false`)           |

### REST (existente — reutilizar, no reimplementar)

| Método | Path                  | Descripción                        |
| ------ | --------------------- | ---------------------------------- |
| POST   | `/api/storage/upload` | Sube archivo binario al storage R2 |

---

## Subtask breakdown

| File                           | Title                                                | Status  |
| ------------------------------ | ---------------------------------------------------- | ------- |
| `01-schema.md`                 | Prisma — `RecipeImage` + relación `ProductionRecipe` | Pending |
| `01b-migration.md`             | Migración SQL `recipes_images`                       | Pending |
| `02-interfaces.md`             | Contratos repository + service                       | Pending |
| `03-repository.md`             | `RecipeImagesRepository` + unit tests                | Pending |
| `04-service.md`                | `RecipeImagesService` + unit tests                   | Pending |
| `05-graphql-types.md`          | ObjectType / InputType GraphQL                       | Pending |
| `06-resolver.md`               | `RecipeImagesResolver` + unit tests                  | Pending |
| `07-module-wiring.md`          | `RecipeImagesModule` + `app.module.ts`               | Pending |
| `08-frontend-recipe-images.md` | UI upload/preview en formulario receta               | Pending |

---

## Acceptance criteria (epic-level)

- [ ] Existe la tabla `recipes_images` con campos `alt`, `nameImage`, `url`, `isActive` (state), `tenantId`, `recipeId`, `createdAt`, `updatedAt`.
- [ ] Se puede subir un archivo vía `POST /api/storage/upload` con dominio `RECIPES`.
- [ ] Se puede asociar una o más imágenes a una receta vía `addRecipeImage`.
- [ ] `recipeImages(recipeId)` lista las imágenes activas de la receta en el detalle.
- [ ] `deactivateRecipeImage` desactiva la imagen sin borrar el registro.
- [ ] `updateRecipeImage` permite editar `alt` y `nameImage`.
- [ ] Todas las operaciones respetan `tenantId` del JWT.
- [ ] El componente FE permite subir, previsualizar y desactivar imágenes en el formulario/detalle de receta.
- [ ] `node scripts/validate-structure.js` pasa.
- [ ] `pnpm --filter=@restopsiq/api test` pasa con cobertura ≥ 80% en services.
- [ ] `pnpm run typecheck` pasa en monorepo.

---

## Out of scope (MVP)

- Campo `isMain` / imagen destacada.
- Reordenamiento drag-and-drop en BE (solo `sortOrder` numérico).
- GraphQL upload multipart (se usa REST storage existente).
- Cambios al módulo in-memory `apps/api/src/recipe/`.
- Borrado físico del archivo en R2 al desactivar (opcional cleanup job futuro).
