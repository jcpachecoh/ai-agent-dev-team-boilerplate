import { UseGuards } from '@nestjs/common';
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
import { AttendanceEventType, AttendanceVerificationMethod } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
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
import { KioskMarkingGuard } from '../guard/kiosk-marking.guard';
import {
  KIOSK_ACTIVATE_PERMISSION,
  type KioskTokenContext,
} from '../interfaces/kiosk-marking.interfaces';
import { KioskMarkingService } from '../service/kiosk-marking.service';
import { KioskMarkingSessionService } from '../service/kiosk-marking-session.service';

registerEnumType(AttendanceVerificationMethod, {
  name: 'AttendanceVerificationMethod',
  description: 'Método de verificación de identidad en marcación kiosko',
});

/** GraphQL enum distinto de MobileAttendanceEventType (mismo dominio ENTRY/EXIT). */
export enum KioskMarkingEventType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

registerEnumType(KioskMarkingEventType, {
  name: 'KioskMarkingEventType',
  description: 'ENTRY o EXIT en modo marcación kiosko',
});

function toAttendanceEventType(eventType: KioskMarkingEventType): AttendanceEventType {
  return eventType === KioskMarkingEventType.EXIT
    ? AttendanceEventType.EXIT
    : AttendanceEventType.ENTRY;
}

function toKioskEventType(eventType: AttendanceEventType): KioskMarkingEventType {
  return eventType === AttendanceEventType.EXIT
    ? KioskMarkingEventType.EXIT
    : KioskMarkingEventType.ENTRY;
}

// ── Session types ───────────────────────────────────────────────────────────

@InputType('ActivarModoMarcacionKioskoInput')
export class ActivarModoMarcacionKioskoInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  locationId!: string;
}

@ObjectType('ModoMarcacionKioskoSession')
export class ModoMarcacionKioskoSessionType {
  @Field()
  accessToken!: string;

  @Field()
  expiresAt!: Date;

  @Field(() => ID)
  locationId!: string;

  @Field(() => ID)
  sessionId!: string;
}

@InputType('SalirModoMarcacionKioskoInput')
export class SalirModoMarcacionKioskoInputType {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  adminPassword!: string;
}

// ── Employee list ───────────────────────────────────────────────────────────

@ObjectType('EmpleadoTurnoKiosko')
export class EmpleadoTurnoKioskoType {
  @Field(() => ID)
  employeeId!: string;

  @Field(() => ID)
  userId!: string;

  @Field()
  fullName!: string;

  @Field(() => String, { nullable: true })
  turnoLabel!: string | null;

  @Field(() => String, { nullable: true })
  turnoStartTime!: string | null;

  @Field(() => String, { nullable: true })
  turnoEndTime!: string | null;

  @Field()
  hasOpenEntry!: boolean;

  @Field(() => KioskMarkingEventType)
  suggestedEventType!: KioskMarkingEventType;

  @Field()
  hasPinConfigured!: boolean;

  @Field()
  hasFacialReference!: boolean;

  @Field()
  hasBiometricConsent!: boolean;
}

@ObjectType('FotoReferenciaKiosko')
export class FotoReferenciaKioskoType {
  @Field(() => ID)
  employeeId!: string;

  @Field()
  photoUrl!: string;

  @Field()
  expiresAt!: Date;
}

// ── Marking ─────────────────────────────────────────────────────────────────

@InputType('RegistrarMarcacionKioskoInput')
export class RegistrarMarcacionKioskoInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @Field(() => KioskMarkingEventType)
  @IsEnum(KioskMarkingEventType)
  eventType!: KioskMarkingEventType;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  storageObjectId!: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  facialMatchScore?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  facialMatchResult?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(6)
  pin?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  timestamp?: Date;
}

@ObjectType('MarcacionKioskoResult')
export class MarcacionKioskoResultType {
  @Field(() => ID)
  id!: string;

  @Field(() => KioskMarkingEventType)
  eventType!: KioskMarkingEventType;

  @Field()
  workDate!: string;

  @Field()
  timestamp!: Date;

  @Field(() => AttendanceVerificationMethod)
  verificationMethod!: AttendanceVerificationMethod;

  @Field()
  status!: string;
}

@InputType('VerificarPinEmpleadoKioskoInput')
export class VerificarPinEmpleadoKioskoInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(6)
  pin!: string;
}

@InputType('CorregirMarcacionKioskoInput')
export class CorregirMarcacionKioskoInputType {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  attendanceLogId!: string;

  @Field(() => KioskMarkingEventType)
  @IsEnum(KioskMarkingEventType)
  eventType!: KioskMarkingEventType;

  @Field()
  @Type(() => Date)
  @IsDate()
  timestamp!: Date;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  reason!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ObjectType('AnularMarcacionKioskoResult')
export class AnularMarcacionKioskoResultType {
  @Field(() => ID)
  id!: string;

  @Field()
  isActive!: boolean;
}

@ObjectType('CorregirMarcacionKioskoResult')
export class CorregirMarcacionKioskoResultType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID, { nullable: true })
  manualParentLogId!: string | null;
}

@Resolver()
export class KioskMarkingResolver {
  constructor(
    private readonly sessionService: KioskMarkingSessionService,
    private readonly markingService: KioskMarkingService,
  ) {}

