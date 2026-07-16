import { UseGuards } from '@nestjs/common';
import {
  Args,
  Context,
  Field,
  Float,
  ID,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  registerEnumType,
} from '@nestjs/graphql';
import {
  AttendanceEventType,
  AttendanceMarkingScope,
  AttendanceValidationStatus,
} from '@prisma/client';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import type { JwtPayload } from '../../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES } from '../../../common/config/rbac.config';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  getTenantIdFromContext,
  type GqlRequestContext,
} from '../../../common/graphql/tenant-from-context';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PageInfoType } from '../../../locations/resolver/dto/location-connection.type';
import type {
  FacialReferenceResult,
  MarcacionConnection,
  MarcacionResult,
  SedeMarcacionConfigResult,
} from '../interfaces/mobile-attendance.interfaces';
import { MobileAttendanceService } from '../service/mobile-attendance.service';

registerEnumType(AttendanceEventType, {
  name: 'MobileAttendanceEventType',
  description: 'Tipo de marcación móvil',
});

registerEnumType(AttendanceValidationStatus, {
  name: 'MobileAttendanceStatus',
  description: 'Estado de validación de la marcación',
});

registerEnumType(AttendanceMarkingScope, {
  name: 'AttendanceMarkingScope',
  description: 'Alcance de la marcación (jornada ordinaria o tiempo adicional post-corte)',
});

// ── Input types ─────────────────────────────────────────────────────────────

@InputType('RegistrarMarcacionInput')
export class RegistrarMarcacionInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @Field(() => AttendanceEventType)
  @IsEnum(AttendanceEventType)
  eventType!: AttendanceEventType;

  @Field(() => Float)
  @IsNumber()
  @Min(-90)
  @Max(90)
  clientLatitude!: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180)
  @Max(180)
  clientLongitude!: number;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  storageObjectId?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  facialMatchScore?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  facialMatchResult?: string;

  @Field({ nullable: true })
  @IsOptional()
  timestamp?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field(() => AttendanceMarkingScope, { nullable: true })
  @IsEnum(AttendanceMarkingScope)
  @IsOptional()
  markingScope?: AttendanceMarkingScope;
}

@InputType('MarcacionesPorSedeInput')
export class MarcacionesPorSedeInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  dateFrom!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  dateTo!: string;

  @Field(() => AttendanceValidationStatus, { nullable: true })
  @IsEnum(AttendanceValidationStatus)
  @IsOptional()
  status?: AttendanceValidationStatus;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  cursor?: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  take?: number;
}

@InputType('MarcacionesPorEmpleadoInput')
export class MarcacionesPorEmpleadoInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  dateFrom!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  dateTo!: string;

  @Field(() => AttendanceValidationStatus, { nullable: true })
  @IsEnum(AttendanceValidationStatus)
  @IsOptional()
  status?: AttendanceValidationStatus;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  cursor?: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  take?: number;
}

// ── Object types ─────────────────────────────────────────────────────────────

@ObjectType('RegistrarMarcacionResult')
export class RegistrarMarcacionResultType implements MarcacionResult {
  @Field(() => ID) id!: string;
  @Field(() => AttendanceValidationStatus) status!: AttendanceValidationStatus;
  @Field(() => Float, { nullable: true }) distanceMeters!: number | null;
  @Field(() => String, { nullable: true }) rejectionReason!: string | null;
  @Field() timestamp!: Date;
  @Field() workDate!: Date;
}

@ObjectType('MobileAttendanceLogType')
export class MobileAttendanceLogType {
  @Field(() => ID) id!: string;
  @Field(() => ID) tenantId!: string;
  @Field(() => ID) employeeId!: string;
  @Field(() => ID) locationId!: string;
  @Field() locationName!: string;
  @Field(() => AttendanceEventType) eventType!: AttendanceEventType;
  @Field(() => AttendanceValidationStatus) status!: AttendanceValidationStatus;
  @Field() timestamp!: Date;
  @Field() workDate!: Date;
  @Field(() => Float, { nullable: true }) distanceMeters?: number | null;
  @Field(() => String, { nullable: true }) photoUrl?: string | null;
  @Field(() => Float, { nullable: true }) facialMatchScore?: number | null;
  @Field(() => String, { nullable: true }) rejectionReason?: string | null;
  @Field(() => String, { nullable: true }) notes?: string | null;
  @Field() createdAt!: Date;
}

@ObjectType('MobileAttendanceEdge')
export class MobileAttendanceEdgeType {
  @Field(() => MobileAttendanceLogType) node!: MobileAttendanceLogType;
  @Field() cursor!: string;
}

