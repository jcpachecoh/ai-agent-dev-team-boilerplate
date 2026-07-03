import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  ID,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import { EmployeeRelationshipType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxDate,
} from 'class-validator';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EmployeeSocialProfileService } from '../service/employee-social-profile.service';

registerEnumType(EmployeeRelationshipType, {
  name: 'EmployeeRelationshipType',
  description: 'Tipo de parentesco del familiar',
});

@ObjectType('EmployeeSocialProfile')
export class EmployeeSocialProfileType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) employeeDetailsId!: string;
  @Field() fullName!: string;
  @Field(() => EmployeeRelationshipType) relationshipType!: EmployeeRelationshipType;
  @Field() birthDate!: Date;
  @Field() isDependent!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field(() => Date, { nullable: true }) deletedAt?: Date | null;
}

@InputType()
export class CreateSocialProfileInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @Field(() => EmployeeRelationshipType)
  @IsEnum(EmployeeRelationshipType)
  @IsNotEmpty()
  relationshipType!: EmployeeRelationshipType;

  @Field()
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'La fecha de nacimiento no puede ser futura' })
  birthDate!: Date;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isDependent?: boolean;
}

@InputType()
export class UpdateSocialProfileInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  fullName?: string;

  @Field(() => EmployeeRelationshipType, { nullable: true })
  @IsEnum(EmployeeRelationshipType)
  @IsOptional()
  relationshipType?: EmployeeRelationshipType;

  @Field(() => Date, { nullable: true })
  @Type(() => Date)
  @IsDate()
  @MaxDate(new Date(), { message: 'La fecha de nacimiento no puede ser futura' })
  @IsOptional()
  birthDate?: Date;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  isDependent?: boolean;
}

@UseGuards(JwtAuthGuard)
@Resolver(() => EmployeeSocialProfileType)
export class EmployeeSocialProfileResolver {
  constructor(private readonly service: EmployeeSocialProfileService) {}

  @Query(() => [EmployeeSocialProfileType])
  async myEmployeeSocialProfiles(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<EmployeeSocialProfileType[]> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.findMyProfiles(user.sub, tenantId) as Promise<EmployeeSocialProfileType[]>;
  }

  @Query(() => [EmployeeSocialProfileType])
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.read')
  async employeeSocialProfiles(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ): Promise<EmployeeSocialProfileType[]> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.findAllByEmployee(tenantId, employeeId) as Promise<
      EmployeeSocialProfileType[]
    >;
  }

  @Mutation(() => EmployeeSocialProfileType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.create')
  async createEmployeeSocialProfile(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('input') input: CreateSocialProfileInput,
  ): Promise<EmployeeSocialProfileType> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.create(tenantId, employeeId, {
      fullName: input.fullName.trim(),
      relationshipType: input.relationshipType,
      birthDate: input.birthDate,
      isDependent: input.isDependent ?? false,
    }) as Promise<EmployeeSocialProfileType>;
  }

  @Mutation(() => EmployeeSocialProfileType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.update')
  async updateEmployeeSocialProfile(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSocialProfileInput,
  ): Promise<EmployeeSocialProfileType> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.update(tenantId, id, employeeId, {
      fullName: input.fullName !== undefined ? input.fullName.trim() : undefined,
      relationshipType: input.relationshipType,
      birthDate: input.birthDate,
      isDependent: input.isDependent,
    }) as Promise<EmployeeSocialProfileType>;
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('payroll.social_profile.delete')
  async deleteEmployeeSocialProfile(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('employeeId', { type: () => ID }) employeeId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const tenantId = this.resolveTenantId(user, context);
    await this.service.remove(tenantId, id, employeeId);
    return true;
  }

  private resolveTenantId(user: JwtPayload, context: GqlRequestContext): string {
    if (user?.tenantId) {
      return user.tenantId;
    }
    return getTenantIdFromContext(context);
  }
}
