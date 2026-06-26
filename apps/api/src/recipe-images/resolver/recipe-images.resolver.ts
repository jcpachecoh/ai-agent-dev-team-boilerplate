import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RecipeImagesService } from '../service/recipe-images.service';
import { AddRecipeImageInput, RecipeImageType, UpdateRecipeImageInput } from './dto';

@UseGuards(JwtAuthGuard)
@Resolver(() => RecipeImageType)
export class RecipeImagesResolver {
  constructor(private readonly recipeImagesService: RecipeImagesService) {}

  @Query(() => [RecipeImageType], { name: 'recipeImages' })
  recipeImages(
    @CurrentUser() user: JwtPayload,
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('includeInactive', { type: () => Boolean, nullable: true }) includeInactive?: boolean,
  ) {
    return this.recipeImagesService.listByRecipe(user.tenantId, recipeId, includeInactive);
  }

  @Mutation(() => RecipeImageType, { name: 'addRecipeImage' })
  addRecipeImage(@CurrentUser() user: JwtPayload, @Args('input') input: AddRecipeImageInput) {
    return this.recipeImagesService.add(user.tenantId, input);
  }

  @Mutation(() => RecipeImageType, { name: 'updateRecipeImage' })
  updateRecipeImage(@CurrentUser() user: JwtPayload, @Args('input') input: UpdateRecipeImageInput) {
    const { id, ...data } = input;
    return this.recipeImagesService.update(user.tenantId, id, data);
  }

  @Mutation(() => RecipeImageType, { name: 'deactivateRecipeImage' })
  deactivateRecipeImage(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.recipeImagesService.deactivate(user.tenantId, id);
  }
}
