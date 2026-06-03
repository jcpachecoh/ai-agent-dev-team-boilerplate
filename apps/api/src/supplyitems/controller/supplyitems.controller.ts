import { Controller, Get, Headers, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { SupplyItem } from '@prisma/client';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { SupplyItemsService } from '../service/supplyitems.service';

@ApiTags('supplyitems')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(PermissionsGuard)
@Controller('supply-items')
export class SupplyItemsController {
  constructor(private readonly supplyItemsService: SupplyItemsService) {}

  @RequirePermission('supply.items.read')
  @ApiOperation({ summary: 'List supply items' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Supply items list' })
  @Get()
  findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): Promise<SupplyItem[]> {
    const parsedLimit = limit !== undefined ? Number(limit) : undefined;
    return this.supplyItemsService.findAll(tenantId, {
      search,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });
  }

  @RequirePermission('supply.items.read')
  @ApiOperation({ summary: 'Get a supply item by ID' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, description: 'Supply item found' })
  @ApiResponse({ status: 404, description: 'Supply item not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string): Promise<SupplyItem> {
    return this.supplyItemsService.findOne(tenantId, id);
  }
}
