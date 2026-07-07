import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { CreateSupplyItemDto } from '../dto/create-supply-item.dto';
import { ListSupplyItemsQueryDto } from '../dto/list-supply-items-query.dto';
import { PriceHistoryEntryDto } from '../dto/price-history-entry.dto';
import { SupplyItemResponseDto } from '../dto/supply-item-response.dto';
import { SupplyItemSupplierDto } from '../dto/supply-item-supplier.dto';
import { UpdateSupplyItemDto } from '../dto/update-supply-item.dto';
import { toSupplyItemResponse } from '../mapper/supply-item.mapper';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { INVENTORY_MODULE_ROLES } from '../../common/config/rbac.config';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SupplyItemsService } from '../service/supplyitems.service';

@ApiTags('supplyitems')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true, description: 'Tenant identifier' })
@UseGuards(PermissionsGuard, RolesGuard)
@Roles(...INVENTORY_MODULE_ROLES)
@Controller('supply-items')
export class SupplyItemsController {
  constructor(private readonly supplyItemsService: SupplyItemsService) {}

  @RequirePermission('supply.items.read')
  @ApiOperation({ summary: 'List supply items' })
  @ApiResponse({ status: 200, type: [SupplyItemResponseDto] })
  @Get()
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: ListSupplyItemsQueryDto,
  ): Promise<SupplyItemResponseDto[]> {
    const items = await this.supplyItemsService.findAll(tenantId, {
      search: query.search,
      categoriaId: query.categoriaId,
      codigoInterno: query.codigoInterno,
      isActive: query.isActive,
      limit: query.limit,
      offset: query.offset,
    });
    return items.map(toSupplyItemResponse);
  }

  @ApiOperation({ summary: 'Create supply item' })
  @ApiResponse({ status: 201, type: SupplyItemResponseDto })
  @Post()
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: CreateSupplyItemDto,
  ): Promise<SupplyItemResponseDto> {
    const item = await this.supplyItemsService.create(tenantId, body);
    return toSupplyItemResponse(item);
  }

  @ApiOperation({ summary: 'Suppliers linked to a supply item' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, type: [SupplyItemSupplierDto] })
  @Get(':id/suppliers')
  async findSuppliers(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<SupplyItemSupplierDto[]> {
    return this.supplyItemsService.findSuppliers(tenantId, id);
  }

  @ApiOperation({ summary: 'Price / cost history for a supply item' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, type: [PriceHistoryEntryDto] })
  @Get(':id/price-history')
  async findPriceHistory(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<PriceHistoryEntryDto[]> {
    const rows = await this.supplyItemsService.findPriceHistory(tenantId, id, { limit, offset });
    return rows.map((row) => ({
      id: row.id,
      costoAnterior: decimalToNumber(row.costoAnterior),
      costoNuevo: decimalToNumber(row.costoNuevo),
      cantidadRecibida: row.cantidadRecibida ? decimalToNumber(row.cantidadRecibida) : null,
      stockAnterior: row.stockAnterior ? decimalToNumber(row.stockAnterior) : null,
      stockNuevo: row.stockNuevo ? decimalToNumber(row.stockNuevo) : null,
      motivo: row.motivo,
      referenciaTipo: row.referenciaTipo,
      referenciaId: row.referenciaId,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  @RequirePermission('supply.items.read')
  @ApiOperation({ summary: 'Get a supply item by ID' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, type: SupplyItemResponseDto })
  @ApiResponse({ status: 404, description: 'Supply item not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<SupplyItemResponseDto> {
    const item = await this.supplyItemsService.findOne(tenantId, id);
    return toSupplyItemResponse(item);
  }

  @ApiOperation({ summary: 'Update supply item' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, type: SupplyItemResponseDto })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: UpdateSupplyItemDto,
  ): Promise<SupplyItemResponseDto> {
    const item = await this.supplyItemsService.update(tenantId, id, body);
    return toSupplyItemResponse(item);
  }

  @ApiOperation({ summary: 'Deactivate supply item (soft delete)' })
  @ApiParam({ name: 'id', description: 'Supply item ID' })
  @ApiResponse({ status: 200, type: SupplyItemResponseDto })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
  ): Promise<SupplyItemResponseDto> {
    const item = await this.supplyItemsService.deactivate(tenantId, id);
    return toSupplyItemResponse(item);
  }
}
