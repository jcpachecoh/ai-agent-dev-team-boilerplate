import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { RecipeCategory } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { IRecipeCategoriesService } from '../interfaces/recipe-categories.interfaces';
import { RecipeCategoriesRepository } from '../repository/recipe-categories.repository';

@Injectable()
export class RecipeCategoriesService implements IRecipeCategoriesService {
  constructor(private readonly repository: RecipeCategoriesRepository) {}

  findAll(tenantId: string, isActive?: boolean): Promise<RecipeCategory[]> {
    return this.repository.findAll(tenantId, isActive);
  }

  async findOne(tenantId: string, id: string): Promise<RecipeCategory> {
    const category = await this.repository.findOne(tenantId, id);
    if (!category) {
      throw new NotFoundException(`RecipeCategory ${id} not found`);
    }
    return category;
  }

  async create(
    tenantId: string,
    data: { nombre: string; descripcion?: string },
  ): Promise<RecipeCategory> {
    try {
      return await this.repository.create(tenantId, data);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<RecipeCategory> {
    await this.findOne(tenantId, id);

    try {
      return await this.repository.update(tenantId, id, data);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.findOne(tenantId, id);
    await this.repository.remove(tenantId, id);
  }

  private rethrowUnique(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Category name already exists for this tenant');
    }
  }
}
