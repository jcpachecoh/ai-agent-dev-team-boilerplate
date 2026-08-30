import type { RecipeCategory } from '@prisma/client';

export interface IRecipeCategoriesRepository {
  findAll(tenantId: string, isActive?: boolean): Promise<RecipeCategory[]>;
  findOne(tenantId: string, id: string): Promise<RecipeCategory | null>;
  create(tenantId: string, data: { nombre: string; descripcion?: string }): Promise<RecipeCategory>;
  update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<RecipeCategory>;
  remove(tenantId: string, id: string): Promise<void>;
}

export interface IRecipeCategoriesService {
  findAll(tenantId: string, isActive?: boolean): Promise<RecipeCategory[]>;
  findOne(tenantId: string, id: string): Promise<RecipeCategory>;
  create(tenantId: string, data: { nombre: string; descripcion?: string }): Promise<RecipeCategory>;
  update(
    tenantId: string,
    id: string,
    data: { nombre?: string; descripcion?: string; isActive?: boolean },
  ): Promise<RecipeCategory>;
  remove(tenantId: string, id: string): Promise<void>;
}
