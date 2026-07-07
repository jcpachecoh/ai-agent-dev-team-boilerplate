import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRecipeCategoryDto } from './dto/create-recipe-category.dto';
import { UpdateRecipeCategoryDto } from './dto/update-recipe-category.dto';
import { RecipeCategoriesService } from '../service/recipe-categories.service';

class ListRecipeCategoriesQueryDto {
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@ApiTags('recipe-categories')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@Controller('recipe-categories')
export class RecipeCategoriesController {
  constructor(private readonly service: RecipeCategoriesService) {}

  @ApiOperation({ summary: 'List recipe categories' })
  @Get()
  findAll(@Headers('x-tenant-id') tenantId: string, @Query() query: ListRecipeCategoriesQueryDto) {
    return this.service.findAll(tenantId, query.isActive);
  }

  @ApiOperation({ summary: 'Create recipe category' })
  @ApiResponse({ status: 201 })
  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Body() body: CreateRecipeCategoryDto) {
    return this.service.create(tenantId, body);
  }

  @ApiOperation({ summary: 'Update recipe category' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: UpdateRecipeCategoryDto,
  ) {
    return this.service.update(tenantId, id, body);
  }

  @ApiOperation({ summary: 'Delete recipe category' })
  @ApiResponse({ status: 204 })
  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-tenant-id') tenantId: string) {
    return this.service.remove(tenantId, id);
  }
}
