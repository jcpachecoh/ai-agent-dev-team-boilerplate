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
import { ConsentType } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { SYSTEM_ADMIN_ROLES } from '../../common/config/rbac.config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  getClientIpFromContext,
  getTenantIdFromContext,
  getUserAgentFromContext,
  type GqlRequestContext,
} from '../../common/graphql/tenant-from-context';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type {
  DataConsentRecord,
  DataProcessingPolicyRecord,
  EmployeeConsentSummary,
} from '../interfaces/data-consent.interfaces';
import { DataConsentService } from '../service/data-consent.service';

registerEnumType(ConsentType, {
  name: 'ConsentType',
  description: 'Tipo de consentimiento de datos personales (Ley 1581)',
});

@ObjectType('DataProcessingPolicy')
export class DataProcessingPolicyType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field() version!: string;
  @Field() title!: string;
  @Field() content!: string;
  @Field() consentLabel!: string;
  @Field() publishedAt!: Date;
  @Field() isActive!: boolean;
}

@ObjectType('DataConsent')
export class DataConsentType {
  @Field(() => ID) id!: string;
  @Field() tenantId!: string;
  @Field(() => ID) employeeId!: string;
  @Field(() => ConsentType) consentType!: ConsentType;
  @Field() granted!: boolean;
  @Field() policyVersion!: string;
  @Field(() => Date, { nullable: true }) grantedAt?: Date | null;
  @Field(() => Date, { nullable: true }) revokedAt?: Date | null;
}

@ObjectType('DataConsentStatusItem')
export class DataConsentStatusItemType {
  @Field(() => ConsentType) consentType!: ConsentType;
  @Field() granted!: boolean;
  @Field(() => String, { nullable: true }) policyVersion?: string | null;
  @Field(() => Date, { nullable: true }) grantedAt?: Date | null;
  @Field(() => Date, { nullable: true }) revokedAt?: Date | null;
  @Field() canUseFeature!: boolean;
}

@ObjectType('EmployeeConsentSummary')
export class EmployeeConsentSummaryType {
  @Field() activePolicyVersion!: string;
  @Field(() => DataProcessingPolicyType) policy!: DataProcessingPolicyType;
  @Field(() => [DataConsentStatusItemType]) consents!: DataConsentStatusItemType[];
  @Field() biometricEnrolled!: boolean;
  @Field() alternateMethodAvailable!: boolean;
}

@InputType('GrantDataConsentInput')
export class GrantDataConsentInputType {
  @Field()
  @IsString()
  @IsNotEmpty()
  policyVersion!: string;

  @Field(() => [ConsentType])
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ConsentType, { each: true })
  consentTypes!: ConsentType[];

  @Field()
  @IsBoolean()
  accepted!: boolean;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

@InputType('RevokeDataConsentInput')
export class RevokeDataConsentInputType {
  @Field(() => ConsentType)
  @IsEnum(ConsentType)
  consentType!: ConsentType;
}

@InputType('PublishDataProcessingPolicyInput')
export class PublishDataProcessingPolicyInputType {
  @Field()
  @IsString()
  @IsNotEmpty()
  version!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  content!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  consentLabel!: string;
}

@UseGuards(JwtAuthGuard)
@Resolver()
export class DataConsentResolver {
  constructor(private readonly service: DataConsentService) {}

  @Query(() => DataProcessingPolicyType)
  async activeDataProcessingPolicy(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<DataProcessingPolicyRecord> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.getActivePolicy(tenantId);
  }

  @Query(() => EmployeeConsentSummaryType)
  async myDataConsentStatus(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<EmployeeConsentSummary> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.getMyConsentStatus(user.sub, tenantId);
  }

  @Query(() => EmployeeConsentSummaryType)
  async employeeDataConsents(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<EmployeeConsentSummary> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.getEmployeeConsentStatus(userId, {
      userId: user.sub,
      tenantId,
      roleCode: user.roleCode,
      ...this.extractRequestMeta(context),
    });
  }

  @Query(() => [DataProcessingPolicyType])
  @UseGuards(RolesGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  async dataProcessingPolicies(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<DataProcessingPolicyRecord[]> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.listPolicies(tenantId);
  }

  @Mutation(() => [DataConsentType])
  async grantDataConsent(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: GrantDataConsentInputType,
  ): Promise<DataConsentRecord[]> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.grantConsent(
      {
        userId: user.sub,
        tenantId,
        roleCode: user.roleCode,
        ...this.extractRequestMeta(context),
      },
      input,
    );
  }

  @Mutation(() => DataConsentType)
  async revokeDataConsent(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: RevokeDataConsentInputType,
  ): Promise<DataConsentRecord> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.revokeConsent(
      {
        userId: user.sub,
        tenantId,
        roleCode: user.roleCode,
        ...this.extractRequestMeta(context),
      },
      input,
    );
  }

  @Mutation(() => DataProcessingPolicyType)
  @UseGuards(RolesGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  async publishDataProcessingPolicy(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: PublishDataProcessingPolicyInputType,
  ): Promise<DataProcessingPolicyRecord> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.publishPolicy(
      {
        userId: user.sub,
        tenantId,
        roleCode: user.roleCode,
        ...this.extractRequestMeta(context),
      },
      input,
    );
  }

  private resolveTenantId(user: JwtPayload, context: GqlRequestContext): string {
    if (user?.tenantId) {
      return user.tenantId;
    }
    return getTenantIdFromContext(context);
  }

  private extractRequestMeta(context: GqlRequestContext): {
    ipAddress?: string | null;
    userAgent?: string | null;
  } {
    const ipAddress = getClientIpFromContext(context);
    const userAgent = getUserAgentFromContext(context);
    return {
      ipAddress: ipAddress === 'unknown' ? null : ipAddress,
      userAgent: userAgent ?? null,
    };
  }
}
