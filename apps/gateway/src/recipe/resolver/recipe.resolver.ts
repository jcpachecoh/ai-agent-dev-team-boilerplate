import {
  Resolver,
  Query,
  Mutation,
  Args,
  ObjectType,
  Field,
  InputType,
  ID,
  Float,
  Int,
  Subscription,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { RecipeService } from '../service/recipe.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import type { Recipe } from '../interfaces/recipe.interfaces';
import { PUB_SUB } from '../../pubsub/pubsub.module';

@ObjectType('RecipePhase')
export class RecipePhaseType {
  @Field() name!: string;
  @Field(() => Int) order!: number;
  @Field(() => [String]) steps!: string[];
}

@ObjectType('Recipe')
export class RecipeType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
  @Field(() => String, { nullable: true }) description?: string | null;
  @Field() tenantId!: string;
  @Field(() => [RecipePhaseType]) phases!: RecipePhaseType[];
  @Field(() => Float, { nullable: true }) yieldAmount?: number | null;
  @Field(() => String, { nullable: true }) yieldUnit?: string | null;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class RecipePhaseInputDto {
  @Field() name!: string;
  @Field(() => Int) order!: number;
  @Field(() => [String], { nullable: true }) steps?: string[];
}

@InputType()
export class CreateRecipeInputDto {
  @Field() name!: string;
  @Field(() => String, { nullable: true }) description?: string;
  @Field(() => [RecipePhaseInputDto], { nullable: true }) phases?: RecipePhaseInputDto[];
  @Field(() => Float, { nullable: true }) yieldAmount?: number;
  @Field(() => String, { nullable: true }) yieldUnit?: string;
}

@Resolver(() => RecipeType)
export class RecipeResolver {
  constructor(
    private readonly recipeService: RecipeService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => [RecipeType])
  async recipes(
    @CurrentUser() user: JwtPayload,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Recipe[]> {
    return this.recipeService.findAll(user.tenantId, { limit, offset });
  }

  @Query(() => RecipeType, { nullable: true })
  async recipe(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Recipe | null> {
    try {
      return await this.recipeService.findById(id, user.tenantId);
    } catch {
      return null;
    }
  }

  @Mutation(() => RecipeType)
  async createRecipe(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateRecipeInputDto,
  ): Promise<Recipe> {
    const recipe = await this.recipeService.create(user.tenantId, input);
    await this.pubSub.publish('recipeUpdated', { recipeUpdated: recipe });
    return recipe;
  }

  @Subscription(() => RecipeType)
  recipeUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterableIterator('recipeUpdated');
  }
}
