# RestOpsIQ — Claude Code Agent Context

> Este archivo es leído automáticamente por Claude Code en cada sesión.
> Contiene TODO lo que el agente necesita para generar código correcto sin supervisión.
> **No borrar. No mover de la raíz del repositorio.**

---

## 1. Proyecto

**RestOpsIQ** es una plataforma SaaS de operaciones para restaurantes en Colombia (expansión LATAM).
Multi-tenant: cada restaurante (tenant) opera de forma completamente aislada.

- Repositorio: monorepo con `pnpm workspaces`
- Ambientes: `dev` → `staging` (api-stg.opssynk.com) → `prod`
- Jira: <https://opssynk.atlassian.net> — proyecto **OS**
- Rama base: `develop` (no pushear directo a `main`)

---

## 2. Stack

| Capa            | Tecnología                             |
| --------------- | -------------------------------------- |
| Backend         | NestJS (Node 20), TypeScript estricto  |
| API             | GraphQL code-first con Apollo Server 5 |
| ORM             | Prisma + PostgreSQL                    |
| Frontend        | Vite + React 18 + TypeScript           |
| GraphQL client  | Apollo Client 3                        |
| Estilos         | CSS Modules + SCSS tokens              |
| Auth            | JWT (access + refresh tokens)          |
| Queues          | BullMQ + Redis                         |
| Package manager | pnpm (workspace)                       |
| Testing         | Jest + Supertest                       |
| CI              | GitHub Actions                         |
| Deploy          | Railway (staging) / OCI (prod)         |

---

## 3. Estructura del monorepo

```
/
├── apps/
│   ├── api/          ← NestJS backend
│   │   └── src/
│   │       ├── modules/      ← módulos de negocio
│   │       ├── common/       ← guards, decorators, interceptors compartidos
│   │       ├── prisma/       ← PrismaModule y PrismaService
│   │       └── main.ts
│   └── app/          ← Vite + React frontend
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── graphql/      ← queries y mutations .graphql
│           ├── hooks/
│           └── styles/       ← _variables.scss, _mixins.scss
├── packages/
│   └── shared/       ← tipos compartidos BE/FE
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── .github/
│   └── workflows/
├── CLAUDE.md         ← este archivo
└── pnpm-workspace.yaml
```

---

## 4. Reglas de arquitectura — CRÍTICAS

> Estas reglas son no negociables. Cualquier código que las viole será rechazado en PR review.

### 4.1 Multi-tenancy — `tenantId` SIEMPRE

**TODO** query o mutation de negocio debe filtrar por `tenantId`.

```typescript
// ✅ CORRECTO
async findAll(tenantId: string) {
  return this.prisma.product.findMany({
    where: { tenantId, deletedAt: null },
  });
}

// ❌ INCORRECTO — NUNCA hacer esto
async findAll() {
  return this.prisma.product.findMany(); // fuga de datos entre tenants
}
```

En resolvers GraphQL, extraer `tenantId` del contexto JWT:

```typescript
@Query(() => [Product])
@UseGuards(JwtAuthGuard)
products(@CurrentUser() user: JwtPayload): Promise<Product[]> {
  return this.productsService.findAll(user.tenantId);
}
```

### 4.2 Soft deletes — NUNCA hard delete

```typescript
// ✅ CORRECTO — soft delete
async remove(id: string, tenantId: string) {
  return this.prisma.product.update({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  });
}

// ❌ INCORRECTO — hard delete prohibido
async remove(id: string) {
  return this.prisma.product.delete({ where: { id } }); // PROHIBIDO
}
```

Filtrar SIEMPRE en queries:

```typescript
where: { tenantId, deletedAt: null } // deletedAt: null = no eliminado
```

### 4.3 Paginación cursor-based

```typescript
// ✅ CORRECTO — cursor-based pagination
async findAll(tenantId: string, cursor?: string, take = 20) {
  const items = await this.prisma.product.findMany({
    where: { tenantId, deletedAt: null },
    take: take + 1, // pedir 1 más para saber si hay siguiente página
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = items.length > take;
  const edges = hasNextPage ? items.slice(0, -1) : items;
  const endCursor = edges.at(-1)?.id ?? null;

  return { edges, pageInfo: { hasNextPage, endCursor } };
}

// ❌ INCORRECTO — offset pagination prohibida en listados
async findAll(page: number, limit: number) {
  return this.prisma.product.findMany({ skip: page * limit, take: limit }); // PROHIBIDO
}
```

---

## 5. Convenciones NestJS / GraphQL

### 5.1 Estructura de módulo (patrón estándar)

