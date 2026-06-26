import { BadRequestException, UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  Float,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { StockUnit } from '@prisma/client';
import type { Request } from 'express';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { INVENTORY_MODULE_ROLES } from '../../common/config/rbac.config';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { decimalToNumber } from '../../common/utils/decimal.util';
import { SupplyCategoryType } from '../../supply-categories/resolver/supply-categories.resolver';
import { resolveCategoryPrefijo } from '../../supply-categories/utils/derive-category-prefijo';
import type {
  CreateSupplyItemData,
  UpdateSupplyItemData,
} from '../interfaces/supplyitems.interfaces';
import type { SupplyItemWithRelations } from '../mapper/supply-item.mapper';
import { SupplyItemsService } from '../service/supplyitems.service';

registerEnumType(StockUnit, { name: 'StockUnit' });

@ObjectType('ProveedorPrincipal')
export class ProveedorPrincipalType {
  @Field(() => ID)
  supplierId!: string;

  @Field()
  razonSocial!: string;
}

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

  @Field(() => ID)
  categoriaId!: string;

  @Field(() => SupplyCategoryType, { nullable: true })
  categoria?: SupplyCategoryType;

  @Field(() => String, { nullable: true })
  descripcion?: string | null;

  @Field(() => StockUnit)
  unidadBase!: StockUnit;

  @Field(() => Float)
  factorConversion!: number;

  @Field(() => Float)
  costoPromedioPonderado!: number;

  @Field(() => Float)
  stockMinimoBodega!: number;

  @Field(() => Float)
  stockMaximoBodega!: number;

  @Field(() => Float)
  stockActualBodega!: number;

  @Field()
  aplicaVencimiento!: boolean;

  @Field()
  aplicaLote!: boolean;

  @Field(() => Date, { nullable: true })
  fechaVencimiento?: Date | null;

  @Field(() => String, { nullable: true })
  lote?: string | null;

  @Field(() => ID, { nullable: true })
  locationId?: string | null;

  @Field(() => String, { nullable: true })
  ubicacion?: string | null;
  @Field(() => String, { nullable: true })
  subcategoria?: string | null;

  @Field(() => String, { nullable: true })
  genero?: string | null;

  @Field(() => String, { nullable: true })
  talla?: string | null;

  @Field()
  isActive!: boolean;

  @Field(() => ProveedorPrincipalType, { nullable: true })
  proveedorPrincipal?: ProveedorPrincipalType | null;

  @Field(() => Float, { nullable: true })
  stockDisponible?: number | null;
}

@ObjectType('SupplyItemSupplier')
export class SupplyItemSupplierType {
  @Field(() => ID)
  supplierId!: string;

  @Field()
  razonSocial!: string;

  @Field()
  nit!: string;

  @Field(() => Float)
  precioUnitario!: number;

  @Field(() => StockUnit)
  unidadCompra!: StockUnit;

  @Field(() => Float)
  factorConversion!: number;

  @Field(() => Int)
  tiempoEntregaDias!: number;

  @Field()
  esProveedorPrincipal!: boolean;
}

@ObjectType('SupplyItemPriceHistoryEntry')
export class SupplyItemPriceHistoryType {
  @Field(() => ID)
  id!: string;

  @Field(() => Float)
  costoAnterior!: number;

  @Field(() => Float)
  costoNuevo!: number;

  @Field(() => String, { nullable: true })
  motivo?: string | null;

  @Field(() => String, { nullable: true })
  referenciaTipo?: string | null;

  @Field(() => String, { nullable: true })
  referenciaId?: string | null;

  @Field()
  createdAt!: Date;
}

@InputType('CreateSupplyItemInput')
export class CreateSupplyItemInputDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  codigoInterno?: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  categoriaId!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @Field(() => StockUnit)
  @IsEnum(StockUnit)
  unidadBase!: StockUnit;

  @Field()
  @IsNumberString()
  factorConversion!: string;

  @Field(() => String, { nullable: true })
  @IsNumberString()
  @IsOptional()
  costoPromedioPonderado?: string;

  @Field()
  @IsNumberString()
  stockMinimoBodega!: string;

  @Field()
  @IsNumberString()
  stockMaximoBodega!: string;

  @Field(() => String, { nullable: true })
  @IsNumberString()
  @IsOptional()
  stockActualBodega?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  aplicaVencimiento?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  aplicaLote?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  fechaVencimiento?: string | null;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  lote?: string | null;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategoria?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  genero?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  talla?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  locationId?: string;
}

@InputType('UpdateSupplyItemInput')
export class UpdateSupplyItemInputDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nombre?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  codigoInterno?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  categoriaId?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @Field(() => StockUnit, { nullable: true })
  @IsEnum(StockUnit)
  @IsOptional()
  unidadBase?: StockUnit;

  @Field(() => String, { nullable: true })
  @IsNumberString()
  @IsOptional()
  factorConversion?: string;

  @Field(() => String, { nullable: true })
  @IsNumberString()
  @IsOptional()
  costoPromedioPonderado?: string;

  @Field(() => String, { nullable: true })
  @IsNumberString()
  @IsOptional()
  stockMinimoBodega?: string;

  @Field(() => String, { nullable: true })
  @IsNumberString()
  @IsOptional()
  stockMaximoBodega?: string;

  @Field(() => String, { nullable: true })
  @IsNumberString()
  @IsOptional()
  stockActualBodega?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  aplicaVencimiento?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  aplicaLote?: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  fechaVencimiento?: string | null;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  lote?: string | null;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  subcategoria?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  genero?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  talla?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  locationId?: string | null;
}

