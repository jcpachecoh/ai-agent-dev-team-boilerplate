# REC-IMG-01 Task 03 — `RecipeImagesRepository` + Unit Tests

## Goal

Implementar la capa de acceso a datos Prisma para `RecipeImage`. Sin lógica de negocio ni excepciones HTTP.

**Depends on:** Task 01b (migración), Task 02 (interfaces).

---

## Scope

- Crear `apps/api/src/recipe-images/repository/recipe-images.repository.ts`.
- Crear `apps/api/src/recipe-images/test/recipe-images.repository.spec.ts`.

---

## Out of scope

- No validación de límite de imágenes (service).
- No integración con `StorageService`.
- No resolver ni module wiring.

---

## Files allowed

- `apps/api/src/recipe-images/repository/recipe-images.repository.ts` — create
- `apps/api/src/recipe-images/test/recipe-images.repository.spec.ts` — create

---

## Files forbidden

- `recipe-images.module.ts` — Task 07
- `schema.prisma`
- `app.module.ts`

---

## Implementation notes

```typescript
@Injectable()
export class RecipeImagesRepository implements IRecipeImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByRecipeId(tenantId, recipeId, includeInactive = false) {
    return this.prisma.recipeImage.findMany({
      where: {
        tenantId,
        recipeId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findById(tenantId, id) {
    return this.prisma.recipeImage.findFirst({ where: { id, tenantId } });
  }

  countActiveByRecipeId(tenantId, recipeId) {
    return this.prisma.recipeImage.count({
      where: { tenantId, recipeId, isActive: true },
    });
  }

  recipeExists(tenantId, recipeId) {
    return this.prisma.productionRecipe
      .findFirst({ where: { id: recipeId, tenantId, isActive: true }, select: { id: true } })
      .then((row) => !!row);
  }

  create(tenantId, data) {
    return this.prisma.recipeImage.create({
      data: { tenantId, ...data, isActive: true },
    });
  }

  update(tenantId, id, data) {
    return this.prisma.recipeImage.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  deactivate(tenantId, id) {
    return this.prisma.recipeImage.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

### Test strategy

Mock `PrismaService` con objeto plano. Mínimo 10 casos:

- `findByRecipeId` — filtra `tenantId`, `recipeId`, `isActive: true` por defecto.
- `findByRecipeId` — incluye inactivas cuando `includeInactive=true`.
- `findById` — retorna `null` si no existe.
- `countActiveByRecipeId` — cuenta solo activas.
- `recipeExists` — retorna `true`/`false`.
- `create` — persiste con `tenantId`.
- `update` — aplica campos parciales.
- `deactivate` — setea `isActive: false`.

---

## Acceptance criteria

- [ ] `RecipeImagesRepository` implementa `IRecipeImagesRepository`.
- [ ] Solo inyecta `PrismaService`.
- [ ] Sin excepciones HTTP en repository.
- [ ] Queries siempre filtran por `tenantId`.
- [ ] 10+ tests pasan.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images.repository` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images.repository
```
