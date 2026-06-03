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
import { Supplier } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PUB_SUB } from '../../pubsub/pubsub.module';
import { SupplierService } from '../service/supplier.service';
import type { SupplierWithProductCount } from '../interfaces/supplier.interfaces';

@ObjectType('Supplier')
export class SupplierType {
  @Field(() => ID) id!: string;

  @Field() tenantId!: string;

  @Field() razonSocial!: string;

  @Field() nit!: string;

  @Field(() => String, { nullable: true }) dv?: string;

  @Field() tipo!: string;

  @Field(() => String, { nullable: true }) direccion?: string;

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
}

@Resolver(() => SupplierType)
export class SupplierResolver {
  constructor(
    private readonly supplierService: SupplierService,
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
    const supplier = await this.supplierService.create(this.getTenantId(context), input);
    await this.pubSub.publish('supplierCreated', { supplierCreated: supplier });
    return supplier;
  }

  @Mutation(() => SupplierType)
  async updateSupplier(
    @Context() context: { req: { headers: Record<string, unknown> } },
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSupplierInputDto,
  ): Promise<Supplier> {
    const supplier = await this.supplierService.update(id, this.getTenantId(context), input);
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