function toSupplyItemType(item: SupplyItemWithRelations): SupplyItemType {
  const principal = item.supplierProducts?.find((sp) => sp.esProveedorPrincipal);

  return {
    id: item.id,
    tenantId: item.tenantId,
    nombre: item.nombre,
    codigoInterno: item.codigoInterno,
    categoriaId: item.categoriaId,
    categoria: item.categoria
      ? {
          id: item.categoria.id,
          tenantId: item.categoria.tenantId,
          nombre: item.categoria.nombre,
          prefijo: resolveCategoryPrefijo(item.categoria.nombre, item.categoria.prefijo),
          descripcion: item.categoria.descripcion,
          isActive: item.categoria.isActive,
        }
      : undefined,
    descripcion: item.descripcion,
    unidadBase: item.unidadBase,
    factorConversion: decimalToNumber(item.factorConversion),
    costoPromedioPonderado: decimalToNumber(item.costoPromedioPonderado),
    stockMinimoBodega: decimalToNumber(item.stockMinimoBodega),
    stockMaximoBodega: decimalToNumber(item.stockMaximoBodega),
    stockActualBodega: decimalToNumber(item.stockActualBodega),
    aplicaVencimiento: item.aplicaVencimiento,
    aplicaLote: item.aplicaLote,
    fechaVencimiento: item.fechaVencimiento,
    lote: item.lote,
    locationId: item.locationId ?? null,
    ubicacion: item.location?.name ?? null,
    subcategoria: item.subcategoria,
    genero: item.genero,
    talla: item.talla,
    isActive: item.isActive,
    proveedorPrincipal: principal
      ? {
          supplierId: principal.supplierId,
          razonSocial: principal.supplier.razonSocial,
        }
      : null,
    stockDisponible: decimalToNumber(item.stockActualBodega),
  };
}

@UseGuards(PermissionsGuard, RolesGuard)
@Roles(...INVENTORY_MODULE_ROLES)
@Resolver(() => SupplyItemType)
export class SupplyItemsResolver {
  constructor(private readonly supplyItemsService: SupplyItemsService) {}

  @RequirePermission('supply.items.read')
  @Query(() => [SupplyItemType])
  async supplyItems(
    @Context() context: { req: Request },
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('categoriaId', { type: () => ID, nullable: true }) categoriaId?: string,
    @Args('isActive', { type: () => Boolean, nullable: true }) isActive?: boolean,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<SupplyItemType[]> {
    const tenantId = this.getTenantId(context.req);
    const items = await this.supplyItemsService.findAll(tenantId, {
      search,
      categoriaId,
      isActive,
      limit,
      offset,
    });
    return items.map(toSupplyItemType);
  }

  @Query(() => SupplyItemType, { nullable: true })
  async supplyItem(
    @Context() context: { req: Request },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<SupplyItemType> {
    const tenantId = this.getTenantId(context.req);
    const item = await this.supplyItemsService.findOne(tenantId, id);
    return toSupplyItemType(item);
  }

  @Query(() => String, { name: 'nextSupplyItemCodigo' })
  nextSupplyItemCodigo(
    @Context() context: { req: Request },
    @Args('categoriaId', { type: () => ID }) categoriaId: string,
  ): Promise<string> {
    return this.supplyItemsService.getNextCodigoInterno(this.getTenantId(context.req), categoriaId);
  }

  @Query(() => [SupplyItemSupplierType])
  async supplyItemSuppliers(
    @Context() context: { req: Request },
    @Args('supplyItemId', { type: () => ID }) supplyItemId: string,
  ): Promise<SupplyItemSupplierType[]> {
    const tenantId = this.getTenantId(context.req);
    return this.supplyItemsService.findSuppliers(tenantId, supplyItemId);
  }

  @Query(() => [SupplyItemPriceHistoryType])
  async supplyItemPriceHistory(
    @Context() context: { req: Request },
    @Args('supplyItemId', { type: () => ID }) supplyItemId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<SupplyItemPriceHistoryType[]> {
    const tenantId = this.getTenantId(context.req);
    const rows = await this.supplyItemsService.findPriceHistory(tenantId, supplyItemId, {
      limit,
    });
    return rows.map((row) => ({
      id: row.id,
      costoAnterior: decimalToNumber(row.costoAnterior),
      costoNuevo: decimalToNumber(row.costoNuevo),
      motivo: row.motivo,
      referenciaTipo: row.referenciaTipo,
      referenciaId: row.referenciaId,
      createdAt: row.createdAt,
    }));
  }

  @Mutation(() => SupplyItemType)
  async createSupplyItem(
    @Context() context: { req: Request },
    @Args('input') input: CreateSupplyItemInputDto,
  ): Promise<SupplyItemType> {
    const tenantId = this.getTenantId(context.req);
    const item = await this.supplyItemsService.create(
      tenantId,
      input as unknown as CreateSupplyItemData,
    );
    return toSupplyItemType(item);
  }

  @Mutation(() => SupplyItemType)
  async updateSupplyItem(
    @Context() context: { req: Request },
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSupplyItemInputDto,
  ): Promise<SupplyItemType> {
    const tenantId = this.getTenantId(context.req);
    const item = await this.supplyItemsService.update(
      tenantId,
      id,
      input as unknown as UpdateSupplyItemData,
    );
    return toSupplyItemType(item);
  }

  @Mutation(() => Boolean)
  async deleteSupplyItem(
    @Context() context: { req: Request },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const tenantId = this.getTenantId(context.req);
    await this.supplyItemsService.deactivate(tenantId, id);
    return true;
  }

  private getTenantId(req: Request): string {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId || Array.isArray(tenantId)) {
      throw new BadRequestException('x-tenant-id header is required');
    }
    return tenantId;
  }
}
