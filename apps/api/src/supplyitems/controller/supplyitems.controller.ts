import { Controller, Get, Headers, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { SupplyItem } from '@prisma/client';
import { SupplyItemsService } from '../service/supplyitems.service';

@ApiTags('supplyitems')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('supply-items')
export class SupplyItemsController {
  constructor(private readonly supplyItemsService: SupplyItemsService) {}

  @ApiOperation({ summary: 'Get a supply item by ID' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, description: 'Supply item found' })
  @ApiResponse({ status: 404, description: 'Supply item not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string): Promise<SupplyItem> {
    return this.supplyItemsService.findOne(tenantId, id);
  }
}
