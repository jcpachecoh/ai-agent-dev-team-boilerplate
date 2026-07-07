# REC-IMG-01 Task 05 — GraphQL Types (ObjectType / InputType)

## Goal

Definir los tipos GraphQL code-first para imágenes de receta: `RecipeImageType`, inputs de create/update y args de query.

**Depends on:** Task 02 (interfaces definen el shape de dominio).

---

## Scope

- Crear DTOs GraphQL en `apps/api/src/recipe-images/resolver/dto/`.
- Sin resolver ni service implementation.

---

## Out of scope

- No resolver handlers.
- No module wiring.
- No tests del resolver (Task 06).

---

## Files allowed

- `apps/api/src/recipe-images/resolver/dto/recipe-image.type.ts` — create
- `apps/api/src/recipe-images/resolver/dto/add-recipe-image.input.ts` — create
- `apps/api/src/recipe-images/resolver/dto/update-recipe-image.input.ts` — create

---

## Files forbidden

- `recipe-images.resolver.ts` — Task 06
- `schema.prisma`

---

## Implementation notes

### `RecipeImageType`

```typescript
@ObjectType('RecipeImage')
export class RecipeImageType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) recipeId!: string;
  @Field(() => String, { nullable: true }) alt?: string | null;
  @Field() nameImage!: string;
  @Field() url!: string;
  @Field(() => String, { nullable: true }) storageObjectId?: string | null;
  @Field(() => Int) sortOrder!: number;
  @Field() isActive!: boolean; // expone "state" del requerimiento
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}
```

### `AddRecipeImageInput`

```typescript
@InputType()
export class AddRecipeImageInput {
  @Field(() => ID) recipeId!: string;
  @Field() nameImage!: string;
  @Field() url!: string;
  @Field(() => String, { nullable: true }) alt?: string;
  @Field(() => String, { nullable: true }) storageObjectId?: string;
  @Field(() => Int, { nullable: true }) sortOrder?: number;
}
```

Validaciones `class-validator` en el resolver o via global pipe:

- `nameImage`: `@IsString() @IsNotEmpty() @MaxLength(255)`
- `url`: `@IsUrl({ require_protocol: true })` o `@IsString() @Matches(/^https?:\/\//)`
- `alt`: `@IsOptional() @MaxLength(500)`

### `UpdateRecipeImageInput`

```typescript
@InputType()
export class UpdateRecipeImageInput {
  @Field(() => ID) id!: string;
  @Field(() => String, { nullable: true }) alt?: string;
  @Field(() => String, { nullable: true }) nameImage?: string;
  @Field(() => Int, { nullable: true }) sortOrder?: number;
}
```

**Design decisions:**

- GraphQL expone `isActive` como estado; el FE puede mapear a label "Activo/Inactivo".
- `tenantId` se expone en el type para debugging/admin; nunca se acepta del cliente en inputs.
- Upload binario **no** va en GraphQL — el cliente envía `url` obtenida del REST upload previo.

---

## Acceptance criteria

- [ ] `RecipeImageType` exportado con todos los campos del modelo.
- [ ] `AddRecipeImageInput` y `UpdateRecipeImageInput` exportados.
- [ ] Validadores en inputs donde aplique.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
