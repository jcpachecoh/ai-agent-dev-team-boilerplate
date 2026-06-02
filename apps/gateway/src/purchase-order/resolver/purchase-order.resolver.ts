import { Resolver, Query, Mutation, Args, ObjectType, Field, ID } from '@nestjs/graphql';
import { PurchaseOrderService } from '../service/purchase-order.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
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

  @Query(() => [PurchaseOrderType])
  async purchaseOrders(@CurrentUser() user: JwtPayload): Promise<PurchaseOrder[]> {
    return this.purchaseOrderService.findAll(user.tenantId);
  }

  @Query(() => PurchaseOrderType, { nullable: true })
  async purchaseOrder(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PurchaseOrder | null> {
    return this.purchaseOrderService.findById(id, user.tenantId);
  }

  @Mutation(() => PurchaseOrderType)
  async createPurchaseOrder(@CurrentUser() _user: JwtPayload): Promise<never> {
    return this.purchaseOrderService.create('', {});
  }
}