```
modules/products/
├── products.module.ts
├── products.resolver.ts
├── products.service.ts
├── dto/
│   ├── create-product.input.ts
│   └── update-product.input.ts
├── entities/
│   └── product.entity.ts
└── products.service.spec.ts   ← tests junto al service
```

### 5.2 Entity (ObjectType GraphQL)

```typescript
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  tenantId: string;

  @Field({ nullable: true })
  deletedAt?: Date;
}
```

### 5.3 DTOs (InputType GraphQL)

```typescript
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;
}
```

### 5.4 Resolver

```typescript
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => ProductConnection)
  @UseGuards(JwtAuthGuard) // SIEMPRE en resolvers de negocio
  async products(
    @CurrentUser() user: JwtPayload,
    @Args('cursor', { nullable: true }) cursor?: string,
    @Args('take', { defaultValue: 20 }) take?: number,
  ): Promise<ProductConnection> {
    return this.productsService.findAll(user.tenantId, cursor, take);
  }

  @Mutation(() => Product)
  @UseGuards(JwtAuthGuard)
  async createProduct(
    @Args('input') input: CreateProductInput,
    @CurrentUser() user: JwtPayload,
  ): Promise<Product> {
    return this.productsService.create({ ...input, tenantId: user.tenantId });
  }
}
```

### 5.5 Manejo de errores (siempre excepciones NestJS)

```typescript
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

// Recurso no encontrado
throw new NotFoundException(`Producto ${id} no encontrado`);

// Acceso denegado entre tenants
throw new ForbiddenException('Acceso denegado');

// Duplicado (unique constraint)
throw new ConflictException('Ya existe un producto con ese nombre');
```

**NUNCA** retornar `null` cuando el recurso no existe — siempre `NotFoundException`.
**NUNCA** usar `any` en TypeScript — tipos explícitos obligatorios.

---

## 6. Convenciones Prisma

### 6.1 Schema — patrón de modelo

```prisma
model Product {
  id           String    @id @default(cuid())
  name         String
  tenantId String                           // FK multi-tenant OBLIGATORIO
  restaurant   Restaurant @relation(fields: [tenantId], references: [id])
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?                        // soft delete

  @@index([tenantId])                       // índice OBLIGATORIO
  @@index([deletedAt])                          // para filtros de soft delete
}
```

### 6.2 Seeds idempotentes

```typescript
// prisma/seed.ts — SIEMPRE upsert, nunca create simple
await prisma.product.upsert({
  where: { id: 'seed-product-001' },
  update: {},
  create: {
    id: 'seed-product-001',
    name: 'Producto de prueba',
    tenantId: 'seed-restaurant-001',
  },
});
```

### 6.3 Migraciones

```bash
# Crear migración (NO ejecutar directamente en prod)
pnpm prisma migrate dev --name descripcion-corta

# Aplicar en staging/prod
pnpm prisma migrate deploy
```

---

## 7. Convenciones Frontend (Vite + React)

### 7.1 Queries y Mutations — SIEMPRE Apollo Client

```typescript
// ✅ CORRECTO — Apollo hooks
import { useQuery, useMutation } from '@apollo/client';
import { GET_PRODUCTS } from '../../graphql/products.queries';

const { data, loading, error } = useQuery(GET_PRODUCTS, {
  variables: { take: 20 },
});

// ❌ INCORRECTO — fetch directo prohibido
const data = await fetch('/graphql', { ... }); // PROHIBIDO
```

### 7.2 Estilos — CSS Modules + tokens SCSS

```typescript
// ✅ CORRECTO
import styles from './ProductCard.module.scss';

<div className={styles.card}>
  <span className={styles.title}>{product.name}</span>
</div>

// ❌ INCORRECTO — inline styles prohibidos
<div style={{ color: '#333', padding: '16px' }}> // PROHIBIDO
```

### 7.3 Formularios — react-hook-form + zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
});

type FormData = z.infer<typeof schema>;

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### 7.4 Estados obligatorios en componentes async

```typescript
// TODOS los componentes con datos async deben manejar estos 3 estados
if (loading) return <ProductCardSkeleton />; // skeleton, no spinner genérico
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!data?.products.edges.length) return <EmptyState message="No hay productos" />;
```

---

## 8. Testing

### 8.1 Unit tests (service layer)

```typescript
// products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('filtra siempre por tenantId y deletedAt null', async () => {
      // Arrange
      const tenantId = 'rest-001';
      prisma.product.findMany.mockResolvedValue([]);

      // Act
      await service.findAll(tenantId);

      // Assert
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null },
        }),
      );
    });

    it('lanza NotFoundException si el producto no existe', async () => {
      // Arrange
      prisma.product.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('id-inexistente', 'rest-001')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

### 8.2 Reglas de testing

- Tests en `*.service.spec.ts` junto al service que testean
- **Cobertura mínima: 80% en services** — verificar con `pnpm test --coverage`
- **NUNCA** base de datos real en unit tests — siempre `jest.fn()`
- Patrón AAA: `// Arrange`, `// Act`, `// Assert` como comentarios
- Tests E2E en `apps/api/test/` con Supertest

