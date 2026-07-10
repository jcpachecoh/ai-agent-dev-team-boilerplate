import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { CesantiasCalculateForYearResult } from '../interfaces/cesantias-service.interfaces';
import type { CesantiasLiquidationRecord } from '../interfaces/cesantias.interfaces';
import { CesantiasService } from '../service/cesantias.service';
import { CalculateCesantiasDto } from './dto/cesantias-calculate.dto';
import { ListCesantiasQueryDto } from './dto/list-cesantias-query.dto';

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
type CesantiasListResponse = {
  items: CesantiasLiquidationRecord[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * OS-588 (fase 2) — endpoints mínimos: ejecutar cálculo anual, listar, detalle. Sin
 * exportaciones, alertas ni pagos todavía (fuera de alcance de esta fase). Reutiliza los
 * guards/roles/DTOs de paginación del módulo payroll — sin roles nuevos.
 */
@ApiTags('cesantias')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('cesantias')
export class CesantiasController {
  constructor(private readonly cesantiasService: CesantiasService) {}

  @ApiOperation({ summary: 'Calcular liquidación anual de cesantías e intereses para un año' })
  @ApiResponse({ status: 201 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post('calculate')
  async calculate(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: CalculateCesantiasDto,
  ): Promise<CesantiasCalculateForYearResult> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.cesantiasService.calculateForYear(tenantId, body.year, user?.sub);
  }

  @ApiOperation({ summary: 'Listar liquidaciones de cesantías (paginado)' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: ListCesantiasQueryDto,
  ): Promise<CesantiasListResponse> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const { items, total } = await this.cesantiasService.listByYear(tenantId, query.year, {
      limit: query.limit,
      offset: query.offset,
    });
    return { items, total, limit: query.limit ?? 50, offset: query.offset ?? 0 };
  }

  @ApiOperation({ summary: 'Detalle de una liquidación de cesantías' })
  @ApiResponse({ status: 200 })
  @Get(':id')
  async detail(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Param('id') id: string,
  ): Promise<CesantiasLiquidationRecord> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.cesantiasService.getDetail(tenantId, id);
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
