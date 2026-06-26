import {
  Args,
  Context,
  Field,
  Float,
  ID,
  InputType,
  Mutation,
  ObjectType,
  PartialType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES, PAYROLL_WRITE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { EmployeePositionsService } from '../service/employee-positions.service';
import type { EmployeePositionRecord } from '../interfaces/employee-positions.interfaces';

@ObjectType('EmployeePosition')
export class EmployeePositionType {
  @Field(() => ID) id!: string;
  @Field() title!: string;
  @Field() area!: string;
  @Field(() => Float) baseSalaryRange!: number;
  @Field() isActive!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
}

@ObjectType('EmployeePositionHistory')
export class EmployeePositionHistoryType {
  @Field(() => ID) id!: string;
  @Field(() => ID) employeeDetailsId!: string;
  @Field(() => ID) positionId!: string;
  @Field() effectiveFrom!: Date;
  @Field(() => Date, { nullable: true }) effectiveTo?: Date | null;
  @Field(() => ID, { nullable: true }) changedBy?: string | null;
  @Field() createdAt!: Date;
}

@InputType()
export class CreateEmployeePositionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  area!: string;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  baseSalaryRange!: number;
}

@InputType()
export class UpdateEmployeePositionInput extends PartialType(CreateEmployeePositionInput) {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

function toPositionType(position: EmployeePositionRecord): EmployeePositionType {
  return {
    id: position.id,
    title: position.title,
    area: position.area,
    baseSalaryRange: Number(position.baseSalaryRange),
    isActive: position.isActive,
    createdAt: position.createdAt,
    updatedAt: position.updatedAt,
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...PAYROLL_MODULE_ROLES)
@Resolver(() => EmployeePositionType)
export class EmployeePositionsResolver {
  constructor(private readonly employeePositionsService: EmployeePositionsService) {}

  @Query(() => [EmployeePositionType])
  async employeePositions(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('includeInactive', { type: () => Boolean, nullable: true }) includeInactive?: boolean,
    @Args('area', { type: () => String, nullable: true }) area?: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ): Promise<EmployeePositionType[]> {
    const tenantId = this.resolveTenantId(user, context);
    const positions = await this.employeePositionsService.findAll(tenantId, {
      includeInactive,
      area,
      search,
    });
    return positions.map(toPositionType);
  }

  @Query(() => EmployeePositionType, { nullable: true })
  async employeePosition(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EmployeePositionType> {
    const tenantId = this.resolveTenantId(user, context);
    const position = await this.employeePositionsService.findById(tenantId, id);
    return toPositionType(position);
  }

  @Query(() => [EmployeePositionHistoryType])
  async employeePositionHistory(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('employeeDetailsId', { type: () => ID }) employeeDetailsId: string,
  ): Promise<EmployeePositionHistoryType[]> {
    const tenantId = this.resolveTenantId(user, context);
    return this.employeePositionsService.getEmployeePositionHistory(tenantId, employeeDetailsId);
  }

  @Mutation(() => EmployeePositionType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async createEmployeePosition(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('input') input: CreateEmployeePositionInput,
  ): Promise<EmployeePositionType> {
    const tenantId = this.resolveTenantId(user, context);
    const position = await this.employeePositionsService.create(tenantId, {
      title: input.title,
      area: input.area,
      baseSalaryRange: String(input.baseSalaryRange),
    });
    return toPositionType(position);
  }

  @Mutation(() => EmployeePositionType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async updateEmployeePosition(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateEmployeePositionInput,
  ): Promise<EmployeePositionType> {
    const tenantId = this.resolveTenantId(user, context);
    const position = await this.employeePositionsService.update(tenantId, id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.area !== undefined ? { area: input.area } : {}),
      ...(input.baseSalaryRange !== undefined
        ? { baseSalaryRange: String(input.baseSalaryRange) }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    return toPositionType(position);
  }

  @Mutation(() => EmployeePositionType)
  @Roles(...PAYROLL_WRITE_ROLES)
  async deactivateEmployeePosition(
    @CurrentUser() user: { tenantId?: string },
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<EmployeePositionType> {
    const tenantId = this.resolveTenantId(user, context);
    const position = await this.employeePositionsService.deactivate(tenantId, id);
    return toPositionType(position);
  }

  private resolveTenantId(user: { tenantId?: string }, context: GqlRequestContext): string {
    if (user?.tenantId) {
      return user.tenantId;
    }
    return getTenantIdFromContext(context);
  }
}
