import { Body, Controller, Get, Headers, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  InventoryAlertDto,
  InventoryAlertSummaryDto,
  InventoryResolvedAlertPageDto,
} from './dto/inventory-alert.dto';
import { ResolveInventoryAlertDto } from './dto/inventory-alert.dto';
import { InventoryDashboardDto } from './dto/inventory-dashboard.dto';
import { InventoryReportDto } from './dto/inventory-report.dto';
import { InventoryService } from '../service/inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Inventory dashboard aggregates' })
  @ApiResponse({ status: 200, type: InventoryDashboardDto })
  @Get('dashboard')
  getDashboard(@Headers('x-tenant-id') tenantId: string): Promise<InventoryDashboardDto> {
    return this.inventoryService.getDashboard(tenantId);
  }

  @ApiOperation({ summary: 'Low-stock alerts derived from supply items' })
  @Get('alerts')
  async getAlerts(@Headers('x-tenant-id') tenantId: string): Promise<InventoryAlertDto[]> {
    return this.inventoryService.getAlerts(tenantId);
  }

  @ApiOperation({ summary: 'Alert summary counts' })
  @Get('alerts/summary')
  async getAlertSummary(
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<InventoryAlertSummaryDto> {
    const alerts = await this.inventoryService.getAlerts(tenantId);
    return this.inventoryService.getAlertSummary(alerts, tenantId);
  }

  @ApiOperation({ summary: 'Resolved alert history with pagination metadata' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @Get('alerts/resolved')
  getResolvedAlerts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ): Promise<InventoryResolvedAlertPageDto> {
    return this.inventoryService.getResolvedAlerts(
      tenantId,
      cursor,
      take ? Number(take) : undefined,
    );
  }

  @ApiOperation({ summary: 'Resolve alert — persists to InventoryAlertResolution' })
  @Patch('alerts/:id/resolve')
  async resolveAlert(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: ResolveInventoryAlertDto,
  ): Promise<{ ok: true }> {
    // resolvedById is null — this controller uses x-tenant-id header only (no JWT auth)
    await this.inventoryService.resolveAlert(id, tenantId, undefined, body.note);
    return { ok: true };
  }

  @ApiOperation({ summary: 'Inventory reports by category or valuation' })
  @ApiResponse({ status: 200, type: InventoryReportDto })
  @Get('reports')
  getReport(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') type = 'category',
  ): Promise<InventoryReportDto> {
    return this.inventoryService.getReport(tenantId, type);
  }

  @ApiOperation({ summary: 'Stock by site placeholder until warehouse module' })
  @Get('products/:productId/stock-by-site')
  stockBySite(): [] {
    return [];
  }

  @ApiOperation({ summary: 'Product movements placeholder' })
  @Get('products/:productId/movements')
  productMovements(): [] {
    return [];
  }
}