@ObjectType('MobileAttendanceConnection')
export class MobileAttendanceConnectionType {
  @Field(() => [MobileAttendanceEdgeType]) edges!: MobileAttendanceEdgeType[];
  @Field(() => PageInfoType) pageInfo!: PageInfoType;
}

@ObjectType('FacialReference')
export class FacialReferenceType {
  @Field(() => ID) storageObjectId!: string;
  @Field() signedUrl!: string;
  @Field() version!: string;
  @Field() updatedAt!: Date;
}

@ObjectType('SedeMarcacionConfig')
export class SedeMarcacionConfigType implements SedeMarcacionConfigResult {
  @Field(() => ID) locationId!: string;
  @Field() name!: string;
  @Field(() => Float, { nullable: true }) geoLatitude!: number | null;
  @Field(() => Float, { nullable: true }) geoLongitude!: number | null;
  @Field(() => Int, { nullable: true }) checkInRadiusMeters!: number | null;
  @Field() requiresPhoto!: boolean;
}

// ── Resolver ─────────────────────────────────────────────────────────────────

@UseGuards(JwtAuthGuard)
@Resolver()
export class MobileAttendanceResolver {
  constructor(private readonly service: MobileAttendanceService) {}

  @Mutation(() => RegistrarMarcacionResultType)
  async registrarMarcacion(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: RegistrarMarcacionInputType,
  ): Promise<MarcacionResult> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.registrarMarcacion(input, user.sub, tenantId);
  }

  @Query(() => MobileAttendanceConnectionType)
  async misMarcaciones(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('cursor', { type: () => ID, nullable: true }) cursor?: string,
    @Args('take', { type: () => Int, defaultValue: 20 }) take?: number,
    @Args('dateFrom', { nullable: true }) dateFrom?: string,
    @Args('dateTo', { nullable: true }) dateTo?: string,
  ): Promise<MobileAttendanceConnectionType> {
    const tenantId = this.resolveTenantId(user, context);
    const result = await this.service.misMarcaciones(user.sub, tenantId, {
      cursor,
      take,
      dateFrom,
      dateTo,
    });
    return this.toConnectionType(result);
  }

  @Query(() => MobileAttendanceConnectionType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('attendance.mobile.read')
  async marcacionesPorSede(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: MarcacionesPorSedeInputType,
  ): Promise<MobileAttendanceConnectionType> {
    const tenantId = this.resolveTenantId(user, context);
    const result = await this.service.marcacionesPorSede(input, tenantId);
    return this.toConnectionType(result);
  }

  @Query(() => MobileAttendanceConnectionType)
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission('attendance.mobile.read')
  async marcacionesPorEmpleado(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: MarcacionesPorEmpleadoInputType,
  ): Promise<MobileAttendanceConnectionType> {
    const tenantId = this.resolveTenantId(user, context);
    const result = await this.service.marcacionesPorEmpleado(input, tenantId);
    return this.toConnectionType(result);
  }

  @Query(() => SedeMarcacionConfigType)
  async sedeMarcacionConfig(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('locationId', { type: () => ID }) locationId: string,
  ): Promise<SedeMarcacionConfigResult> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.sedeMarcacionConfig(locationId, tenantId);
  }

  @Query(() => FacialReferenceType, { nullable: true })
  async misDatosFaciales(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<FacialReferenceResult | null> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.misDatosFaciales(user.sub, tenantId);
  }

  @Query(() => SedeMarcacionConfigType)
  async miSede(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
  ): Promise<SedeMarcacionConfigResult> {
    const tenantId = this.resolveTenantId(user, context);
    return this.service.miSede(user.sub, tenantId);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private resolveTenantId(user: JwtPayload, context: GqlRequestContext): string {
    if (user?.tenantId) return user.tenantId;
    return getTenantIdFromContext(context);
  }

  private toConnectionType(result: MarcacionConnection): MobileAttendanceConnectionType {
    return {
      edges: result.edges.map((log) => ({
        cursor: log.id,
        node: {
          id: log.id,
          tenantId: log.tenantId,
          employeeId: log.employeeId,
          locationId: log.locationId,
          locationName: log.location.name,
          eventType: log.eventType,
          status: log.status,
          timestamp: log.timestamp,
          workDate: log.workDate,
          distanceMeters: log.distanceMeters,
          photoUrl: log.photoUrl,
          facialMatchScore: log.facialMatchScore,
          rejectionReason: log.rejectionReason,
          notes: log.notes,
          createdAt: log.createdAt,
        },
      })),
      pageInfo: result.pageInfo,
    };
  }
}
