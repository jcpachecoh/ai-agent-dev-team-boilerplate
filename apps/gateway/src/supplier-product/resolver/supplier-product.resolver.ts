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
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { SupplierProduct } from '@prisma/client';
import { SupplierProductService } from '../service/supplier-product.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import type { SupplierProductWithSupplyItem } from '../interfaces/supplier-product.interfaces';
import { SupplyItemType } from '../../supply-item/resolver/supply-item.resolver';

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

  @Query(() => [SupplierProductType])
  async supplierProducts(
    @CurrentUser() user: JwtPayload,
    @Args('supplierId', { type: () => ID }) supplierId: string,
  ): Promise<SupplierProductWithSupplyItem[]> {
    return this.supplierProductService.findBySupplierId(user.tenantId, supplierId);
  }

  @Mutation(() => SupplierProductType)
  async createSupplierProduct(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateSupplierProductInputDto,
  ): Promise<SupplierProductWithSupplyItem> {
    return this.supplierProductService.create(user.tenantId, input);
  }

  @Mutation(() => SupplierProductType)
  async updateSupplierProduct(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSupplierProductInputDto,
  ): Promise<SupplierProductWithSupplyItem> {
    return this.supplierProductService.update(id, user.tenantId, input);
  }

  @Mutation(() => Boolean)
  async deleteSupplierProduct(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.supplierProductService.delete(id, user.tenantId);
  }

  @ResolveField(() => Float, { nullable: true })
  async precioAnterior(@Parent() product: SupplierProductWithSupplyItem): Promise<number | null> {
    return this.supplierProductService.getPreviousPrice(product.tenantId, product.supplyItemId);
  }
}
