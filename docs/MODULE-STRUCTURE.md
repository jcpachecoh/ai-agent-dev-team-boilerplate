# NestJS Module Structure

Every domain module in `apps/api/src/` must follow this exact folder layout. No exceptions.

---

## Folder Layout

```
src/
└── {feature}/
    ├── {feature}.module.ts          ← DI wiring — registers all providers
    │
    ├── interfaces/                  ← TypeScript contracts (no runtime code)
    │   └── {feature}.interfaces.ts  ← IRepository + IService interface definitions
    │
    ├── repository/                  ← Data layer — Prisma queries only
    │   └── {feature}.repository.ts  ← implements I{Feature}Repository
    │
    ├── service/                     ← Business logic layer
    │   └── {feature}.service.ts     ← implements I{Feature}Service, injects Repository
    │
    ├── controller/                  ← HTTP adapter layer
    │   ├── {feature}.controller.ts  ← calls Service only, never Repository
    │   └── dto/
    │       ├── create-{feature}.dto.ts
    │       └── update-{feature}.dto.ts
    │
    └── test/                        ← All spec files
        ├── {feature}.controller.spec.ts
        └── {feature}.service.spec.ts
```

---

## Dependency Direction

```
HTTP Request
     │
     ▼
┌──────────────┐
│  controller/ │  ← validates input, calls ONE service method, returns response
└──────┬───────┘
       │ calls only service methods
       ▼
┌──────────────┐
│   service/   │  ← business logic, throws domain exceptions, injects repository
└──────┬───────┘
       │ calls only repository methods
       ▼
┌──────────────┐
│ repository/  │  ← DB queries only, no business logic, no exceptions (returns null)
└──────┬───────┘
       │ types from
       ▼
┌──────────────┐
│ interfaces/  │  ← IRepository + IService contracts (imported by all layers)
└──────────────┘
```

**Rules:**

- `controller/` must NOT import from `repository/`
- `repository/` must NOT import from `service/` or `controller/`
- `interfaces/` must NOT import runtime code (no classes, no decorators)
- `service/` owns all business logic — `repository/` returns raw data (`null` instead of throwing)

---

## interfaces/ conventions

The interfaces file defines two contracts — one for the repository and one for the service:

```typescript
// {feature}.interfaces.ts

export interface Create{Feature}Data {
  // plain data shape passed to repository.create()
}

export interface I{Feature}Repository {
  findAll(...): Promise<Entity[]>;
  findOne(...): Promise<Entity | null>;  // null, not NotFoundException
  create(data: Create{Feature}Data): Promise<Entity>;
}

export interface I{Feature}Service {
  findAll(...): Promise<Entity[]>;
  findOne(...): Promise<Entity>;         // throws NotFoundException if missing
  create(...): Promise<Entity>;
}
```

---

## repository/ conventions

- Decorated with `@Injectable()`
- Injects `PrismaService` only
- Implements `I{Feature}Repository`
- Never throws HTTP exceptions — returns `null` for missing records
- No business logic (no `ConflictException`, no conditional branching beyond queries)

```typescript
@Injectable()
export class {Feature}Repository implements I{Feature}Repository {
  constructor(private readonly prisma: PrismaService) {}
  // ...
}
```

---

## service/ conventions

- Decorated with `@Injectable()`
- Injects `{Feature}Repository` — never `PrismaService` directly
- Implements `I{Feature}Service`
- Owns all business-logic exceptions (`NotFoundException`, `ConflictException`, etc.)

```typescript
@Injectable()
export class {Feature}Service implements I{Feature}Service {
  constructor(private readonly {feature}Repository: {Feature}Repository) {}
  // ...
}
```

---

## controller/ conventions

- Decorated with `@Controller()`
- Injects `{Feature}Service` only — never `{Feature}Repository`
- DTOs live in `controller/dto/` and are imported by service via `../controller/dto/`

---

## module.ts wiring

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [{Feature}Controller],
  providers: [{Feature}Repository, {Feature}Service],
})
export class {Feature}Module {}
```

---

## test/ conventions

- `{feature}.controller.spec.ts` — mocks `{Feature}Service`
- `{feature}.service.spec.ts` — mocks `{Feature}Repository`
- Always call `jest.clearAllMocks()` in `afterEach` or set `clearMocks: true` in jest config
- Cover both happy path and error/not-found paths

---

## Real Example — projects module

```
projects/
├── projects.module.ts
├── interfaces/
│   └── projects.interfaces.ts      ← IProjectsRepository, IProjectsService, CreateProjectData
├── repository/
│   └── projects.repository.ts      ← implements IProjectsRepository, injects PrismaService
├── service/
│   └── projects.service.ts         ← implements IProjectsService, injects ProjectsRepository
├── controller/
│   ├── projects.controller.ts      ← injects ProjectsService
│   └── dto/
│       └── create-project.dto.ts
└── test/
    ├── projects.controller.spec.ts
    └── projects.service.spec.ts
```
