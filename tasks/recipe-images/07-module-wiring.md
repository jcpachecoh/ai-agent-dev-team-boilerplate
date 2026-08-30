# REC-IMG-01 Task 07 — `RecipeImagesModule` + Structure Validation

## Goal

Registrar providers del módulo, importar dependencias y exponer el resolver en GraphQL.

**Depends on:** Tasks 03–06 (todos los providers deben existir).

---

## Scope

- Crear `apps/api/src/recipe-images/recipe-images.module.ts`.
- Registrar `RecipeImagesModule` en `apps/api/src/app.module.ts`.
- Ejecutar `node scripts/validate-structure.js`.

---

## Out of scope

- No cambios a `StorageModule` (ya registrado globalmente).
- No nuevas dependencias en `package.json`.

---

## Files allowed

- `apps/api/src/recipe-images/recipe-images.module.ts` — create
- `apps/api/src/app.module.ts` — add `RecipeImagesModule` import only

---

## Files forbidden

- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`
- Otros módulos existentes (salvo `app.module.ts`)

---

## Implementation notes

```typescript
@Module({
  imports: [PrismaModule],
  providers: [RecipeImagesRepository, RecipeImagesService, RecipeImagesResolver],
  exports: [RecipeImagesService],
})
export class RecipeImagesModule {}
```

### AppModule

```typescript
import { RecipeImagesModule } from './recipe-images/recipe-images.module';

@Module({
  imports: [
    // ... existing ...
    RecipeImagesModule,
  ],
})
export class AppModule {}
```

### Estructura requerida por `validate-structure.js`

```
recipe-images/
├── interfaces/
├── repository/
├── service/
├── resolver/
│   └── dto/          # equivalente a controller/dto/ en módulos REST
├── test/
└── recipe-images.module.ts
```

Si el script exige `controller/` para módulos GraphQL-only, documentar excepción o agregar carpeta vacía con `README` — **verificar salida del script antes de mergear**.

---

## Acceptance criteria

- [ ] `RecipeImagesModule` registra repository, service y resolver.
- [ ] `AppModule` importa `RecipeImagesModule`.
- [ ] `node scripts/validate-structure.js` exit 0.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.
- [ ] `pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images` pasa todos los tests.
- [ ] Schema GraphQL generado incluye `RecipeImage`, `addRecipeImage`, `updateRecipeImage`, `deactivateRecipeImage`.

---

## Validation commands

```bash
node scripts/validate-structure.js
pnpm --filter=@restopsiq/api typecheck
pnpm --filter=@restopsiq/api test -- --testPathPattern=recipe-images
```

### Smoke test manual (opcional)

```graphql
query RecipeImages($recipeId: ID!) {
  recipeImages(recipeId: $recipeId) {
    id
    url
    alt
    nameImage
    isActive
  }
}

mutation AddRecipeImage($input: AddRecipeImageInput!) {
  addRecipeImage(input: $input) {
    id
    url
  }
}
```
