import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  AddRecipeImageData,
  IRecipeImagesRepository,
  RecipeImageRecord,
  UpdateRecipeImageData,
} from '../interfaces/recipe-images.interfaces';

@Injectable()
export class RecipeImagesRepository implements IRecipeImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByRecipeId(
    tenantId: string,
    recipeId: string,
    includeInactive = false,
  ): Promise<RecipeImageRecord[]> {
    return this.prisma.recipeImage.findMany({
      where: {
        tenantId,
        recipeId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findById(tenantId: string, id: string): Promise<RecipeImageRecord | null> {
    return this.prisma.recipeImage.findFirst({
      where: { id, tenantId },
    });
  }

  countActiveByRecipeId(tenantId: string, recipeId: string): Promise<number> {
    return this.prisma.recipeImage.count({
      where: { tenantId, recipeId, isActive: true },
    });
  }

  recipeExists(tenantId: string, recipeId: string): Promise<boolean> {
    return this.prisma.productionRecipe
      .findFirst({
        where: { id: recipeId, tenantId, isActive: true },
        select: { id: true },
      })
      .then((row) => Boolean(row));
  }

  create(tenantId: string, data: AddRecipeImageData): Promise<RecipeImageRecord> {
    return this.prisma.recipeImage.create({
      data: {
        tenantId,
        recipeId: data.recipeId,
        alt: data.alt ?? null,
        nameImage: data.nameImage,
        url: data.url,
        storageObjectId: data.storageObjectId ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  update(tenantId: string, id: string, data: UpdateRecipeImageData): Promise<RecipeImageRecord> {
    return this.prisma.recipeImage.update({
      where: { id },
      data,
    });
  }

  deactivate(tenantId: string, id: string): Promise<RecipeImageRecord> {
    return this.prisma.recipeImage.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
