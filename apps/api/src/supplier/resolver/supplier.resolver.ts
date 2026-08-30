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
  Parent,
  ResolveField,
  registerEnumType,
} from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import {
  SupplierDeliveryMode,
  SupplierDeliveryPlace,
  SupplierLogisticsStatus,
  SupplierTransportType,
  Supplier,
} from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PUB_SUB } from '../../pubsub/pubsub.module';
import { SupplierLogisticsService } from '../../supplier-logistics/service/supplier-logistics.service';
import type { SupplierLogisticsView } from '../../supplier-logistics/interfaces/supplier-logistics.interfaces';
import { SupplierService } from '../service/supplier.service';
import type { SupplierWithProductCount } from '../interfaces/supplier.interfaces';

registerEnumType(SupplierDeliveryMode, { name: 'SupplierDeliveryMode' });
registerEnumType(SupplierDeliveryPlace, { name: 'SupplierDeliveryPlace' });
registerEnumType(SupplierTransportType, { name: 'SupplierTransportType' });
registerEnumType(SupplierLogisticsStatus, { name: 'SupplierLogisticsStatus' });

@ObjectType('SupplierLogisticsUserSummary')
export class SupplierLogisticsUserSummaryType {
  @Field(() => ID) id!: string;
  @Field() email!: string;
  @Field(() => String, { nullable: true }) name?: string | null;
}

@ObjectType('SupplierLogisticsLocationSummary')
export class SupplierLogisticsLocationSummaryType {
  @Field(() => ID) id!: string;
  @Field() name!: string;
}

@ObjectType('SupplierLogistics')
export class SupplierLogisticsType {
  @Field(() => ID) id!: string;
  @Field(() => String, { nullable: true }) deliveryMode?: string | null;
  @Field(() => String, { nullable: true }) deliveryPlace?: string | null;
  @Field(() => String, { nullable: true }) deliveryPlaceCustom?: string | null;
  @Field(() => [Int]) deliveryDays!: number[];
  @Field(() => Int, { nullable: true }) leadTimeDays?: number | null;
  @Field(() => String, { nullable: true }) timeWindowStart?: string | null;
  @Field(() => String, { nullable: true }) timeWindowEnd?: string | null;
  @Field(() => SupplierLogisticsUserSummaryType, { nullable: true })
  receptionResponsible?: SupplierLogisticsUserSummaryType | null;
  @Field() receptionResponsibleStale!: boolean;
  @Field(() => String, { nullable: true }) transportType?: string | null;
  @Field() requiresColdChain!: boolean;
  @Field(() => Float, { nullable: true }) transportTempMinC?: number | null;
  @Field(() => Float, { nullable: true }) transportTempMaxC?: number | null;
  @Field(() => Float, { nullable: true }) transportCost?: number | null;
  @Field(() => String, { nullable: true }) transportCostCurrency?: string | null;
  @Field(() => Float, { nullable: true }) minimumOrderQty?: number | null;
  @Field(() => String, { nullable: true }) minimumOrderUnit?: string | null;
  @Field(() => [SupplierLogisticsLocationSummaryType])
  coverageLocations!: SupplierLogisticsLocationSummaryType[];
  @Field() status!: string;
}

@InputType('SupplierLogisticsInput')
export class SupplierLogisticsInputDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  deliveryMode?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  deliveryPlace?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  deliveryPlaceCustom?: string;

  @Field(() => [Int], { nullable: true })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  deliveryDays?: number[];

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  leadTimeDays?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  timeWindowStart?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  timeWindowEnd?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  receptionResponsibleUserId?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  transportType?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  requiresColdChain?: boolean;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  transportTempMinC?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  transportTempMaxC?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  transportCost?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  transportCostCurrency?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  minimumOrderQty?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  minimumOrderUnit?: string;

  @Field(() => [ID], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  coverageLocationIds?: string[];
}

function toSupplierLogisticsType(view: SupplierLogisticsView): SupplierLogisticsType {
  return {
    id: view.id,
    deliveryMode: view.deliveryMode,
    deliveryPlace: view.deliveryPlace,
    deliveryPlaceCustom: view.deliveryPlaceCustom,
    deliveryDays: view.deliveryDays,
    leadTimeDays: view.leadTimeDays,
    timeWindowStart: view.timeWindowStart,
    timeWindowEnd: view.timeWindowEnd,
    receptionResponsible: view.receptionResponsible,
    receptionResponsibleStale: view.receptionResponsibleStale,
    transportType: view.transportType,
    requiresColdChain: view.requiresColdChain,
    transportTempMinC: view.transportTempMinC,
    transportTempMaxC: view.transportTempMaxC,
    transportCost: view.transportCost,
    transportCostCurrency: view.transportCostCurrency,
    minimumOrderQty: view.minimumOrderQty,
    minimumOrderUnit: view.minimumOrderUnit,
    coverageLocations: view.coverageLocations,
    status: view.status,
  };
}

@ObjectType('Supplier')
export class SupplierType {
  @Field(() => ID) id!: string;

  @Field() tenantId!: string;

  @Field() razonSocial!: string;

  @Field() nit!: string;

  @Field(() => String, { nullable: true }) dv?: string;

  @Field() tipo!: string;

