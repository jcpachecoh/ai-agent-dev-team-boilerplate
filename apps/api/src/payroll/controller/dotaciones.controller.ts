import { Controller, Get, Query, Res, UseGuards, BadRequestException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DotacionStatus } from '@prisma/client';
import { Response } from 'express';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { ComplianceReportRow } from '../interfaces/dotaciones.interfaces';
import { DotacionesService } from '../service/dotaciones.service';

@ApiTags('dotaciones')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Controller('dotaciones')
export class DotacionesController {
  constructor(private readonly dotacionesService: DotacionesService) {}

  @ApiOperation({ summary: 'Export dotación compliance report as CSV' })
  @ApiQuery({ name: 'period', required: true, example: '2026-04' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiResponse({ status: 200, description: 'CSV file' })
  @Get('report')
  async exportReport(
    @CurrentUser() user: JwtPayload,
    @Query('period') period: string,
    @Query('locationId') locationId: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (!period) {
      throw new BadRequestException('El parámetro period es requerido');
    }

    const tenantId = (user as JwtPayload & { tenantId: string }).tenantId;
    const rows = await this.dotacionesService.getComplianceReport(tenantId, period, locationId);

    const csv = buildCsv(rows);
    const filename = `reporte-dotacion-${period}${locationId ? `-${locationId}` : ''}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csv); // BOM for Excel UTF-8 compatibility
  }
}

function buildCsv(rows: ComplianceReportRow[]): string {
  const header = [
    'Empleado ID',
    'Nombre Empleado',
    'Sede',
    'Período',
    'Ítem Entregado',
    'Talla',
    'Cantidad',
    'Estado',
    'Fecha Entrega',
    'Comprobante URL',
  ].join(',');

  const statusLabel: Record<DotacionStatus, string> = {
    PENDIENTE: 'Pendiente',
    ENTREGADA: 'Entregada',
    NO_APLICA: 'No Aplica',
  };

  const dataRows = rows.map((r) =>
    [
      r.employeeId,
      csvEscape(r.employeeName),
      csvEscape(r.locationName),
      r.period,
      csvEscape(r.supplyItemName ?? ''),
      csvEscape(r.talla ?? ''),
      r.quantity,
      statusLabel[r.status],
      r.deliveredAt ? r.deliveredAt.toISOString().split('T')[0] : '',
      csvEscape(r.signedReceiptUrl ?? ''),
    ].join(','),
  );

  return [header, ...dataRows].join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
