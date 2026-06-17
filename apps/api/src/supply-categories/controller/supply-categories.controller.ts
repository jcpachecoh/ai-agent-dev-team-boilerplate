import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateSupplyCategoryDto } from './dto/create-supply-category.dto';
import { UpdateSupplyCategoryDto } from './dto/update-supply-category.dto';
import { SupplyCategoriesService } from '../service/supply-categories.service';
import { SupplyItemsService } from '../../supplyitems/service/supplyitems.service';

class ListCategoriesQueryDto {
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@ApiTags('supply-categories')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@Controller('supply-categories')
export class SupplyCategoriesController {
  constructor(
    private readonly service: SupplyCategoriesService,
    private readonly supplyItemsService: SupplyItemsService,
  ) {}

  @ApiOperation({ summary: 'List supply categories' })
  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string, @Query() query: ListCategoriesQueryDto) {
    return this.service.findAll(tenantId, query.isActive);
  }

  @ApiOperation({ summary: 'Create supply category' })
  @ApiResponse({ status: 201 })
  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: CreateSupplyCategoryDto) {
    return this.service.create(tenantId, body);
  }

  @ApiOperation({ summary: 'Next internal code for a supply category' })
  @Get(':id/next-codigo')
  getNextCodigo(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.supplyItemsService.getNextCodigoInterno(tenantId, id).then((codigoInterno) => ({
      codigoInterno,
    }));
  }

  @ApiOperation({ summary: 'Update supply category' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: UpdateSupplyCategoryDto,
  ) {
    return this.service.update(tenantId, id, body);
  }
}
