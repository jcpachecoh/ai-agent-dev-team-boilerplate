import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AttendanceEventType,
  AttendanceLogSource,
  AttendanceValidationStatus,
  AttendanceVerificationMethod,
  StorageDomain,
  AuditAction,
  type AttendanceLog,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { AuditService } from '../../../audit/service/audit.service';
import { PAYROLL_MODULE_ROLES, SYSTEM_ADMIN_ROLES } from '../../../common/config/rbac.config';
import { UserLocationsService } from '../../../locations/service/user-locations.service';
import { StorageService } from '../../../storage/service/storage.service';
import { ShiftResolutionService } from '../../../turnos/service/shift-resolution.service';
import { normalizeWorkDate } from '../../repository/attendance.repository';
import { AttendanceService } from '../../service/attendance.service';
import { JornadaCutoffService } from '../../service/jornada-cutoff.service';
import type {
  CorregirMarcacionKioskoInput,
  EmpleadoTurnoKioskoResult,
  FotoReferenciaKioskoResult,
  IKioskMarkingService,
  KioskTokenContext,
  MarcacionKioskoResult,
  RegistrarMarcacionKioskoInput,
  VerificarPinEmpleadoKioskoInput,
  AnularMarcacionKioskoResult,
} from '../interfaces/kiosk-marking.interfaces';
import {
  KIOSK_FACIAL_THRESHOLD,
  POST_CUTOFF_USE_NOVEDAD,
} from '../interfaces/kiosk-marking.interfaces';
import { KioskMarkingRepository } from '../repository/kiosk-marking.repository';
import type { KioskEmployeeRow } from '../repository/kiosk-marking.repository';

const FACIAL_REFERENCE_URL_TTL_SECONDS = 600;
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

@Injectable()
export class KioskMarkingService implements IKioskMarkingService {
  constructor(
    private readonly kioskRepository: KioskMarkingRepository,
    private readonly shiftResolutionService: ShiftResolutionService,
    private readonly attendanceService: AttendanceService,
    private readonly jornadaCutoffService: JornadaCutoffService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly userLocationsService: UserLocationsService,
  ) {}

  async listEmpleadosTurnoHoy(
    token: KioskTokenContext,
    workDate?: string | null,
  ): Promise<EmpleadoTurnoKioskoResult[]> {
    const day = this.resolveWorkDate(workDate);
    const candidates = await this.loadCandidateEmployees(token.tenantId, token.locationId, day);

    const results: EmpleadoTurnoKioskoResult[] = [];
    const policyVersion = await this.kioskRepository.findActivePolicyVersion(token.tenantId);

    for (const employee of candidates) {
      const resolved = await this.shiftResolutionService.resolveForDay({
        tenantId: token.tenantId,
        employeeId: employee.id,
        locationId: token.locationId,
        workDate: day,
      });
      if (resolved.kind !== 'ASSIGNED') {
        continue;
      }

      const openEntry = await this.kioskRepository.findOpenEntry(employee.id);
      const hasFacialReference = Boolean(
        employee.personalData?.profilePhotoStorageObjectId ?? employee.photoStorageObjectId,
      );
      const hasBiometricConsent =
        policyVersion != null
          ? await this.kioskRepository.hasActiveBiometricConsent(
              token.tenantId,
              employee.id,
              policyVersion,
            )
          : false;

      results.push({
        employeeId: employee.id,
        userId: employee.userId,
        fullName: employee.name,
        turnoLabel: resolved.turno.nombre,
        turnoStartTime: resolved.turno.horaInicio,
        turnoEndTime: resolved.turno.horaFin,
        hasOpenEntry: Boolean(openEntry),
        suggestedEventType: openEntry ? AttendanceEventType.EXIT : AttendanceEventType.ENTRY,
        hasPinConfigured: Boolean(employee.pinHash),
        hasFacialReference,
        hasBiometricConsent,
      });
    }

    return results.sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
  }

