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
import { StockUnit, SupplierProduct } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
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

@InputType('CreateSupplierProductInput')
export class CreateSupplierProductInputDto {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  supplierId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  supplyItemId!: string;

  @Field(() => Float)
  @IsNumber()
  precioUnitario!: number;

  @Field(() => StockUnit)
  @IsEnum(StockUnit)
  unidadCompra!: StockUnit;

  @Field(() => Float)
  @IsNumber()
  factorConversion!: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  tiempoEntregaDias?: number;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  esProveedorPrincipal?: boolean;
}

@InputType('UpdateSupplierProductInput')
export class UpdateSupplierProductInputDto {
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  precioUnitario?: number;

  @Field(() => StockUnit, { nullable: true })
  @IsEnum(StockUnit)
  @IsOptional()
  unidadCompra?: StockUnit;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  factorConversion?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  tiempoEntregaDias?: number;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  esProveedorPrincipal?: boolean;
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
    const tenantId = this.getTenantId(context);
    return this.supplierProductService.create(tenantId, input);
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
