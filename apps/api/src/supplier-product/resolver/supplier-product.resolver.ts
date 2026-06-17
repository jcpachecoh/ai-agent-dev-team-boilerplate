import {
  Context,
  Args,
  ID,
  Float,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Field,
  InputType,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { SupplierProduct } from '@prisma/client';
import { SupplierProductService } from '../service/supplier-product.service';
import type { SupplierProductWithSupplyItem } from '../interfaces/supplier-product.interfaces';
import { SupplyItemType } from '../../supplyitems/resolver/supplyitems.resolver';

@ObjectType('SupplierProduct')
export class SupplierProductType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) supplierId!: string;
  @Field(() => ID) supplyItemId!: string;
  @Field(() => Float) precioUnitario!: number;
  @Field() unidadCompra!: string;
  @Field(() => Float) factorConversion!: number;
  @Field(() => Int) tiempoEntregaDias!: number;
  @Field() esProveedorPrincipal!: boolean;
  @Field(() => SupplyItemType) supplyItem!: SupplyItemType;
  @Field(() => Float, { nullable: true }) precioAnterior?: number | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class CreateSupplierProductInputDto {
  @Field(() => ID) supplierId!: string;
  @Field(() => ID) supplyItemId!: string;
  @Field(() => Float) precioUnitario!: number;
  @Field() unidadCompra!: string;
  @Field(() => Float) factorConversion!: number;
  @Field(() => Int, { nullable: true }) tiempoEntregaDias?: number;
  @Field(() => Boolean, { nullable: true }) esProveedorPrincipal?: boolean;
}

@InputType()
export class UpdateSupplierProductInputDto {
  @Field(() => Float, { nullable: true }) precioUnitario?: number;
  @Field(() => String, { nullable: true }) unidadCompra?: string;
  @Field(() => Float, { nullable: true }) factorConversion?: number;
  @Field(() => Int, { nullable: true }) tiempoEntregaDias?: number;
  @Field(() => Boolean, { nullable: true }) esProveedorPrincipal?: boolean;
}

@Resolver(() => SupplierProductType)
export class SupplierProductResolver {
  constructor(private readonly supplierProductService: SupplierProductService) {}

  private getTenantId(context: { req?: { headers?: Record<string, unknown> } }): string {
    const tenantId = context.req?.headers?.['x-tenant-id'];
    if (typeof tenantId !== 'string' || !tenantId.trim()) {
      throw new Error('x-tenant-id header is required');
    }
    return tenantId.trim();
  }

  @Query(() => [SupplierProductType])
  supplierProducts(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('supplierId', { type: () => ID }) supplierId: string,
  ): Promise<SupplierProductWithSupplyItem[]> {
    return this.supplierProductService.findBySupplierId(this.getTenantId(context), supplierId);
  }

  @Mutation(() => SupplierProductType)
  createSupplierProduct(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('input') input: CreateSupplierProductInputDto,
  ): Promise<SupplierProductWithSupplyItem> {
    return this.supplierProductService.create(this.getTenantId(context), input);
  }

  @Mutation(() => SupplierProductType)
  updateSupplierProduct(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSupplierProductInputDto,
  ): Promise<SupplierProductWithSupplyItem> {
    return this.supplierProductService.update(id, this.getTenantId(context), input);
  }

  @Mutation(() => Boolean)
  deleteSupplierProduct(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.supplierProductService.delete(id, this.getTenantId(context));
  }

  @ResolveField(() => Float, { nullable: true })
  precioAnterior(@Parent() product: SupplierProductWithSupplyItem): Promise<number | null> {
    return this.supplierProductService.getPreviousPrice(product.tenantId, product.supplyItemId);
  }
}