  // ── Admin session (full JWT) ──────────────────────────────────────────────

  @Mutation(() => ModoMarcacionKioskoSessionType, {
    description: 'Activa modo marcación en tablet compartida y emite token scoped KIOSK_MARKING',
  })
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  @RequirePermission(KIOSK_ACTIVATE_PERMISSION)
  activarModoMarcacionKiosko(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: ActivarModoMarcacionKioskoInputType,
  ) {
    return this.sessionService.activar(input, {
      sub: user.sub,
      tenantId: user.tenantId ?? getTenantIdFromContext(context),
      roleCode: user.roleCode,
    });
  }

  @Mutation(() => Boolean, {
    description: 'Sale del modo marcación; requiere reautenticación del administrador',
  })
  @UseGuards(JwtAuthGuard, KioskMarkingGuard)
  salirModoMarcacionKiosko(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: SalirModoMarcacionKioskoInputType,
  ) {
    return this.sessionService.salir(input, this.toKioskToken(user));
  }

  // ── Kiosk-scoped operations ───────────────────────────────────────────────

  @Query(() => [EmpleadoTurnoKioskoType], {
    description:
      'Lista empleados con turno ASSIGNED hoy en la sede del token (plan aprobado + same-day CONN-12)',
  })
  @UseGuards(JwtAuthGuard, KioskMarkingGuard)
  empleadosTurnoHoyKiosko(
    @CurrentUser() user: JwtPayload,
    @Args('workDate', { type: () => String, nullable: true }) workDate?: string,
  ) {
    return this.markingService
      .listEmpleadosTurnoHoy(this.toKioskToken(user), workDate)
      .then((rows) =>
        rows.map((row) => ({
          ...row,
          suggestedEventType: toKioskEventType(row.suggestedEventType),
        })),
      );
  }

  @Query(() => FotoReferenciaKioskoType, {
    description: 'URL firmada de foto de referencia facial para match en cliente',
  })
  @UseGuards(JwtAuthGuard, KioskMarkingGuard)
  fotoReferenciaEmpleadoKiosko(
    @CurrentUser() user: JwtPayload,
    @Args('employeeId', { type: () => ID }) employeeId: string,
  ) {
    return this.markingService.getFotoReferencia(this.toKioskToken(user), employeeId);
  }

  @Mutation(() => MarcacionKioskoResultType, {
    description:
      'Registra ENTRY/EXIT kiosko con verificación facial automática o PIN de respaldo (sin aprobación admin)',
  })
  @UseGuards(JwtAuthGuard, KioskMarkingGuard)
  registrarMarcacionKiosko(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: RegistrarMarcacionKioskoInputType,
  ) {
    return this.markingService
      .registrarMarcacion(this.toKioskToken(user), {
        ...input,
        eventType: toAttendanceEventType(input.eventType),
      })
      .then((result) => ({
        ...result,
        eventType: toKioskEventType(result.eventType),
      }));
  }

  @Mutation(() => Boolean, {
    description: 'Valida PIN del empleado seleccionado (fallback); no emite JWT',
  })
  @UseGuards(JwtAuthGuard, KioskMarkingGuard)
  verificarPinEmpleadoKiosko(
    @CurrentUser() user: JwtPayload,
    @Args('input') input: VerificarPinEmpleadoKioskoInputType,
  ) {
    return this.markingService.verificarPin(this.toKioskToken(user), input);
  }

  // ── Supervisor corrections (full JWT, not kiosk token) ────────────────────

  @Mutation(() => AnularMarcacionKioskoResultType, {
    description: 'Anula marcación kiosko del día antes del corte CONN-11 (auditada)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  anularMarcacionKiosko(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('attendanceLogId', { type: () => ID }) attendanceLogId: string,
    @Args('reason') reason: string,
  ) {
    return this.markingService.anularMarcacion(attendanceLogId, reason, {
      sub: user.sub,
      tenantId: user.tenantId ?? getTenantIdFromContext(context),
      roleCode: user.roleCode,
    });
  }

  @Mutation(() => CorregirMarcacionKioskoResultType, {
    description: 'Corrige marcación kiosko pre-corte; post-corte retorna POST_CUTOFF_USE_NOVEDAD',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...PAYROLL_MODULE_ROLES)
  async corregirMarcacionKiosko(
    @CurrentUser() user: JwtPayload,
    @Context() context: GqlRequestContext,
    @Args('input') input: CorregirMarcacionKioskoInputType,
  ) {
    const created = await this.markingService.corregirMarcacion(
      {
        ...input,
        eventType: toAttendanceEventType(input.eventType),
      },
      {
        sub: user.sub,
        tenantId: user.tenantId ?? getTenantIdFromContext(context),
        roleCode: user.roleCode,
      },
    );
    return {
      id: created.id,
      manualParentLogId: created.manualParentLogId,
    };
  }

  private toKioskToken(user: JwtPayload): KioskTokenContext {
    if (!user.locationId || !user.sessionId) {
      throw new Error('Kiosk token missing locationId/sessionId');
    }
    return {
      sub: user.sub,
      tenantId: user.tenantId,
      locationId: user.locationId,
      sessionId: user.sessionId,
      roleCode: user.roleCode,
    };
  }
}
