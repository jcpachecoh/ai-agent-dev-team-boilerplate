import { ForbiddenException, UseGuards } from '@nestjs/common';
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
} from '@nestjs/graphql';
import type { LaborLegalParameter } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { SYSTEM_ADMIN_ROLES } from '../../common/config/rbac.config';
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
import { LABOR_LEGAL_PARAMETER_KEYS } from '../labor-legal-parameters.constants';
import { LaborLegalParametersService } from '../service/labor-legal-parameters.service';

// ── ObjectType ───────────────────────────────────────────────────────────────

@ObjectType('LaborLegalParameter')
export class LaborLegalParameterType {
  @Field(() => ID) id!: string;
  @Field(() => ID, { nullable: true }) tenantId?: string | null;
  @Field() key!: string;
  @Field(() => Float) value!: number;
  @Field() validFrom!: Date;
  @Field(() => Date, { nullable: true }) validTo?: Date | null;
  @Field(() => String, { nullable: true }) source?: string | null;
  @Field() isGlobal!: boolean;
  @Field() createdAt!: Date;
  @Field() updatedAt!: Date;
  @Field(() => Date, { nullable: true }) deletedAt?: Date | null;
}

// ── InputTypes ───────────────────────────────────────────────────────────────

@InputType()
export class CreateLaborLegalParameterInput {
  @Field()
  @IsIn(LABOR_LEGAL_PARAMETER_KEYS)
  key!: string;

  @Field(() => Float)
  @IsNumber()
  value!: number;

  @Field()
  @Type(() => Date)
  @IsDate()
  validFrom!: Date;

  @Field(() => Date, { nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validTo?: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  source?: string;

  /** Target tenant for the override; omit for a global (platform-wide) parameter. */
  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  tenantId?: string;
}

@InputType()
export class UpdateLaborLegalParameterInput {
  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  value?: number;

  @Field({ nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validFrom?: Date;

  @Field(() => Date, { nullable: true })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validTo?: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  source?: string;
}

// ── Resolver ─────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Resolver(() => LaborLegalParameterType)
export class LaborLegalParametersResolver {
  constructor(private readonly service: LaborLegalParametersService) {}

  @Query(() => [LaborLegalParameterType])
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @RequirePermission('configuracion.legal.read')
  async laborLegalParameters(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string,
  ): Promise<LaborLegalParameterType[]> {
    const actorTenantId = this.resolveActorTenantId(user, context);
    const scopeTenantId = this.assertOwnTenant(tenantId, actorTenantId);
    const rows = await this.service.listCurrent(scopeTenantId);
    return rows.map((row) => this.mapRow(row));
  }

  @Query(() => [LaborLegalParameterType])
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @RequirePermission('configuracion.legal.read')
  async laborLegalParameterHistory(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('key') key: string,
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string,
  ): Promise<LaborLegalParameterType[]> {
    const actorTenantId = this.resolveActorTenantId(user, context);
    const scopeTenantId = this.assertOwnTenant(tenantId, actorTenantId);
    const rows = await this.service.listHistory(
      key as (typeof LABOR_LEGAL_PARAMETER_KEYS)[number],
      scopeTenantId,
    );
    return rows.map((row) => this.mapRow(row));
  }

  @Query(() => Float)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @RequirePermission('configuracion.legal.read')
  async laborLegalParameterValueAt(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('key') key: string,
    @Args('date') date: Date,
    @Args('tenantId', { type: () => ID, nullable: true }) tenantId?: string,
  ): Promise<number> {
    const actorTenantId = this.resolveActorTenantId(user, context);
    const scopeTenantId = this.assertOwnTenant(tenantId, actorTenantId);
    return this.service.getValueAt(
      key as (typeof LABOR_LEGAL_PARAMETER_KEYS)[number],
      date,
      scopeTenantId,
    );
  }

  @Mutation(() => LaborLegalParameterType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @RequirePermission('configuracion.legal.write')
  async createLaborLegalParameter(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: CreateLaborLegalParameterInput,
  ): Promise<LaborLegalParameterType> {
    const actorTenantId = this.resolveActorTenantId(user, context);
    const created = await this.service.create(
      {
        key: input.key,
        value: input.value,
        validFrom: input.validFrom,
        validTo: input.validTo ?? null,
        source: input.source ?? null,
        tenantId: input.tenantId ?? null,
      },
      { userId: user.sub, tenantId: actorTenantId, roleCode: user.roleCode },
    );
    return this.mapRow(created);
  }

  @Mutation(() => LaborLegalParameterType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @RequirePermission('configuracion.legal.write')
  async updateLaborLegalParameter(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateLaborLegalParameterInput,
  ): Promise<LaborLegalParameterType> {
    const actorTenantId = this.resolveActorTenantId(user, context);
    const updated = await this.service.update(
      id,
      {
        value: input.value,
        validFrom: input.validFrom,
        validTo: input.validTo,
        source: input.source,
      },
      { userId: user.sub, tenantId: actorTenantId, roleCode: user.roleCode },
    );
    return this.mapRow(updated);
  }

  @Mutation(() => Boolean)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...SYSTEM_ADMIN_ROLES)
  @RequirePermission('configuracion.legal.write')
  async deleteLaborLegalParameter(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const actorTenantId = this.resolveActorTenantId(user, context);
    await this.service.softDelete(id, {
      userId: user.sub,
      tenantId: actorTenantId,
      roleCode: user.roleCode,
    });
    return true;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private mapRow(row: LaborLegalParameter): LaborLegalParameterType {
    return {
      id: row.id,
      tenantId: row.tenantId,
      key: row.key,
      value: Number(row.value),
      validFrom: row.validFrom,
      validTo: row.validTo,
      source: row.source,
      isGlobal: row.tenantId === null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }

  private resolveActorTenantId(user: JwtPayload, context: GqlRequestContext): string {
    if (user?.tenantId) {
      return user.tenantId;
    }
    return getTenantIdFromContext(context);
  }

  /** Tenant-scoped queries may only target the actor's own tenant — see service.assertWritableScope for the write-side rule. */
  private assertOwnTenant(
    requestedTenantId: string | undefined,
    actorTenantId: string,
  ): string | null {
    if (!requestedTenantId) {
      return actorTenantId;
    }
    if (requestedTenantId !== actorTenantId) {
      throw new ForbiddenException('No puede consultar parámetros legales de otro tenant');
    }
    return requestedTenantId;
  }
}
