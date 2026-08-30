import {
  Args,
  Context,
  Field,
  Float,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { UseGuards } from '@nestjs/common';
import { AssetStatus, AssetType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { EmployeeAssetsService } from '../service/employee-assets.service';
import type { EmployeeAssetRecord } from '../interfaces/employee-assets.interfaces';

registerEnumType(AssetStatus, { name: 'AssetStatus' });
registerEnumType(AssetType, { name: 'AssetType' });

@ObjectType('EmployeeAsset')
export class EmployeeAssetType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) employeeId!: string;
  @Field() assetName!: string;
  @Field(() => AssetType) type!: AssetType;
  @Field() assignmentDate!: Date;
  @Field(() => Float) value!: number;
  @Field(() => AssetStatus) status!: AssetStatus;
  @Field(() => String, { nullable: true }) notes?: string | null;
  @Field(() => String, { nullable: true }) storageObjectId?: string | null;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@InputType()
export class CreateEmployeeAssetInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  assetName!: string;

  @Field(() => AssetType)
  @IsEnum(AssetType)
  type!: AssetType;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value!: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  assignmentDate?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  storageObjectId?: string;
}

@InputType()
export class UpdateEmployeeAssetInput {
  @Field(() => AssetStatus, { nullable: true })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  value?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  storageObjectId?: string;
}

function toAssetType(record: EmployeeAssetRecord): EmployeeAssetType {
  return {
    id: record.id,
    tenantId: record.tenantId,
    employeeId: record.employeeId,
    assetName: record.assetName,
    type: record.type,
    assignmentDate: record.assignmentDate,
    value: Number(record.value),
    status: record.status,
    notes: record.notes,
    storageObjectId: record.storageObjectId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Resolver(() => EmployeeAssetType)
export class EmployeeAssetsResolver {
  constructor(private readonly service: EmployeeAssetsService) {}

  @Query(() => [EmployeeAssetType])
  async employeeAssets(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('status', { type: () => AssetStatus, nullable: true }) status?: AssetStatus,
    @Args('type', { type: () => AssetType, nullable: true }) type?: AssetType,
  ): Promise<EmployeeAssetType[]> {
    const tenantId = this.resolveTenantId(user, context);
    const records = await this.service.findByEmployee(tenantId, employeeId, { status, type });
    return records.map(toAssetType);
  }

  @Query(() => EmployeeAssetType)
  async employeeAsset(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EmployeeAssetType> {
    const tenantId = this.resolveTenantId(user, context);
    return toAssetType(await this.service.findById(tenantId, id));
  }

  @Mutation(() => EmployeeAssetType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async createEmployeeAsset(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('input') input: CreateEmployeeAssetInput,
  ): Promise<EmployeeAssetType> {
    const tenantId = this.resolveTenantId(user, context);
    const record = await this.service.create(tenantId, {
      employeeId: input.employeeId,
      assetName: input.assetName,
      type: input.type,
      value: String(input.value),
      assignmentDate: input.assignmentDate,
      notes: input.notes,
      storageObjectId: input.storageObjectId,
    });
    return toAssetType(record);
  }

  @Mutation(() => EmployeeAssetType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async updateEmployeeAsset(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmployeeAssetInput,
  ): Promise<EmployeeAssetType> {
    const tenantId = this.resolveTenantId(user, context);
    const record = await this.service.update(tenantId, id, {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.value !== undefined ? { value: String(input.value) } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.storageObjectId !== undefined ? { storageObjectId: input.storageObjectId } : {}),
    });
    return toAssetType(record);
  }

  @Query(() => String)
  async employeeAssetDownloadUrl(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<string> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.getDownloadUrl(tenantId, id);
  }

  private resolveTenantId(user: { tenantId?: string }, context: GqlRequestContext): string {
    if (user?.tenantId) return user.tenantId;
    return getTenantIdFromContext(context);
  }
}
