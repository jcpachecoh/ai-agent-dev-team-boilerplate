import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { RecipesService } from '../application/recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { AddRecipeItemDto } from './dto/add-recipe-item.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // Helper to extract tenantId from headers
  // TEMPORARY: This is a placeholder until a real Auth/TenantResolver context exists.
  private getTenantId(headers: any): string {
    const tenantId = headers['x-tenant-id'];
    if (!tenantId) {
      throw new UnauthorizedException('Missing X-Tenant-Id header');
    }
    return tenantId;
  }

  @Post()
  async create(@Headers() headers: any, @Body() dto: CreateRecipeDto) {
    const tenantId = this.getTenantId(headers);
    return this.recipesService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Headers() headers: any) {
    const tenantId = this.getTenantId(headers);
    return this.recipesService.findAll(tenantId);
  }

  @Patch(':id')
  async update(@Headers() headers: any, @Param('id') id: string, @Body() dto: UpdateRecipeDto) {
    const tenantId = this.getTenantId(headers);
    return this.recipesService.update(tenantId, id, dto);
  }

  @Post(':id/items')
  async addItem(@Headers() headers: any, @Param('id') id: string, @Body() dto: AddRecipeItemDto) {
    const tenantId = this.getTenantId(headers);
    return this.recipesService.addItem(tenantId, id, dto);
  }
}
