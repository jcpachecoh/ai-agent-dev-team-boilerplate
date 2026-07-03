# LOC-01 Task 05 — GraphQL DTOs y ObjectTypes

## Goal

Definir los tipos GraphQL (`@ObjectType`, `@InputType`) para `Location` y `LocationConnection`.

**Depends on:** Task 02 (interfaces de dominio).

---

## Scope

- Crear DTOs GraphQL en `apps/api/src/locations/resolver/dto/`.
- Mapear `tenantId` interno → field GraphQL `restaurantId`.

---

## Out of scope

- No resolver (Task 06).
- No service ni repository.
- No tests en esta tarea.

---

## Files allowed

- `apps/api/src/locations/resolver/dto/location.type.ts` — create
- `apps/api/src/locations/resolver/dto/location-connection.type.ts` — create
- `apps/api/src/locations/resolver/dto/create-location.input.ts` — create
- `apps/api/src/locations/resolver/dto/update-location.input.ts` — create
- `apps/api/src/locations/resolver/dto/index.ts` — create (barrel export)

---

## Files forbidden

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `package.json` / `pnpm-lock.yaml`

---

## Implementation notes

### `Location` ObjectType (`location.type.ts`)

```typescript
@ObjectType('Location')
export class LocationType {
  @Field(() => ID) id!: string;
  @Field() restaurantId!: string; // mapeado desde tenantId
  @Field() name!: string;
  @Field() address!: string;
  @Field(() => String, { nullable: true }) city?: string | null;
  @Field(() => String, { nullable: true }) phone?: string | null;
  @Field(() => String, { nullable: true }) code?: string | null;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}
```

Helper de mapeo (en mismo archivo o `locations.mapper.ts` si se prefiere):

```typescript
export function toLocationType(location: Location): LocationType {
  return {
    ...location,
    restaurantId: location.tenantId,
  };
}
```

### `LocationConnection` (`location-connection.type.ts`)

```typescript
@ObjectType('LocationEdge')
export class LocationEdgeType {
  @Field(() => LocationType) node!: LocationType;
  @Field() cursor!: string;
}

@ObjectType('PageInfo')
export class PageInfoType {
  @Field() hasNextPage!: boolean;
  @Field(() => String, { nullable: true }) endCursor?: string | null;
}

@ObjectType('LocationConnection')
export class LocationConnectionType {
  @Field(() => [LocationEdgeType]) edges!: LocationEdgeType[];
  @Field(() => PageInfoType) pageInfo!: PageInfoType;
}
```

> Si `PageInfo` ya existe globalmente en el proyecto, reutilizarlo en lugar de duplicar.

### `CreateLocationInput`

| Field          | Validación                  |
| -------------- | --------------------------- |
| `name`         | `@IsString() @IsNotEmpty()` |
| `address`      | `@IsString() @IsNotEmpty()` |
| `city`         | `@IsString() @IsOptional()` |
| `phone`        | `@IsString() @IsOptional()` |
| `restaurantId` | `@IsString() @IsNotEmpty()` |

### `UpdateLocationInput`

| Field      | Validación                                |
| ---------- | ----------------------------------------- |
| `name`     | `@IsString() @IsOptional() @IsNotEmpty()` |
| `address`  | `@IsString() @IsOptional() @IsNotEmpty()` |
| `city`     | `@IsString() @IsOptional()`               |
| `phone`    | `@IsString() @IsOptional()`               |
| `isActive` | `@IsBoolean() @IsOptional()`              |

Usar `class-validator` + `@Field()` de `@nestjs/graphql` — mismo patrón que `supply-categories` y `employees`.

---

## Acceptance criteria

- [ ] `LocationType` expone `restaurantId` (no `tenantId`) en GraphQL.
- [ ] `LocationConnectionType` con `edges` y `pageInfo`.
- [ ] `CreateLocationInput` y `UpdateLocationInput` con validaciones.
- [ ] Barrel `dto/index.ts` exporta todos los tipos.
- [ ] `pnpm --filter=@restopsiq/api typecheck` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api typecheck
```
