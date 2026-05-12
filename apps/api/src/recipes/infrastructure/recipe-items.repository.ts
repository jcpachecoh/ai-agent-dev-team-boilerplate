import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { IRecipeItemsRepository } from '../application/recipe-cost.service';

@Injectable()
export class RecipeItemsRepository implements IRecipeItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByRecipeForTenant(tenantId: string, recipeId: string) {
    return this.prisma.recipeItem.findMany({
      where: { recipeId, tenantId },
      include: {
        supplyItem: true,
      },
    });
  }

  async findRecipeIdsUsingSupplyItem(tenantId: string, supplyItemId: string) {
    const items = await this.prisma.recipeItem.findMany({
      where: { supplyItemId, tenantId },
      select: { recipeId: true },
    });
    return [...new Set(items.map((i) => i.recipeId))];
  }

  async create(tenantId: string, recipeId: string, data: any) {
    return this.prisma.recipeItem.create({
      data: {
        ...data,
        recipeId,
        tenantId,
      },
    });
  }

  async supplyItemExistsForTenant(tenantId: string, supplyItemId: string) {
    const item = await this.prisma.supplyItem.findFirst({
      where: { id: supplyItemId, tenantId },
    });
    return !!item;
  }
}
