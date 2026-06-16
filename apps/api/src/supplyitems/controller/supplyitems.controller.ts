import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiCreatedResponse,
  ApiHeader,
} from '@nestjs/swagger';
import type { SupplyItem, SupplyItemPriceHistory } from '@prisma/client';
import { SupplyItemsService } from '../service/supplyitems.service';
import { CreateSupplyItemDto } from './dto/create-supplyitem.dto';
import { UpdateSupplyItemDto } from './dto/update-supplyitem.dto';
import type { SupplierWithProductInfo } from '../interfaces/supplyitems.interfaces';

@ApiTags('supplyitems')
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@Controller('supply-items')
export class SupplyItemsController {
  constructor(private readonly supplyItemsService: SupplyItemsService) {}

  @ApiOperation({ summary: 'List all supply items' })
  @ApiResponse({ status: 200, description: 'Array of supply items' })
  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string): Promise<SupplyItem[]> {
    return this.supplyItemsService.findAll(tenantId);
  }

  @ApiOperation({ summary: 'Get a supply item by ID' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, description: 'Supply item found' })
  @ApiResponse({ status: 404, description: 'Supply item not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string): Promise<SupplyItem> {
    return this.supplyItemsService.findOne(tenantId, id);
  }

  @ApiOperation({ summary: 'Create a new supply item' })
  @ApiCreatedResponse({ description: 'Supply item created' })
  @ApiResponse({ status: 409, description: 'Internal code already taken' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateSupplyItemDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<SupplyItem> {
    return this.supplyItemsService.create(tenantId, dto);
  }

  @ApiOperation({ summary: 'Update an existing supply item' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, description: 'Supply item updated' })
  @ApiResponse({ status: 404, description: 'Supply item not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplyItemDto,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<SupplyItem> {
    return this.supplyItemsService.update(tenantId, id, dto);
  }

  @ApiOperation({ summary: 'Deactivate/Delete a supply item' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, description: 'Supply item deleted' })
  @ApiResponse({ status: 404, description: 'Supply item not found' })
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string): Promise<SupplyItem> {
    return this.supplyItemsService.remove(tenantId, id);
  }

  @ApiOperation({ summary: 'Get suppliers for a supply item' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, description: 'Array of suppliers' })
  @Get(':id/suppliers')
  findSuppliers(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<SupplierWithProductInfo[]> {
    return this.supplyItemsService.findSuppliers(tenantId, id);
  }

  @ApiOperation({ summary: 'Get price history for a supply item' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, description: 'Array of price history records' })
  @ApiResponse({ status: 404, description: 'Supply item not found' })
  @Get(':id/price-history')
  findPriceHistory(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<SupplyItemPriceHistory[]> {
    return this.supplyItemsService.findPriceHistory(tenantId, id);
  }
}