### 8.3 Ejecutar tests

```bash
# Unit tests
pnpm test

# Con coverage (requerido antes de abrir PR)
pnpm test --coverage

# Watch mode (desarrollo)
pnpm test --watch

# E2E
pnpm test:e2e
```

---

## 9. Flujo de trabajo del agente

Cuando el agente recibe un issue (`/claude OS-XXX`), debe seguir este orden **sin saltarse pasos**:

```
Paso 1 — Leer el issue
  → Buscar en Jira el issue OS-XXX
  → Entender el criterio de aceptación completo
  → Identificar qué módulo/archivo afecta

Paso 2 — Crear rama
  → git checkout develop && git pull
  → git checkout -b feat/OS-XXX-descripcion-corta
  (bugs: fix/OS-XXX-descripcion)
  (chore: chore/OS-XXX-descripcion)

Paso 3 — Implementar
  → Seguir las convenciones de este CLAUDE.md
  → Si es BE: module → entity → dto → service → resolver
  → Si es FE: query gql → hook → componente → estilos
  → Si es fullstack: empezar por BE, terminar en FE

Paso 4 — Escribir tests
  → Unit tests del service con mocks de Prisma
  → Casos: happy path + edge cases + validaciones de tenantId

Paso 5 — Verificar pipeline local
  → pnpm lint          (debe pasar en verde)
  → pnpm typecheck     (cero errores TS)
  → pnpm test --coverage  (cobertura > 80%)
  → Si alguno falla → corregir antes de continuar

Paso 6 — Commit y PR
  → git add -A
  → git commit -m "feat(OS-XXX): descripcion concisa en español"
  → git push origin feat/OS-XXX-descripcion-corta
  → Crear PR hacia develop con:
      Título: [OS-XXX] Descripción de la tarea
      Body: Closes OS-XXX + checklist de acceptance criteria
```

---

## 10. Comandos útiles

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev              # levanta api + app en paralelo
pnpm --filter api dev # solo backend
pnpm --filter app dev # solo frontend

# Build
pnpm build
pnpm --filter api build
pnpm --filter app build

# Linting y tipos
pnpm lint
pnpm lint:fix
pnpm typecheck

# Tests
pnpm test
pnpm test --coverage
pnpm test:e2e

# Prisma
pnpm prisma generate          # regenerar cliente
pnpm prisma migrate dev       # crear migración en dev
pnpm prisma migrate deploy    # aplicar en staging/prod
pnpm prisma studio            # GUI de la base de datos
pnpm prisma db seed           # ejecutar seed

# Antes de cualquier PR
pnpm lint && pnpm typecheck && pnpm test --coverage
```

---

## 11. Anti-patrones — NUNCA hacer esto

| ❌ Prohibido                             | ✅ Correcto                                   |
| ---------------------------------------- | --------------------------------------------- |
| `prisma.model.findMany()` sin `tenantId` | Siempre `where: { tenantId }`                 |
| `prisma.model.delete()`                  | `update({ data: { deletedAt: new Date() } })` |
| `prisma.model.findMany({ skip, take })`  | Cursor-based pagination                       |
| Resolver sin `@UseGuards(JwtAuthGuard)`  | Siempre guard en resolvers de negocio         |
| Lógica de negocio en el resolver         | Delegar todo al service                       |
| `return null` cuando no existe           | `throw new NotFoundException()`               |
| `any` en TypeScript                      | Tipos explícitos siempre                      |
| `fetch('/graphql', ...)` en FE           | `useQuery` / `useMutation` de Apollo          |
| `style={{ color: '#333' }}` en JSX       | CSS Modules                                   |
| `prisma.create()` en seed                | `prisma.upsert()` siempre                     |
| PR sin tests                             | Cobertura > 80% obligatoria                   |
| Push a `main` directo                    | PR hacia `develop` siempre                    |

---

## 12. Contexto del equipo

- **Juan Carlos Pacheco** (`juan.pacheco@opssynk.com`) — Lead engineer / revisor de PRs
- **Sofia Terrios** — Desarrolladora full stack
- **Nicolas Riveros** — Desarrollador

El agente opera como un miembro más del equipo. Sus PRs son revisados por Juan Carlos antes de mergear.

---

_Última actualización: 2026-06-14 | RestOpsIQ v1 — Fase 1 MVP POS activa_
