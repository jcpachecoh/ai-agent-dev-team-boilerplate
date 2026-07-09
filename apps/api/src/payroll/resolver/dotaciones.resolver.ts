import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { DotacionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DotacionesService } from '../service/dotaciones.service';

registerEnumType(DotacionStatus, { name: 'DotacionStatus' });

// ── Output types ─────────────────────────────────────────────────────────────

@ObjectType('SupplyItemForDotacion')
export class SupplyItemForDotacionType {
  @Field(() => ID) id!: string;
  @Field() nombre!: string;
  @Field(() => String, { nullable: true }) talla?: string | null;
  @Field(() => String, { nullable: true }) genero?: string | null;
  @Field(() => String, { nullable: true }) subcategoria?: string | null;
  @Field(() => String) stockActualBodega!: string;
  @Field() unidadBase!: string;
}

@ObjectType('DotacionSupplyItemRef')
export class DotacionSupplyItemRefType {
  @Field(() => ID) id!: string;
  @Field() nombre!: string;
  @Field(() => String, { nullable: true }) talla?: string | null;
}

@ObjectType('DotacionDeliveryType')
export class DotacionDeliveryType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) employeeId!: string;
  @Field() period!: string;
  @Field(() => ID, { nullable: true }) supplyItemId?: string | null;
  @Field(() => Int) quantity!: number;
  @Field(() => Date, { nullable: true }) deliveredAt?: Date | null;
  @Field(() => DotacionStatus) status!: DotacionStatus;
  @Field(() => String, { nullable: true }) signedReceiptUrl?: string | null;
  @Field(() => String, { nullable: true }) stockMovementId?: string | null;
  @Field(() => String, { nullable: true }) noAplicaReason?: string | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field(() => DotacionSupplyItemRefType, { nullable: true })
  supplyItem?: DotacionSupplyItemRefType | null;
  @Field(() => String, { nullable: true })
  employeeName?: string | null;
}

@ObjectType('DotacionPageInfo')
export class DotacionPageInfoType {
  @Field() hasNextPage!: boolean;
  @Field(() => String, { nullable: true }) endCursor?: string | null;
}

@ObjectType('DotacionPage')
export class DotacionPageType {
  @Field(() => [DotacionDeliveryType]) edges!: DotacionDeliveryType[];
  @Field(() => DotacionPageInfoType) pageInfo!: DotacionPageInfoType;
}

@ObjectType('GenerateEntitlementsResult')
export class GenerateEntitlementsResultType {
  @Field(() => Int) processed!: number;
  @Field(() => Int) created!: number;
  @Field(() => Int) skipped!: number;
}

@ObjectType('BulkAssignResult')
export class BulkAssignResultType {
  @Field(() => Int) assigned!: number;
  @Field(() => Int) skipped!: number;
  @Field(() => Int) total!: number;
}

// ── Input types ───────────────────────────────────────────────────────────────

@InputType()
export class BulkAssignByPositionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  period!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  positionId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  supplyItemId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Field()
  @IsDate()
  @Type(() => Date)
  deliveredAt!: Date;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  locationId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  signedReceiptUrl?: string;
}

@InputType()
export class RegisterDotacionDeliveryInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  dotacionDeliveryId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  supplyItemId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Field()
  @IsDate()
  @Type(() => Date)
  deliveredAt!: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  signedReceiptUrl?: string;
}

@InputType()
export class UpdateDotacionDeliveryInput {
  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deliveredAt?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  signedReceiptUrl?: string | null;
}

// ── Resolver ──────────────────────────────────────────────────────────────────

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
export class DotacionesResolver {
  constructor(private readonly dotacionesService: DotacionesService) {}

  @Query(() => DotacionPageType)
  async dotacionPeriod(
    @Context() ctx: GqlRequestContext,
    @Args('period') period: string,
    @Args('locationId', { nullable: true, type: () => ID }) locationId?: string,
    @Args('cursor', { nullable: true }) cursor?: string,
    @Args('take', { nullable: true, type: () => Int }) take?: number,
  ): Promise<DotacionPageType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.findByPeriod({ tenantId, period, locationId, cursor, take });
  }

  @Query(() => [SupplyItemForDotacionType])
  async availableItemsForDotacion(
    @Context() ctx: GqlRequestContext,
  ): Promise<SupplyItemForDotacionType[]> {
    const tenantId = getTenantIdFromContext(ctx);
    const items = await this.dotacionesService.getAvailableSupplyItems(tenantId);
    return items.map((i) => ({
      ...i,
      stockActualBodega: i.stockActualBodega.toString(),
    }));
  }

  @Query(() => DotacionDeliveryType)
  async dotacionDelivery(
    @Context() ctx: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<DotacionDeliveryType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.findById(id, tenantId);
  }

  @Query(() => DotacionPageType)
  async employeeDotacionHistory(
    @Context() ctx: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('cursor', { nullable: true }) cursor?: string,
    @Args('take', { nullable: true, type: () => Int }) take?: number,
  ): Promise<DotacionPageType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.findEmployeeHistory({ tenantId, employeeId, cursor, take });
  }

  @Mutation(() => GenerateEntitlementsResultType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async generatePeriodEntitlements(
    @Context() ctx: GqlRequestContext,
    @Args('period') period: string,
  ): Promise<GenerateEntitlementsResultType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.generatePeriodEntitlements(tenantId, period);
  }

  @Mutation(() => DotacionDeliveryType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async registerDotacionDelivery(
    @Context() ctx: GqlRequestContext,
    @Args('input') input: RegisterDotacionDeliveryInput,
  ): Promise<DotacionDeliveryType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.registerDelivery(
      {
        dotacionDeliveryId: input.dotacionDeliveryId,
        supplyItemId: input.supplyItemId,
        quantity: input.quantity,
        deliveredAt: input.deliveredAt,
        signedReceiptUrl: input.signedReceiptUrl,
      },
      tenantId,
    );
  }

  @Mutation(() => DotacionDeliveryType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async markDotacionNotApplicable(
    @Context() ctx: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<DotacionDeliveryType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.markNotApplicable({ id, tenantId, reason });
  }

  @Mutation(() => DotacionDeliveryType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async createDotacionForEmployee(
    @Context() ctx: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('period') period: string,
  ): Promise<DotacionDeliveryType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.createForEmployee({ tenantId, employeeId, period });
  }

  @Mutation(() => DotacionDeliveryType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async updateDotacionDelivery(
    @Context() ctx: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateDotacionDeliveryInput,
  ): Promise<DotacionDeliveryType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.updateDelivery({
      id,
      tenantId,
      deliveredAt: input.deliveredAt,
      signedReceiptUrl: input.signedReceiptUrl,
    });
  }

  @Mutation(() => BulkAssignResultType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async bulkAssignDotacionByPosition(
    @Context() ctx: GqlRequestContext,
    @Args('input') input: BulkAssignByPositionInput,
  ): Promise<BulkAssignResultType> {
    const tenantId = getTenantIdFromContext(ctx);
    return this.dotacionesService.bulkAssignByPosition({
      tenantId,
      period: input.period,
      positionId: input.positionId,
      supplyItemId: input.supplyItemId,
      quantity: input.quantity,
      deliveredAt: input.deliveredAt,
      locationId: input.locationId,
      signedReceiptUrl: input.signedReceiptUrl,
    });
  }
}
