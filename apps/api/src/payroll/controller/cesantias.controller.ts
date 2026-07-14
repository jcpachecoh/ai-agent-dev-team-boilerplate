import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { CesantiasExportFileResult } from '../interfaces/cesantias-export.interfaces';
import type { CesantiasCalculateForYearResult } from '../interfaces/cesantias-service.interfaces';
import type { CesantiasLiquidationRecord } from '../interfaces/cesantias.interfaces';
import { CesantiasExportService } from '../service/cesantias-export.service';
import { CesantiasService } from '../service/cesantias.service';
import { CalculateCesantiasDto } from './dto/cesantias-calculate.dto';
import { ExportCesantiasDto } from './dto/cesantias-export.dto';
import { ListCesantiasQueryDto } from './dto/list-cesantias-query.dto';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// `type`, no `interface` — ver nota en employee-history.interfaces.ts.
type CesantiasListResponse = {
  items: CesantiasLiquidationRecord[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * OS-588 (fase 2) — endpoints mínimos: ejecutar cálculo anual, listar, detalle.
 * OS-588 (fase 3) — endpoints de exportación de archivos de consignación (FNA/fondos
 * privados), reutilizando únicamente liquidaciones ya calculadas. Sin alertas ni pagos
 * todavía (fuera de alcance). Reutiliza los guards/roles/DTOs de paginación del módulo
 * payroll — sin roles nuevos.
 */
@ApiTags('cesantias')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('cesantias')
export class CesantiasController {
  constructor(
    private readonly cesantiasService: CesantiasService,
    private readonly cesantiasExportService: CesantiasExportService,
  ) {}

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

  @ApiOperation({ summary: 'Exportar archivo de consignación de cesantías — FNA' })
  @ApiProduces(XLSX_CONTENT_TYPE)
  @ApiResponse({ status: 201 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post('export/fna')
  async exportFna(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: ExportCesantiasDto,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const file = await this.cesantiasExportService.generateFnaFile(tenantId, body.year, user?.sub);
    this.sendFile(res, file);
  }

  @ApiOperation({ summary: 'Exportar archivo de consignación de cesantías — fondos privados' })
  @ApiProduces(XLSX_CONTENT_TYPE)
  @ApiResponse({ status: 201 })
  @Roles(...PAYROLL_WRITE_ROLES)
  @Post('export/private-funds')
  async exportPrivateFunds(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: ExportCesantiasDto,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const file = await this.cesantiasExportService.generatePrivateFundsFile(
      tenantId,
      body.year,
      user?.sub,
    );
    this.sendFile(res, file);
  }

  /**
   * OS-588 (fase 3, revisión previa a commit) — la exportación nunca omite empleados en
   * silencio: `X-Cesantias-Export-Skipped-Count` siempre viaja en la respuesta (0 si no
   * hubo omisiones), y el detalle completo (employeeId + razón) queda tanto en el log de
   * auditoría (`CesantiasExportService`) como en el resultado del servicio, cubierto por
   * tests. No se pone el detalle completo en un header — un tenant con muchas omisiones
   * podría exceder límites de tamaño de header HTTP; el conteo sí es seguro en cualquier
   * escala y ya es suficiente señal de que algo se excluyó.
   */
  private sendFile(res: Response, file: CesantiasExportFileResult): void {
    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('X-Cesantias-Export-Skipped-Count', String(file.skipped.length));
    res.send(file.buffer);
  }

  private resolveTenantId(user: JwtPayload, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
