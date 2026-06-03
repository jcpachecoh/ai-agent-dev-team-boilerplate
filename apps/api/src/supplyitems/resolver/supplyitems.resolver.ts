import { BadRequestException, UseGuards } from '@nestjs/common';
import { Args, Context, Field, ID, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import type { SupplyItem } from '@prisma/client';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { SupplyItemsService } from '../service/supplyitems.service';

@ObjectType('SupplyItem')
export class SupplyItemType {
  @Field(() => ID)
  id!: string;

  @Field()
  tenantId!: string;

  @Field()
  nombre!: string;

  @Field()
  codigoInterno!: string;

  @Field()
  unidadBase!: string;

  @Field()
  isActive!: boolean;
}

@UseGuards(PermissionsGuard)
@Resolver(() => SupplyItemType)
export class SupplyItemsResolver {
  constructor(private readonly supplyItemsService: SupplyItemsService) {}

  @RequirePermission('supply.items.read')
  @Query(() => [SupplyItemType])
  async supplyItems(
    @Context() context: { req: Request },
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<SupplyItem[]> {
    const tenantId = this.getTenantId(context.req);
    return this.supplyItemsService.findAll(tenantId, { search, limit });
  }

  private getTenantId(req: Request): string {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId || Array.isArray(tenantId)) {
      throw new BadRequestException('x-tenant-id header is required');
    }
    return tenantId;
  }
}
