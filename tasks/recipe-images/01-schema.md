# REC-IMG-01 Task 01 — Prisma Schema: `RecipeImage`

## Goal

Agregar el modelo `RecipeImage` mapeado a `recipes_images` en `apps/api/prisma/schema.prisma`, con relación FK a `ProductionRecipe`. Ejecutar format, validate y generate.

**Depends on:** Ninguna.

---

## Scope

- Agregar modelo `RecipeImage` y relación inversa en `ProductionRecipe`.
- Ejecutar `prisma format`, `prisma validate`, `prisma generate`.
- Nada más.

---

## Out of scope

- No migración (`prisma migrate dev` prohibido en esta task — ver Task 01b).
- No código en `apps/api/src/`.
- No cambios a `package.json` / `pnpm-lock.yaml`.

---

## Files allowed

- `apps/api/prisma/schema.prisma` — append model + relation only

---

## Files forbidden

- Cualquier archivo en `apps/api/src/`
- Cualquier archivo en `packages/`
- `package.json` / `pnpm-lock.yaml`
- Archivos de migración

---

## Implementation

Agregar relación en `ProductionRecipe`:

```prisma
model ProductionRecipe {
  // ... campos existentes ...
  images RecipeImage[]
}
```

Agregar modelo (después de `ProductionRecipe`):

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// RECIPE IMAGES
// ─────────────────────────────────────────────────────────────────────────────

model RecipeImage {
  id              String   @id @default(cuid())
  tenantId        String
  recipeId        String
  alt             String?
  nameImage       String
  url             String
  storageObjectId String?
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  recipe ProductionRecipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  @@index([tenantId, recipeId])
  @@index([tenantId, recipeId, isActive])
  @@index([tenantId, isActive])
  @@map("recipes_images")
}
```

**Design decisions:**

- `tenantId` denormalizado — permite filtrar sin join obligatorio y validar aislamiento multi-tenant en repository.
- `isActive` implementa el requerimiento de `state` (activo/inactivo) siguiendo convención del proyecto.
- `nameImage` — nombre del archivo original o slug generado en upload.
- `url` — URL pública servida por R2 (`R2_PUBLIC_DOMAIN` + key) o mock en dev.
- `storageObjectId` — referencia opcional al registro en `storage_objects` para trazabilidad; no reemplaza `url` en el MVP.
- `sortOrder` — orden de visualización en FE sin necesitar `isMain` en MVP.
- `onDelete: Cascade` — al eliminar receta (soft delete futuro) las imágenes quedan huérfanas solo si se hard-delete; alinear con política de `ProductionRecipe` en implementación.
- Sin `deletedAt` — soft delete vía `isActive: false` (patrón estándar del proyecto para entidades no-User).

---

## Acceptance criteria

- [ ] `schema.prisma` contiene `RecipeImage` con `@@map("recipes_images")`.
- [ ] `ProductionRecipe` tiene relación `images RecipeImage[]`.
- [ ] Campos requeridos: `id`, `recipeId`, `tenantId`, `nameImage`, `url`, `isActive`, `createdAt`, `updatedAt`.
- [ ] `npx prisma format` exit 0.
- [ ] `npx prisma validate` exit 0.
- [ ] `npx prisma generate` exit 0.
- [ ] No se creó migración.

---

## Validation commands

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
```
