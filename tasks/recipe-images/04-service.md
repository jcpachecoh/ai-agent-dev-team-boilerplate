# REC-IMG-01 Task 04 — `RecipeImagesService` + Unit Tests

## Goal

Implementar reglas de negocio: validación de receta, límite de imágenes, tenant safety y soft delete.

**Depends on:** Task 02 (interfaces), Task 03 (repository).

---

## Scope

- Crear `apps/api/src/recipe-images/service/recipe-images.service.ts`.
- Crear `apps/api/src/recipe-images/test/recipe-images.service.spec.ts`.

---

## Out of scope

- No upload de archivos (eso es `StorageService` + REST).
- No resolver GraphQL.
- No module wiring.

---

## Files allowed

- `apps/api/src/recipe-images/service/recipe-images.service.ts` — create
- `apps/api/src/recipe-images/test/recipe-images.service.spec.ts` — create

---

## Files forbidden

- `recipe-images.module.ts`
- `schema.prisma`

---

## Implementation notes

### Constants

```typescript
const MAX_ACTIVE_IMAGES_PER_RECIPE = 10;
```

### Business rules

| Operación      | Regla                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| `listByRecipe` | `NotFoundException` si receta no existe en tenant                        |
| `add`          | Receta debe existir; `countActive < MAX`; `url` y `nameImage` requeridos |
| `update`       | Imagen debe existir en tenant; no permitir reactivar vía update MVP      |
| `deactivate`   | Imagen debe existir; idempotente si ya inactiva                          |

### Excepciones

```typescript
throw new NotFoundException(`Recipe "${recipeId}" not found`);
throw new NotFoundException(`Recipe image "${id}" not found`);
throw new ConflictException(
  `Recipe already has the maximum of ${MAX_ACTIVE_IMAGES_PER_RECIPE} active images`,
);
throw new BadRequestException('url is required');
```

### Validación de URL

Aceptar URLs `https://` generadas por storage. Rechazar strings vacíos. No validar reachability HTTP en MVP.

### Test strategy

Mock `RecipeImagesRepository`. Mínimo 12 tests:

- `listByRecipe` — happy path.
- `listByRecipe` — receta no encontrada → `NotFoundException`.
- `add` — crea imagen cuando bajo el límite.
- `add` — límite alcanzado → `ConflictException`.
- `add` — receta inexistente → `NotFoundException`.
- `add` — url vacía → `BadRequestException`.
- `update` — actualiza `alt` y `nameImage`.
- `update` — imagen no encontrada → `NotFoundException`.
- `deactivate` — setea inactiva.
- `deactivate` — imagen no encontrada → `NotFoundException`.
- `deactivate` — ya inactiva → retorna sin error (idempotente).

---

## Acceptance criteria

- [ ] `RecipeImagesService` implementa `IRecipeImagesService`.
- [ ] Límite de 10 imágenes activas enforced.
- [ ] Siempre valida `tenantId` vía repository.
- [ ] 12+ tests pasan.
- [ ] Cobertura del service ≥ 80%.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images.service` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images.service --coverage
```
