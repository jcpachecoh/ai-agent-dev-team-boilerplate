# REC-IMG-01 Task 02 — Interfaces

## Goal

Definir los contratos TypeScript del módulo `recipe-images` antes de implementar repository y service.

**Depends on:** Task 01 (`RecipeImage` disponible en `@prisma/client`).

---

## Scope

- Crear `apps/api/src/recipe-images/interfaces/recipe-images.interfaces.ts`.
- Sin implementación ni tests.

---

## Out of scope

- No repository, service, resolver ni module.
- No cambios a `plant.interfaces.ts`.

---

## Files allowed

- `apps/api/src/recipe-images/interfaces/recipe-images.interfaces.ts` — create

---

## Files forbidden

- `schema.prisma`
- `package.json` / `pnpm-lock.yaml`
- Cualquier otro módulo existente

---

## Implementation notes

```typescript
import type { RecipeImage } from '@prisma/client';

export interface RecipeImageRecord {
  id: string;
  tenantId: string;
  recipeId: string;
  alt: string | null;
  nameImage: string;
  url: string;
  storageObjectId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddRecipeImageData {
  recipeId: string;
  alt?: string;
  nameImage: string;
  url: string;
  storageObjectId?: string;
  sortOrder?: number;
}

export interface UpdateRecipeImageData {
  alt?: string;
  nameImage?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface IRecipeImagesRepository {
  findByRecipeId(
    tenantId: string,
    recipeId: string,
    includeInactive?: boolean,
  ): Promise<RecipeImageRecord[]>;
  findById(tenantId: string, id: string): Promise<RecipeImageRecord | null>;
  countActiveByRecipeId(tenantId: string, recipeId: string): Promise<number>;
  recipeExists(tenantId: string, recipeId: string): Promise<boolean>;
  create(tenantId: string, data: AddRecipeImageData): Promise<RecipeImageRecord>;
  update(tenantId: string, id: string, data: UpdateRecipeImageData): Promise<RecipeImageRecord>;
  deactivate(tenantId: string, id: string): Promise<RecipeImageRecord>;
}

export interface IRecipeImagesService {
  listByRecipe(
    tenantId: string,
    recipeId: string,
    includeInactive?: boolean,
  ): Promise<RecipeImageRecord[]>;
  add(tenantId: string, data: AddRecipeImageData): Promise<RecipeImageRecord>;
  update(tenantId: string, id: string, data: UpdateRecipeImageData): Promise<RecipeImageRecord>;
  deactivate(tenantId: string, id: string): Promise<RecipeImageRecord>;
}
```

**Design decisions:**

- `RecipeImageRecord` es el shape de dominio; el repository mapea desde `RecipeImage` de Prisma.
- `recipeExists` valida que la receta pertenece al tenant antes de crear imagen.
- `countActiveByRecipeId` soporta el límite de 10 imágenes activas en el service.
- `deactivate` en repository solo hace `isActive: false` — sin hard delete.

---

## Acceptance criteria

- [ ] `IRecipeImagesRepository` exportado con 7 métodos.
- [ ] `IRecipeImagesService` exportado con 4 métodos.
- [ ] `AddRecipeImageData`, `UpdateRecipeImageData`, `RecipeImageRecord` exportados.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa con 0 errores.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
