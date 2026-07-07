import { Injectable } from '@nestjs/common';
import type { RecipeCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { IRecipeCategoriesRepository } from '../interfaces/recipe-categories.interfaces';

@Injectable()
export class RecipeCategoriesRepository implements IRecipeCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, isActive?: boolean): Promise<RecipeCategory[]> {
    return this.prisma.recipeCategory.findMany({
      where: {
        tenantId,
        ...(isActive != null ? { isActive } : {}),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  findOne(tenantId: string, id: string): Promise<RecipeCategory | null> {
    return this.prisma.recipeCategory.findFirst({ where: { id, tenantId } });
  }

  create(
    tenantId: string,
    data: { nombre: string; descripcion?: string },
  ): Promise<RecipeCategory> {
    return this.prisma.recipeCategory.create({
      data: {
        tenantId,
        nombre: data.nombre,
        descripcion: data.descripcion,
      },
    });
  }

  update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<RecipeCategory> {
    return this.prisma.recipeCategory.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.recipeCategory.deleteMany({ where: { id, tenantId } });
  }
}
