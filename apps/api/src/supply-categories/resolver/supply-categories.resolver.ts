import { BadRequestException } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import type { Request } from 'express';
import type { SupplyCategory } from '@prisma/client';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SupplyCategoriesService } from '../service/supply-categories.service';
import { resolveCategoryPrefijo } from '../utils/derive-category-prefijo';

@ObjectType('SupplyCategory')
export class SupplyCategoryType {
  @Field(() => ID)
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  nombre!: string;

  @Field()
  prefijo!: string;

  @Field(() => String, { nullable: true })
  descripcion?: string | null;

  @Field()
  isActive!: boolean;
}

@InputType('CreateSupplyCategoryInput')
export class CreateSupplyCategoryInputDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  prefijo!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  descripcion?: string;
}

@InputType('UpdateSupplyCategoryInput')
export class UpdateSupplyCategoryInputDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nombre?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  prefijo?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@Resolver(() => SupplyCategoryType)
export class SupplyCategoriesResolver {
  constructor(private readonly service: SupplyCategoriesService) {}

  @ResolveField(() => String)
  prefijo(@Parent() category: SupplyCategory): string {
    return resolveCategoryPrefijo(category.nombre, category.prefijo);
  }

  @Query(() => [SupplyCategoryType], { name: 'supplyCategories' })
  supplyCategories(
    @Context() context: { req: Request },
    @Args('isActive', { type: () => Boolean, nullable: true }) isActive?: boolean,
  ): Promise<SupplyCategory[]> {
    return this.service.findAll(this.getTenantId(context.req), isActive ?? undefined);
  }

  @Mutation(() => SupplyCategoryType)
  createSupplyCategory(
    @Context() context: { req: Request },
    @Args('input') input: CreateSupplyCategoryInputDto,
  ): Promise<SupplyCategory> {
    return this.service.create(this.getTenantId(context.req), input);
  }

  @Mutation(() => SupplyCategoryType)
  updateSupplyCategory(
    @Context() context: { req: Request },
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSupplyCategoryInputDto,
  ): Promise<SupplyCategory> {
    return this.service.update(this.getTenantId(context.req), id, input);
  }

  @Mutation(() => Boolean)
  deleteSupplyCategory(
    @Context() context: { req: Request },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.remove(this.getTenantId(context.req), id).then(() => true);
  }

  private getTenantId(req: Request): string {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId || Array.isArray(tenantId)) {
      throw new BadRequestException('x-tenant-id header is required');
    }
    return tenantId;
  }
}
