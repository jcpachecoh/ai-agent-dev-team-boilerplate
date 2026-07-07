# REC-IMG-01 Task 08 — Frontend: gestión de imágenes en recetas

**Domain:** `[FRONTEND]` `[WEB-APP]` `[RECETAS]` `[GRAPHQL]` `[STORAGE]`  
**Status:** `pending`  
**Depends on:** Tasks 04–07 (API GraphQL + REST storage disponibles)

---

## Goal

Agregar un componente de gestión de imágenes en el **formulario y detalle de receta** en `web-app`, permitiendo subir, previsualizar, editar `alt` y desactivar imágenes.

---

## Scope

- Queries/mutations GraphQL en `apps/web-app/src/features/recetas/api/`.
- Hook React Query para listar y mutar imágenes.
- Componente `RecipeImagesManager` integrado en la vista de detalle/edición de receta.
- Flujo upload en 2 pasos: REST storage → GraphQL associate.

---

## Out of scope

- Drag-and-drop reorder visual (solo `sortOrder` numérico si se expone).
- Imagen principal / `isMain`.
- Cambios al módulo plant iPad (`apps/plant`).
- Edición de receta en backend plant REST (solo consumir nuevas operaciones GraphQL).

---

## Files allowed

- `apps/web-app/src/features/recetas/api/recipe-images.graphql.ts` — create
- `apps/web-app/src/features/recetas/api/recipe-images.api.ts` — create
- `apps/web-app/src/features/recetas/hooks/useRecipeImages.ts` — create
- `apps/web-app/src/features/recetas/hooks/useRecipeImageMutations.ts` — create
- `apps/web-app/src/components/recetas/RecipeImagesManager.tsx` — create
- `apps/web-app/src/components/recetas/RecipeImagesManager.module.scss` — create
- Vista de detalle/edición de receta existente — integrar componente only

---

## Files forbidden

- `apps/api/**`
- `package.json` / `pnpm-lock.yaml`
- `packages/**`

---

## Flujo de upload (2 pasos)

```
┌─────────────┐    POST /api/storage/upload     ┌──────────────┐
│  Usuario    │ ─────────────────────────────►│ StorageModule│
│  selecciona │    domain=RECIPES               │  (R2)        │
│  archivo    │    imageProfile=RECIPE        └──────┬───────┘
└─────────────┘    entityType=ProductionRecipe         │
                   entityId=recipeId                   │ { publicUrl, id }
                                                       ▼
              mutation addRecipeImage          ┌──────────────┐
              { recipeId, url, nameImage, alt }│ RecipeImages │
                                               │   GraphQL    │
                                               └──────────────┘
```

### REST upload (reutilizar cliente existente o `fetch` con auth)

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('domain', 'RECIPES');
formData.append('imageProfile', 'RECIPE');
formData.append('entityType', 'ProductionRecipe');
formData.append('entityId', recipeId);

const upload = await fetch('/api/storage/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: formData,
});
```

### GraphQL

```graphql
query RecipeImages($recipeId: ID!) {
  recipeImages(recipeId: $recipeId) {
    id
    url
    alt
    nameImage
    isActive
    sortOrder
  }
}

mutation AddRecipeImage($input: AddRecipeImageInput!) {
  addRecipeImage(input: $input) {
    id
    url
    alt
    nameImage
  }
}

mutation UpdateRecipeImage($input: UpdateRecipeImageInput!) {
  updateRecipeImage(input: $input) {
    id
    alt
    nameImage
  }
}

mutation DeactivateRecipeImage($id: ID!) {
  deactivateRecipeImage(id: $id) {
    id
    isActive
  }
}
```

---

## UI requirements

### `RecipeImagesManager`

| Estado    | Comportamiento                                        |
| --------- | ----------------------------------------------------- |
| Loading   | Skeleton grid de thumbnails                           |
| Error     | `ErrorState` con retry                                |
| Empty     | Mensaje + botón "Agregar imagen"                      |
| Con datos | Grid de thumbnails + acciones editar alt / desactivar |

### Controles

- Input file: aceptar `image/jpeg`, `image/png`, `image/webp`; máx 5 MB (alineado a `FileValidationPipe`).
- Preview inmediato antes de confirmar upload.
- Campo `alt` editable inline o en mini-modal.
- Botón eliminar → llama `deactivateRecipeImage` (confirmación).
- Mostrar contador: `N / 10 imágenes`.

### Estilos

- CSS Modules + tokens SCSS del proyecto.
- Sin inline styles.

---

## Integración en vista de receta

Ubicación sugerida: panel lateral o sección "Imágenes" en la pantalla que usa `usePlantRecipeDetail`.

```tsx
{
  recipeId && <RecipeImagesManager recipeId={recipeId} />;
}
```

Invalidar query `recipeImages` tras add/update/deactivate.

---

## Tests (FE)

- Unit test del mapper/API client (mock fetch + GraphQL).
- Test del hook con React Query test utils (opcional si el proyecto ya lo hace en recetas).

---

## Acceptance criteria

- [ ] Usuario puede subir imagen desde el detalle de receta.
- [ ] Thumbnails se muestran con la `url` del storage.
- [ ] Usuario puede editar `alt` de una imagen existente.
- [ ] Usuario puede desactivar imagen (desaparece del listado activo).
- [ ] Error claro cuando se alcanza el límite de 10 imágenes.
- [ ] Estados loading / error / empty implementados.
- [ ] CSS Modules, sin inline styles.
- [ ] `pnpm --filter=@restopsiq/web-app typecheck` pasa.
- [ ] Tests FE del API client pasan.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/web-app typecheck
pnpm --filter=@restopsiq/web-app test -- recipe-images
```
