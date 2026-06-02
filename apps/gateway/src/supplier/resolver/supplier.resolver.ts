import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  Subscription,
  ObjectType,
  Field,
  InputType,
  ID,
  Float,
} from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { SupplierService } from '../service/supplier.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PUB_SUB } from '../../pubsub/pubsub.module';
import { PubSub } from 'graphql-subscriptions';

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
  @Field(() => Int) cupoCredito!: number;
  @Field(() => Float) calificacion!: number;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class CreateSupplierInputDto {
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
  @Field(() => Int, { nullable: true }) cupoCredito?: number;
  @Field(() => Float, { nullable: true }) calificacion?: number;
}

@InputType()
export class UpdateSupplierInputDto {
  @Field(() => String, { nullable: true }) razonSocial?: string;
  @Field(() => String, { nullable: true }) nit?: string;
  @Field(() => String, { nullable: true }) dv?: string;
  @Field(() => String, { nullable: true }) tipo?: string;
  @Field(() => String, { nullable: true }) direccion?: string;
  @Field(() => String, { nullable: true }) ciudad?: string;
  @Field(() => String, { nullable: true }) telefono?: string;
  @Field(() => String, { nullable: true }) email?: string;
  @Field(() => String, { nullable: true }) contactoNombre?: string;
  @Field(() => String, { nullable: true }) condicionPago?: string;
  @Field(() => Int, { nullable: true }) cupoCredito?: number;
  @Field(() => Float, { nullable: true }) calificacion?: number;
  @Field(() => Boolean, { nullable: true }) isActive?: boolean;
}

@Resolver(() => SupplierType)
export class SupplierResolver {
  constructor(
    private readonly supplierService: SupplierService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Query(() => [SupplierType])
  async suppliers(
    @CurrentUser() user: JwtPayload,
    @Args('filter', { type: () => String, nullable: true }) filter?: string,
    @Args('isActive', { type: () => Boolean, nullable: true }) isActive?: boolean,
    @Args('condicionPago', { type: () => String, nullable: true }) condicionPago?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Supplier[]> {
    return this.supplierService.findAll(user.tenantId, {
      filter,
      isActive,
      condicionPago: condicionPago as any,
      limit,
      offset,
    });
  }

  @Query(() => SupplierType, { nullable: true })
  async supplier(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Supplier | null> {
    try {
      return await this.supplierService.findById(id, user.tenantId);
    } catch {
      return null;
    }
  }

  @Query(() => [SupplierType])
  async searchSuppliers(
    @CurrentUser() user: JwtPayload,
    @Args('query') query: string,
  ): Promise<Supplier[]> {
    return this.supplierService.search(user.tenantId, query);
  }

  @Mutation(() => SupplierType)
  async createSupplier(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: CreateSupplierInputDto,
  ): Promise<Supplier> {
    const supplier = await this.supplierService.create(user.tenantId, input);
    await this.pubSub.publish('supplierCreated', { supplierCreated: supplier });
    return supplier;
  }

  @Mutation(() => SupplierType)
  async updateSupplier(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSupplierInputDto,
  ): Promise<Supplier> {
    const supplier = await this.supplierService.update(id, user.tenantId, input);
    await this.pubSub.publish('supplierUpdated', { supplierUpdated: supplier });
    return supplier;
  }

  @Mutation(() => Boolean)
  async deleteSupplier(
    @CurrentUser() user: JwtPayload,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.supplierService.delete(id, user.tenantId);
  }

  @Subscription(() => SupplierType)
  supplierUpdated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterableIterator('supplierUpdated');
  }

  @Subscription(() => SupplierType)
  supplierCreated(): AsyncIterator<unknown> {
    return this.pubSub.asyncIterableIterator('supplierCreated');
  }
}
