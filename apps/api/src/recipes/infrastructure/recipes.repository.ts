import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { IRecipesRepository } from '../application/recipe-cost.service';

@Injectable()
export class RecipesRepository implements IRecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdForTenant(tenantId: string, id: string) {
    return this.prisma.recipe.findFirst({
      where: { id, tenantId },
    });
  }

  async updateFoodCost(tenantId: string, id: string, foodCostActual: Decimal) {
    const result = await this.prisma.recipe.updateMany({
      where: { id, tenantId },
      data: { foodCostActual },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Recipe ${id} not found for tenant ${tenantId}`);
    }
  }

  async create(tenantId: string, data: any) {
    return this.prisma.recipe.create({
      data: {
        ...data,
        tenantId,
        foodCostActual: 0,
      },
    });
  }

  async findManyByTenant(tenantId: string) {
    return this.prisma.recipe.findMany({
      where: { tenantId },
      include: { items: true },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const result = await this.prisma.recipe.updateMany({
      where: { id, tenantId },
      data,
    });

    if (result.count === 0) {
      throw new NotFoundException(`Recipe ${id} not found for tenant ${tenantId}`);
    }

    return this.findByIdForTenant(tenantId, id);
  }

  async productExistsForTenant(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });
    return !!product;
  }
}
