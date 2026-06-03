import { Inject } from '@nestjs/common';
import {
  Args,
  Context,
  Float,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Subscription,
  Field,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from '../../pubsub/pubsub.module';
import { RecipeService } from '../service/recipe.service';
import type { Recipe as RecipeModel } from '../interfaces/recipe.interfaces';

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

  private getTenantId(context: { req?: { headers?: Record<string, unknown> } }): string {
    const tenantId = context.req?.headers?.['x-tenant-id'];
    if (typeof tenantId !== 'string' || !tenantId.trim()) {
      throw new Error('x-tenant-id header is required');
    }
    return tenantId.trim();
  }

  @Query(() => [RecipeType])
  recipes(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<RecipeModel[]> {
    return this.recipeService.findAll(this.getTenantId(context), { limit, offset });
  }

  @Query(() => RecipeType, { nullable: true })
  async recipe(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<RecipeModel | null> {
    try {
      return await this.recipeService.findById(id, this.getTenantId(context));
    } catch {
      return null;
    }
  }

  @Mutation(() => RecipeType)
  async createRecipe(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('input') input: CreateRecipeInputDto,
  ): Promise<RecipeModel> {
    const recipe = await this.recipeService.create(this.getTenantId(context), input);
    await this.pubSub.publish('recipeUpdated', { recipeUpdated: recipe });
    return recipe;
  }

  @Subscription(() => RecipeType)
  recipeUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterableIterator('recipeUpdated');
  }
}
