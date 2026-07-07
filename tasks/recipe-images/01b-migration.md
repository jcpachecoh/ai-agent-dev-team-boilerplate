# REC-IMG-01 Task 01b — Migration: `recipes_images`

## Goal

Crear y aplicar la migración SQL que materializa la tabla `recipes_images` en PostgreSQL.

**Depends on:** Task 01 (schema validado y client generado).

---

## Scope

- Crear migración Prisma con SQL de `recipes_images` únicamente.
- Verificar que la migración es idempotente en estructura (solo tablas/índices de esta task).

---

## Out of scope

- No cambios al schema (ya hechos en Task 01).
- No código de aplicación.
- No seed de imágenes de prueba.

---

## Files allowed

- `apps/api/prisma/migrations/<timestamp>_add_recipes_images/migration.sql` — create

---

## Files forbidden

- `apps/api/src/**`
- `package.json` / `pnpm-lock.yaml`
- Cualquier otra migración existente (no modificar)

---

## Implementation notes

```bash
cd apps/api
npx prisma migrate dev --name add_recipes_images
```

La migración debe incluir:

- Tabla `recipes_images` con columnas del modelo `RecipeImage`.
- FK `recipe_id` → `production_recipes(id)` ON DELETE CASCADE.
- Índices: `(tenant_id, recipe_id)`, `(tenant_id, recipe_id, is_active)`, `(tenant_id, is_active)`.

**Verificar SQL generado** antes de commitear — no debe incluir cambios no relacionados con `RecipeImage`.

---

## Acceptance criteria

- [ ] Existe migración `*_add_recipes_images`.
- [ ] SQL crea solo `recipes_images` + índices + FK.
- [ ] `npx prisma migrate deploy` exit 0 en entorno local.
- [ ] `npx prisma validate` exit 0.

---

## Validation commands

```bash
cd apps/api
npx prisma migrate dev --name add_recipes_images
npx prisma validate
```
