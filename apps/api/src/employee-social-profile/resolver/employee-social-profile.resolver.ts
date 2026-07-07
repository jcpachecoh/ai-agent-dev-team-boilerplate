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
import { BeneficiaryDisabilityType, DocumentType, EmployeeRelationshipType } from '@prisma/client';
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
import { calculateAge } from '../../common/utils/date.util';
import { EmployeeSocialProfileService } from '../service/employee-social-profile.service';

registerEnumType(EmployeeRelationshipType, {
  name: 'EmployeeRelationshipType',
  description: 'Tipo de parentesco del familiar',
});

registerEnumType(BeneficiaryDisabilityType, {
  name: 'BeneficiaryDisabilityType',
  description: 'Tipo de discapacidad del familiar',
});

// DocumentType ya se registra en auth.resolver.ts / employees.resolver.ts — no volver a registrarlo aquí.

@ObjectType('EmployeeSocialProfile')
export class EmployeeSocialProfileType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) employeeDetailsId!: string;
  @Field() fullName!: string;
  @Field(() => String, { nullable: true }) primerNombre?: string | null;
  @Field(() => String, { nullable: true }) segundoNombre?: string | null;
  @Field(() => String, { nullable: true }) primerApellido?: string | null;
  @Field(() => String, { nullable: true }) segundoApellido?: string | null;
  @Field(() => DocumentType, { nullable: true }) documentType?: DocumentType | null;
  @Field(() => String, { nullable: true }) documentNumber?: string | null;
  @Field(() => EmployeeRelationshipType) relationshipType!: EmployeeRelationshipType;
  @Field(() => BeneficiaryDisabilityType) disability!: BeneficiaryDisabilityType;
  @Field() birthDate!: Date;
  @Field(() => Int) age!: number;
  @Field() isDependent!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field(() => Date, { nullable: true }) deletedAt?: Date | null;
}

@InputType()
export class CreateSocialProfileInput {
  @Field(() => DocumentType, { nullable: true })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  primerNombre!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  segundoNombre?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  primerApellido!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  segundoApellido?: string;

  @Field(() => EmployeeRelationshipType)
  @IsEnum(EmployeeRelationshipType)
  @IsNotEmpty()
  relationshipType!: EmployeeRelationshipType;

  @Field(() => BeneficiaryDisabilityType)
  @IsEnum(BeneficiaryDisabilityType)
  @IsNotEmpty()
  disability!: BeneficiaryDisabilityType;

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
  @Field(() => DocumentType, { nullable: true })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  primerNombre?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  segundoNombre?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  primerApellido?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  segundoApellido?: string;

  @Field(() => EmployeeRelationshipType, { nullable: true })
  @IsEnum(EmployeeRelationshipType)
  @IsOptional()
  relationshipType?: EmployeeRelationshipType;

  @Field(() => BeneficiaryDisabilityType, { nullable: true })
  @IsEnum(BeneficiaryDisabilityType)
  @IsOptional()
  disability?: BeneficiaryDisabilityType;

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
    const profiles = await this.service.findMyProfiles(user.sub, tenantId);
    return profiles.map(toGraphqlProfile);
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
    const profiles = await this.service.findAllByEmployee(tenantId, employeeId);
    return profiles.map(toGraphqlProfile);
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
    const profile = await this.service.create(tenantId, employeeId, {
      primerNombre: input.primerNombre.trim(),
      segundoNombre: input.segundoNombre?.trim(),
      primerApellido: input.primerApellido.trim(),
      segundoApellido: input.segundoApellido?.trim(),
      documentType: input.documentType,
      documentNumber: input.documentNumber?.trim(),
      relationshipType: input.relationshipType,
      disability: input.disability,
      birthDate: input.birthDate,
      isDependent: input.isDependent ?? false,
    });
    return toGraphqlProfile(profile);
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
    const profile = await this.service.update(tenantId, id, employeeId, {
      primerNombre: input.primerNombre !== undefined ? input.primerNombre.trim() : undefined,
      segundoNombre: input.segundoNombre !== undefined ? input.segundoNombre.trim() : undefined,
      primerApellido: input.primerApellido !== undefined ? input.primerApellido.trim() : undefined,
      segundoApellido:
        input.segundoApellido !== undefined ? input.segundoApellido.trim() : undefined,
      documentType: input.documentType,
      documentNumber: input.documentNumber !== undefined ? input.documentNumber.trim() : undefined,
      relationshipType: input.relationshipType,
      disability: input.disability,
      birthDate: input.birthDate,
      isDependent: input.isDependent,
    });
    return toGraphqlProfile(profile);
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

function toGraphqlProfile(profile: {
  id: string;
  tenantId: string;
  employeeDetailsId: string;
  fullName: string;
  primerNombre: string | null;
  segundoNombre: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  documentType: DocumentType | null;
  documentNumber: string | null;
  relationshipType: EmployeeRelationshipType;
  disability: BeneficiaryDisabilityType;
  birthDate: Date;
  isDependent: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): EmployeeSocialProfileType {
  return { ...profile, age: calculateAge(profile.birthDate) };
}
