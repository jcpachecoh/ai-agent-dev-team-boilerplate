import { Args, Context, Field, ID, Mutation, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { PurchaseOrderService } from '../service/purchase-order.service';
import type { PurchaseOrder } from '../interfaces/purchase-order.interfaces';

@ObjectType('PurchaseOrder')
export class PurchaseOrderType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field() status!: string;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@Resolver(() => PurchaseOrderType)
export class PurchaseOrderResolver {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  private getTenantId(context: { req?: { headers?: Record<string, unknown> } }): string {
    const tenantId = context.req?.headers?.['x-tenant-id'];
    if (typeof tenantId !== 'string' || !tenantId.trim()) {
      throw new Error('x-tenant-id header is required');
    }
    return tenantId.trim();
  }

  @Query(() => [PurchaseOrderType])
  purchaseOrders(
    @Context() context: { req: { headers: Record<string, unknown> } },
  ): Promise<PurchaseOrder[]> {
    return this.purchaseOrderService.findAll(this.getTenantId(context));
  }

  @Query(() => PurchaseOrderType, { nullable: true })
  purchaseOrder(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PurchaseOrder | null> {
    return this.purchaseOrderService.findById(id, this.getTenantId(context));
  }

  @Mutation(() => PurchaseOrderType)
  createPurchaseOrder(
    @Context() context: { req: { headers: Record<string, unknown> } },
  ): Promise<never> {
    return this.purchaseOrderService.create(this.getTenantId(context), {});
  }
}
