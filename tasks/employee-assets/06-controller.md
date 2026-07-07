# OS-558 Task 06 — Controller REST: `EmployeeAssetsController`

## Goal

Implementar `EmployeeAssetsController` REST con endpoints CRUD para `employee_assets`. Tests unitarios del controller.

**Depends on:** Task 04 (service), Task 05 (DTOs).

---

## Scope

- `apps/api/src/payroll/controller/employee-assets.controller.ts`
- `apps/api/src/payroll/test/employee-assets.controller.spec.ts`

---

## Out of scope

- Resolver GraphQL (Task 07).
- Integración con nómina (Task 08).

---

## Files allowed

- `apps/api/src/payroll/controller/employee-assets.controller.ts`
- `apps/api/src/payroll/test/employee-assets.controller.spec.ts`

---

## Referencia: patrón existente

Ver `apps/api/src/payroll/controller/employee-positions.controller.ts`.

---

## Endpoints

| Método | Ruta                   | Descripción                                   |
| ------ | ---------------------- | --------------------------------------------- |
| POST   | `/employee-assets`     | Registrar activo a empleado                   |
| GET    | `/employee-assets`     | Listar activos por `employeeId` (query param) |
| GET    | `/employee-assets/:id` | Obtener activo por ID                         |
| PATCH  | `/employee-assets/:id` | Actualizar estado/valor/notas                 |

---

## Implementation

```typescript
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { EmployeeAssetsService } from '../service/employee-assets.service';
import { CreateEmployeeAssetDto } from './dto/create-employee-asset.dto';
import { UpdateEmployeeAssetDto } from './dto/update-employee-asset.dto';
import { AssetStatus } from '@prisma/client';

@ApiTags('employee-assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('employee-assets')
export class EmployeeAssetsController {
  constructor(private readonly service: EmployeeAssetsService) {}

  @Post()
  create(@Body() dto: CreateEmployeeAssetDto, @CurrentUser() user: JwtPayload) {
    return this.service.create({
      ...dto,
      tenantId: user.tenantId,
      assignmentDate: dto.assignmentDate ? new Date(dto.assignmentDate) : undefined,
    });
  }

  @Get()
  @ApiQuery({ name: 'employeeId', required: true })
  @ApiQuery({ name: 'status', enum: AssetStatus, required: false })
  findByEmployee(
    @Query('employeeId') employeeId: string,
    @Query('status') status: AssetStatus | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findByEmployee(employeeId, user.tenantId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findById(id, user.tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeAssetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }
}
```

### Tests `employee-assets.controller.spec.ts`

Mockear `EmployeeAssetsService`. Verificar:

- `create` → extrae `tenantId` del user, no acepta `tenantId` del body.
- `findByEmployee` → pasa `user.tenantId`, no el del query.
- `findOne` → delega al service con `tenantId` del JWT.
- `update` → `tenantId` siempre del JWT.

---

## Acceptance criteria

- [ ] 4 endpoints implementados con `@UseGuards(JwtAuthGuard)`.
- [ ] `tenantId` SIEMPRE extraído del JWT, nunca del body/query.
- [ ] Tests unitarios cubren los 4 endpoints.
- [ ] `pnpm typecheck` exit 0.
- [ ] `pnpm --filter=@restopsiq/api test` pasa.

---

## Validation commands

```bash
pnpm --filter=@restopsiq/api test -- --testPathPattern=employee-assets.controller
pnpm --filter=@restopsiq/api typecheck
```