  async getFotoReferencia(
    token: KioskTokenContext,
    employeeId: string,
  ): Promise<FotoReferenciaKioskoResult> {
    await this.assertEmployeeOnDutyToday(token, employeeId);

    const employee = await this.kioskRepository.findEmployeeById(employeeId, token.tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const referenceStorageObjectId =
      employee.personalData?.profilePhotoStorageObjectId ?? employee.photoStorageObjectId ?? null;
    if (!referenceStorageObjectId) {
      throw new NotFoundException('Empleado sin foto de referencia facial');
    }

    const photoUrl = await this.storageService.getPresignedUrl(
      referenceStorageObjectId,
      token.tenantId,
      FACIAL_REFERENCE_URL_TTL_SECONDS,
    );

    return {
      employeeId,
      photoUrl,
      expiresAt: new Date(Date.now() + FACIAL_REFERENCE_URL_TTL_SECONDS * 1000),
    };
  }

  async registrarMarcacion(
    token: KioskTokenContext,
    input: RegistrarMarcacionKioskoInput,
  ): Promise<MarcacionKioskoResult> {
    await this.assertEmployeeOnDutyToday(token, input.employeeId);

    const employee = await this.kioskRepository.findEmployeeById(input.employeeId, token.tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    const now = new Date();
    const timestamp = input.timestamp ?? now;
    if (Math.abs(timestamp.getTime() - now.getTime()) > MAX_TIMESTAMP_DRIFT_MS) {
      throw new BadRequestException('Timestamp demasiado desfasado (máximo 5 minutos)');
    }

    const verificationMethod = await this.resolveVerificationMethod(token, employee, input);

    const storageObj = await this.storageService.findById(input.storageObjectId, token.tenantId);
    if (storageObj.domain !== StorageDomain.PAYROLL) {
      throw new BadRequestException('storageObjectId debe ser del dominio PAYROLL');
    }
    // Foto capturada en tablet: pertenece al admin que activó el modo (o al mismo sub del token).
    if (storageObj.uploadedBy !== token.sub) {
      throw new ForbiddenException('storageObjectId no pertenece a la sesión kiosko');
    }

    const log = await this.attendanceService.registerEvent({
      tenantId: token.tenantId,
      employeeId: employee.id,
      locationId: token.locationId,
      eventType: input.eventType,
      source: AttendanceLogSource.KIOSK,
      timestamp,
      notes: input.notes ?? null,
      storageObjectId: input.storageObjectId,
      photoUrl: storageObj.publicUrl,
      facialMatchScore: input.facialMatchScore ?? null,
      facialMatchResult: input.facialMatchResult ?? null,
      createdByUserId: token.sub,
      verificationMethod,
      kioskSessionId: token.sessionId,
      validationStatus: AttendanceValidationStatus.VALID,
    });

    return {
      id: log.id,
      eventType: log.eventType,
      workDate: this.kioskRepository.formatWorkDate(log.workDate),
      timestamp: log.timestamp,
      verificationMethod,
      status: 'REGISTERED',
    };
  }

  async verificarPin(
    token: KioskTokenContext,
    input: VerificarPinEmpleadoKioskoInput,
  ): Promise<boolean> {
    await this.assertEmployeeOnDutyToday(token, input.employeeId);
    const employee = await this.kioskRepository.findEmployeeById(input.employeeId, token.tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }
    await this.assertPinValid(employee, input.pin);
    return true;
  }

  async anularMarcacion(
    attendanceLogId: string,
    reason: string,
    actor: { sub: string; tenantId: string; roleCode: string },
  ): Promise<AnularMarcacionKioskoResult> {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new BadRequestException('Motivo de anulación requerido');
    }

    const log = await this.requireKioskLog(attendanceLogId, actor.tenantId);
    await this.assertSupervisorAccess(actor, log.locationId);
    await this.assertBeforeCutoffOrRedirect(actor.tenantId, log.employeeId, log.workDate);

    if (!log.isActive) {
      throw new ConflictException('La marcación ya está anulada');
    }

    const updated = await this.kioskRepository.deactivateLog(log.id, actor.tenantId);

    await this.auditService.log({
      tenantId: actor.tenantId,
      action: AuditAction.UPDATE,
      entityType: 'AttendanceLog',
      entityId: log.id,
      actorUserId: actor.sub,
      oldValue: this.serializeLog(log),
      newValue: this.serializeLog(updated),
      payload: {
        reason: trimmedReason,
        source: 'KIOSK',
        operation: 'anularMarcacionKiosko',
      },
    });

    return { id: updated.id, isActive: updated.isActive };
  }

  async corregirMarcacion(
    input: CorregirMarcacionKioskoInput,
    actor: { sub: string; tenantId: string; roleCode: string },
  ): Promise<AttendanceLog> {
    const trimmedReason = input.reason.trim();
    if (!trimmedReason) {
      throw new BadRequestException('Motivo de corrección requerido');
    }

    const parent = await this.requireKioskLog(input.attendanceLogId, actor.tenantId);
    await this.assertSupervisorAccess(actor, parent.locationId);
    await this.assertBeforeCutoffOrRedirect(actor.tenantId, parent.employeeId, parent.workDate);

    const created = await this.attendanceService.registerEvent({
      tenantId: actor.tenantId,
      employeeId: parent.employeeId,
      locationId: parent.locationId,
      eventType: input.eventType,
      source: AttendanceLogSource.MANUAL,
      timestamp: input.timestamp,
      workDate: parent.workDate,
      notes: input.notes ?? null,
      createdByUserId: actor.sub,
      manualReason: trimmedReason,
      manualParentLogId: parent.id,
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      action: AuditAction.CREATE,
      entityType: 'AttendanceLog',
      entityId: created.id,
      actorUserId: actor.sub,
      oldValue: this.serializeLog(parent),
      newValue: this.serializeLog(created),
      payload: {
        reason: trimmedReason,
        parentLogId: parent.id,
        source: 'KIOSK',
        operation: 'corregirMarcacionKiosko',
      },
    });

    return created;
  }

  private async resolveVerificationMethod(
    token: KioskTokenContext,
    employee: KioskEmployeeRow,
    input: RegistrarMarcacionKioskoInput,
  ): Promise<AttendanceVerificationMethod> {
    const policyVersion = await this.kioskRepository.findActivePolicyVersion(token.tenantId);
    const hasConsent =
      policyVersion != null
        ? await this.kioskRepository.hasActiveBiometricConsent(
            token.tenantId,
            employee.id,
            policyVersion,
          )
        : false;

    const hasFacialReference = Boolean(
      employee.personalData?.profilePhotoStorageObjectId ?? employee.photoStorageObjectId,
    );

    const score = input.facialMatchScore;
    const facialOk =
      hasConsent && hasFacialReference && score != null && score >= KIOSK_FACIAL_THRESHOLD;

    if (facialOk) {
      return AttendanceVerificationMethod.FACIAL_MATCH;
    }

    // Sin consentimiento / match bajo → PIN obligatorio (admin nunca aprueba identidad).
    if (!input.pin) {
      throw new UnauthorizedException(
        'Match facial insuficiente o sin consentimiento. PIN del empleado requerido',
      );
    }

    await this.assertPinValid(employee, input.pin);
    return AttendanceVerificationMethod.PIN;
  }

  private async assertPinValid(employee: KioskEmployeeRow, pin: string): Promise<void> {
    if (!employee.pinHash) {
      throw new UnprocessableEntityException('PIN no configurado');
    }
    const ok = await bcrypt.compare(pin, employee.pinHash);
    if (!ok) {
      throw new UnauthorizedException('PIN incorrecto');
    }
  }

  private async assertEmployeeOnDutyToday(
    token: KioskTokenContext,
    employeeId: string,
  ): Promise<void> {
    const day = this.resolveWorkDate(null);
    const resolved = await this.shiftResolutionService.resolveForDay({
      tenantId: token.tenantId,
      employeeId,
      locationId: token.locationId,
      workDate: day,
    });
    if (resolved.kind !== 'ASSIGNED') {
      throw new ForbiddenException('El empleado no tiene turno asignado hoy en esta sede');
    }
  }

  private async loadCandidateEmployees(
    tenantId: string,
    locationId: string,
    workDate: Date,
  ): Promise<KioskEmployeeRow[]> {
    const atLocation = await this.kioskRepository.findEmployeesAtLocation(locationId, tenantId);
    const assignmentIds = await this.kioskRepository.findEmployeeIdsWithAssignmentAtLocation(
      tenantId,
      locationId,
      workDate,
    );
    const missingIds = assignmentIds.filter((id) => !atLocation.some((e) => e.id === id));
    const extras = await this.kioskRepository.findEmployeesByIds(tenantId, missingIds);
    const byId = new Map<string, KioskEmployeeRow>();
    for (const row of [...atLocation, ...extras]) {
      byId.set(row.id, row);
    }
    return [...byId.values()];
  }

  private resolveWorkDate(workDate?: string | null): Date {
    if (!workDate?.trim()) {
      return normalizeWorkDate(new Date());
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(workDate.trim());
    if (!match) {
      throw new BadRequestException('workDate debe ser YYYY-MM-DD');
    }
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  private async requireKioskLog(id: string, tenantId: string): Promise<AttendanceLog> {
    const log = await this.kioskRepository.findKioskLogById(id, tenantId);
    if (!log) {
      throw new NotFoundException('Marcación kiosko no encontrada');
    }
    return log;
  }

  private async assertSupervisorAccess(
    actor: { sub: string; tenantId: string; roleCode: string },
    locationId: string,
  ): Promise<void> {
    const isAdmin = (SYSTEM_ADMIN_ROLES as readonly string[]).includes(actor.roleCode);
    const isPayroll = (PAYROLL_MODULE_ROLES as readonly string[]).includes(actor.roleCode);
    if (!isAdmin && !isPayroll) {
      throw new ForbiddenException('No tiene permiso para corregir marcaciones kiosko');
    }
    const allowed = await this.userLocationsService.resolveAllowedLocationIds(actor.tenantId, {
      userId: actor.sub,
      roleCode: actor.roleCode,
    });
    this.userLocationsService.assertLocationAllowed(allowed, locationId);
  }

  private async assertBeforeCutoffOrRedirect(
    tenantId: string,
    employeeId: string,
    workDate: Date,
  ): Promise<void> {
    const beforeCutoff = await this.jornadaCutoffService.isBeforeCutoff(
      tenantId,
      employeeId,
      workDate,
    );
    if (!beforeCutoff) {
      throw new GraphQLError('La jornada ya fue cerrada. Use el flujo de novedades.', {
        extensions: { code: POST_CUTOFF_USE_NOVEDAD },
      });
    }
  }

  private serializeLog(log: AttendanceLog): Record<string, unknown> {
    return {
      id: log.id,
      employeeId: log.employeeId,
      locationId: log.locationId,
      eventType: log.eventType,
      timestamp: log.timestamp.toISOString(),
      workDate: log.workDate.toISOString(),
      source: log.source,
      isActive: log.isActive,
      verificationMethod: log.verificationMethod ?? null,
      kioskSessionId: log.kioskSessionId ?? null,
      notes: log.notes,
    };
  }
}
