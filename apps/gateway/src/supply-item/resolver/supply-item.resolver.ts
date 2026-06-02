import { Resolver, Query, Args, ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { SupplyItem } from '@prisma/client';
import { SupplyItemService } from '../service/supply-item.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';

@ObjectType('SupplyItem')
export class SupplyItemType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field() nombre!: string;
  @Field() codigoInterno!: string;
  @Field() unidadBase!: string;
  @Field() isActive!: boolean;
}

@Resolver(() => SupplyItemType)
export class SupplyItemResolver {
  constructor(private readonly supplyItemService: SupplyItemService) {}

  @Query(() => [SupplyItemType])
  async supplyItems(
    @CurrentUser() user: JwtPayload,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<SupplyItem[]> {
    return this.supplyItemService.findAll(user.tenantId, { search, limit });
  }
}
