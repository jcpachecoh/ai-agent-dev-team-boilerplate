import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  AddRecipeImageData,
  IRecipeImagesService,
  RecipeImageRecord,
  UpdateRecipeImageData,
} from '../interfaces/recipe-images.interfaces';
import { RecipeImagesRepository } from '../repository/recipe-images.repository';

const MAX_ACTIVE_IMAGES_PER_RECIPE = 10;

@Injectable()
export class RecipeImagesService implements IRecipeImagesService {
  constructor(private readonly repo: RecipeImagesRepository) {}

  async listByRecipe(
    tenantId: string,
    recipeId: string,
    includeInactive = false,
  ): Promise<RecipeImageRecord[]> {
    await this.assertRecipeExists(tenantId, recipeId);
    return this.repo.findByRecipeId(tenantId, recipeId, includeInactive);
  }

  async add(tenantId: string, data: AddRecipeImageData): Promise<RecipeImageRecord> {
    await this.assertRecipeExists(tenantId, data.recipeId);
    this.assertRequiredUploadFields(data);

    const activeCount = await this.repo.countActiveByRecipeId(tenantId, data.recipeId);
    if (activeCount >= MAX_ACTIVE_IMAGES_PER_RECIPE) {
      throw new ConflictException(
        `Recipe already has the maximum of ${MAX_ACTIVE_IMAGES_PER_RECIPE} active images`,
      );
    }

    return this.repo.create(tenantId, data);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateRecipeImageData,
  ): Promise<RecipeImageRecord> {
    const existing = await this.repo.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Recipe image "${id}" not found`);
    }

    if (data.isActive === true && !existing.isActive) {
      throw new BadRequestException('Reactivating recipe images is not supported');
    }

    return this.repo.update(tenantId, id, data);
  }

  async deactivate(tenantId: string, id: string): Promise<RecipeImageRecord> {
    const existing = await this.repo.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Recipe image "${id}" not found`);
    }

    if (!existing.isActive) {
      return existing;
    }

    return this.repo.deactivate(tenantId, id);
  }

  private async assertRecipeExists(tenantId: string, recipeId: string): Promise<void> {
    const exists = await this.repo.recipeExists(tenantId, recipeId);
    if (!exists) {
      throw new NotFoundException(`Recipe "${recipeId}" not found`);
    }
  }

  private assertRequiredUploadFields(data: AddRecipeImageData): void {
    if (!data.url?.trim()) {
      throw new BadRequestException('url is required');
    }
    if (!data.nameImage?.trim()) {
      throw new BadRequestException('nameImage is required');
    }
    if (!/^https?:\/\//i.test(data.url.trim())) {
      throw new BadRequestException('url must be a valid http(s) URL');
    }
  }
}
