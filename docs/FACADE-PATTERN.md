# NestJS Facade Pattern

The RestOpsIQ API follows the **Facade pattern** to enforce a clean, layered module structure. This is the single most important architectural rule in the backend codebase — **no exceptions**.

---

## The Rule in One Line

> **Controllers talk to Services. Services talk to Repositories and Entities. Nothing else.**

```
HTTP Request
     │
     ▼
┌─────────────┐
│  Controller │  ← API layer: validates input, calls ONE service method, returns response
└──────┬──────┘
       │ calls only service methods (never repo/entity directly)
       ▼
┌─────────────┐
│   Service   │  ← Facade: orchestrates business logic, owns transactions
└──────┬──────┘
       │ calls repos, other services, external APIs
       ▼
┌──────────────────┐
│   Repository /   │  ← Data layer: DB queries only, no business logic
│     Entity       │
└──────────────────┘
```

---

## Folder Structure per Module

Every domain module **must** follow this layout:

```
src/
└── {feature}/
    ├── {feature}.module.ts              # DI wiring — registers all providers
    │
    ├── api/                             # ADAPTER layer (controllers + DTOs)
    │   ├── {feature}.controller.ts      # Route handlers → call service only
    │   ├── {feature}.controller.spec.ts # Unit tests (mock service)
    │   └── dto/
    │       ├── create-{feature}.dto.ts
    │       └── update-{feature}.dto.ts
    │
    ├── application/                     # FACADE layer (services / use-cases)
    │   ├── {feature}.service.ts         # Single public interface of the module
    │   └── {feature}.service.spec.ts    # Unit tests (mock repository)
    │
    ├── infrastructure/                  # DATA layer (repositories)
    │   ├── {feature}.repository.ts      # DB access (Prisma/TypeORM)
    │   └── {feature}.repository.spec.ts # Integration tests
    │
    ├── entities/                        # DOMAIN layer (DB entities / Prisma models)
    │   └── {feature}.entity.ts
    │
    └── interfaces/                      # Shared contracts (TypeScript interfaces)
        └── {feature}.interface.ts
```

---

## Import Rules (enforced by ESLint `boundaries` plugin)

| From ↓ / To →  | Controller | Service | Repository | Entity | DTO | Interface | Shared |
| -------------- | :--------: | :-----: | :--------: | :----: | :-: | :-------: | :----: |
| **Controller** |     ✗      |   ✅    |     ❌     |   ❌   | ✅  |    ✅     |   ✅   |
| **Service**    |     ✗      |   ✅    |     ✅     |   ✅   | ✅  |    ✅     |   ✅   |
| **Repository** |     ✗      |   ❌    |     ✗      |   ✅   | ❌  |    ✅     |   ✅   |
| **Entity**     |     ✗      |   ❌    |     ✗      |   ✗    | ❌  |    ❌     |   ✅   |

> ❌ = **blocked by ESLint** — CI will fail  
> ✅ = allowed  
> ✗ = not applicable (same layer)

---

## Examples

### ✅ Correct — Controller delegates to Service (Facade)

```typescript
// api/orders.controller.ts
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {} // ✅ only Service

  @Post()
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(dto); // ✅ delegate to facade
  }
}
```

### ❌ Wrong — Controller imports Repository directly

```typescript
// api/orders.controller.ts  ← ESLint ERROR
import { OrdersRepository } from '../infrastructure/orders.repository'; // ❌ BLOCKED

@Controller('orders')
export class OrdersController {
  constructor(private readonly repo: OrdersRepository) {} // ❌ bypasses facade
}
```

### ✅ Correct — Service is the Facade (hides complexity)

```typescript
// application/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository, // ✅ service owns repo
    private readonly notificationsService: NotificationsService, // ✅ can call other services
  ) {}

  async create(dto: CreateOrderDto): Promise<IOrder> {
    const order = await this.ordersRepository.create(dto); // ✅ service → repo
    await this.notificationsService.notifyNewOrder(order); // ✅ service → service
    return order;
  }
}
```

---

## Testing Requirements

| Layer      | Test Type                            | What to Mock                                            |
| ---------- | ------------------------------------ | ------------------------------------------------------- |
| Controller | Unit (`*.controller.spec.ts`)        | Mock the Service with `jest.fn()`                       |
| Service    | Unit (`*.service.spec.ts`)           | Mock the Repository with `jest.fn()`                    |
| Repository | Integration (`*.repository.spec.ts`) | Use real test DB or `@nestjs/testing` with in-memory DB |

**Every controller method and every service method must have a corresponding test.**

---

## Structure Validation

Run the structure validator locally:

```bash
node scripts/validate-structure.js
```

This script is also run in CI on every PR. A failure blocks the merge.
