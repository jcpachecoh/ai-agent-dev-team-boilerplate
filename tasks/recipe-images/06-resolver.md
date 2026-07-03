# REC-IMG-01 Task 06 — `RecipeImagesResolver` + Unit Tests

## Goal

Exponer queries y mutations GraphQL para gestionar imágenes de receta con `JwtAuthGuard` y `tenantId` del JWT.

**Depends on:** Task 04 (service), Task 05 (GraphQL types).

---

## Scope

- Crear `apps/api/src/recipe-images/resolver/recipe-images.resolver.ts`.
- Crear `apps/api/src/recipe-images/test/recipe-images.resolver.spec.ts`.

---

## Out of scope

- No module wiring (Task 07).
- No cambios a `StorageController`.

---

## Files allowed

- `apps/api/src/recipe-images/resolver/recipe-images.resolver.ts` — create
- `apps/api/src/recipe-images/test/recipe-images.resolver.spec.ts` — create

---

## Files forbidden

- `app.module.ts` — Task 07
- `schema.prisma`

---

## Implementation notes

```typescript
@Resolver(() => RecipeImageType)
@UseGuards(JwtAuthGuard)
export class RecipeImagesResolver {
  constructor(private readonly recipeImagesService: RecipeImagesService) {}

  @Query(() => [RecipeImageType])
  recipeImages(
    @CurrentUser() user: JwtPayload,
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('includeInactive', { type: () => Boolean, nullable: true }) includeInactive?: boolean,
  ) {
    return this.recipeImagesService.listByRecipe(user.tenantId, recipeId, includeInactive);
  }

  @Mutation(() => RecipeImageType)
  addRecipeImage(@CurrentUser() user: JwtPayload, @Args('input') input: AddRecipeImageInput) {
    return this.recipeImagesService.add(user.tenantId, input);
  }

  @Mutation(() => RecipeImageType)
  updateRecipeImage(@CurrentUser() user: JwtPayload, @Args('input') input: UpdateRecipeImageInput) {
    const { id, ...data } = input;
    return this.recipeImagesService.update(user.tenantId, id, data);
  }

  @Mutation(() => RecipeImageType)
  deactivateRecipeImage(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.recipeImagesService.deactivate(user.tenantId, id);
  }
}
```

### Permisos (si el proyecto usa `@RequirePermission`)

Evaluar permiso existente de recetas/planta, ej.:

```typescript
@RequirePermission('production.recipes.write') // confirmar código real en seed
```

Si no existe permiso granular, usar `@UseGuards(JwtAuthGuard, RolesGuard)` con roles de inventario/producción según convención del módulo plant.

### Test strategy

Mock `RecipeImagesService`. Mínimo 6 tests:

- `recipeImages` — delega con `user.tenantId`.
- `addRecipeImage` — delega al service.
- `updateRecipeImage` — separa `id` del payload.
- `deactivateRecipeImage` — delega al service.
- Resolver no inyecta repository.
- Guard `JwtAuthGuard` aplicado (verificar metadata o comportamiento en spec).

---

## Acceptance criteria

- [ ] 4 operaciones GraphQL implementadas.
- [ ] `@UseGuards(JwtAuthGuard)` en el resolver.
- [ ] `tenantId` nunca viene del body/args del cliente.
- [ ] Controller no existe — solo resolver (GraphQL).
- [ ] 6+ tests del resolver pasan.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images.resolver` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images.resolver
```