  @Field(() => String, { nullable: true }) direccion?: string;

  @Field(() => String, { nullable: true }) departamento?: string;

  @Field(() => String, { nullable: true }) ciudad?: string;

  @Field(() => String, { nullable: true }) telefono?: string;

  @Field(() => String, { nullable: true }) email?: string;

  @Field(() => String, { nullable: true }) contactoNombre?: string;

  @Field() condicionPago!: string;

  @Field(() => Int)
  cupoCredito!: number;

  @Field(() => Float)
  calificacion!: number;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@InputType('CreateSupplierInput')
export class CreateSupplierInputDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  razonSocial!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  nit!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dv?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  tipo!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  direccion?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  departamento?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  ciudad?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  telefono?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  contactoNombre?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  condicionPago!: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  cupoCredito?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  calificacion?: number;

  @Field(() => SupplierLogisticsInputDto, { nullable: true })
  @ValidateNested()
  @Type(() => SupplierLogisticsInputDto)
  @IsOptional()
  logistics?: SupplierLogisticsInputDto;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  saveLogisticsAsDraft?: boolean;
}

@InputType('UpdateSupplierInput')
export class UpdateSupplierInputDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  razonSocial?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  nit?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dv?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  tipo?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  direccion?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  departamento?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  ciudad?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  telefono?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  contactoNombre?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  condicionPago?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  cupoCredito?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  calificacion?: number;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field(() => SupplierLogisticsInputDto, { nullable: true })
  @ValidateNested()
  @Type(() => SupplierLogisticsInputDto)
  @IsOptional()
  logistics?: SupplierLogisticsInputDto;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  saveLogisticsAsDraft?: boolean;
}

@Resolver(() => SupplierType)
export class SupplierResolver {
  constructor(
    private readonly supplierService: SupplierService,
    private readonly supplierLogisticsService: SupplierLogisticsService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @ResolveField(() => Int, { name: 'productCount' })
  async productCount(
    @Parent() supplier: SupplierWithProductCount,
    @Context() context: { req?: { headers?: Record<string, unknown> } },
  ): Promise<number> {
    if (supplier._count?.products !== undefined) {
      return supplier._count.products;
    }
    return this.supplierService.countProducts(this.getTenantId(context), supplier.id);
  }

  @ResolveField(() => SupplierLogisticsType, { name: 'logistics', nullable: true })
  async logistics(
    @Parent() supplier: SupplierWithProductCount,
    @Context() context: { req?: { headers?: Record<string, unknown> } },
  ): Promise<SupplierLogisticsType | null> {
    const view = await this.supplierLogisticsService.findBySupplierId(
      this.getTenantId(context),
      supplier.id,
    );
    return view ? toSupplierLogisticsType(view) : null;
  }

  private getActorUserId(context: { req?: { headers?: Record<string, unknown> } }): string | null {
    const actorUserId = context.req?.headers?.['x-actor-user-id'];
    return typeof actorUserId === 'string' && actorUserId.trim() ? actorUserId.trim() : null;
  }

  private getTenantId(context: { req?: { headers?: Record<string, unknown> } }): string {
    const tenantId = context.req?.headers?.['x-tenant-id'];
    if (typeof tenantId !== 'string' || !tenantId.trim()) {
      throw new Error('x-tenant-id header is required');
    }
    return tenantId.trim();
  }

  @Query(() => [SupplierType])
  suppliers(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('filter', { type: () => String, nullable: true }) filter?: string,
    @Args('isActive', { type: () => Boolean, nullable: true }) isActive?: boolean,
    @Args('condicionPago', { type: () => String, nullable: true }) condicionPago?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Supplier[]> {
    return this.supplierService.findAll(this.getTenantId(context), {
      filter,
      isActive,
      condicionPago: condicionPago as any,
      limit,
      offset,
    });
  }

  @Query(() => SupplierType, { nullable: true })
  async supplier(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Supplier | null> {
    try {
      return await this.supplierService.findById(id, this.getTenantId(context));
    } catch {
      return null;
    }
  }

  @Query(() => [SupplierType])
  searchSuppliers(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('query') query: string,
  ): Promise<Supplier[]> {
    return this.supplierService.search(this.getTenantId(context), query);
  }

  @Mutation(() => SupplierType)
  async createSupplier(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('input') input: CreateSupplierInputDto,
  ): Promise<Supplier> {
    const supplier = await this.supplierService.create(
      this.getTenantId(context),
      input,
      this.getActorUserId(context),
    );
    await this.pubSub.publish('supplierCreated', { supplierCreated: supplier });
    return supplier;
  }

  @Mutation(() => SupplierType)
  async updateSupplier(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSupplierInputDto,
  ): Promise<Supplier> {
    const supplier = await this.supplierService.update(
      id,
      this.getTenantId(context),
      input,
      this.getActorUserId(context),
    );
    await this.pubSub.publish('supplierUpdated', { supplierUpdated: supplier });
    return supplier;
  }

  @Mutation(() => Boolean)
  deleteSupplier(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.supplierService.delete(id, this.getTenantId(context));
  }

  @Subscription(() => SupplierType)
  supplierUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator('supplierUpdated');
  }

  @Subscription(() => SupplierType)
  supplierCreated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterator('supplierCreated');
  }
}
