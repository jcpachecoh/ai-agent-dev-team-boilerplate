import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NovedadRequestSource, NovedadStatus, NovedadType } from '@prisma/client';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import type {
  EditNovedadInput,
  EditNovedadResult,
  EditableNovedadSnapshot,
  IPayrollNovedadesService,
  NovedadAuditLogRecord,
  NovedadListFilters,
  PayrollNovedadRecord,
  PayrollNovedadSummary,
  PayrollNovedadSupportDocumentFile,
  RejectNovedadInput,
  SubmitNovedadInput,
  SubmitNovedadResult,
} from '../interfaces/payroll-novedades.interfaces';
import { PayrollNovedadesRepository } from '../repository/payroll-novedades.repository';
import { NovedadTypeConfigService } from './novedad-type-config.service';
import {
  NO_SUPERVISOR_ASSIGNED_WARNING,
  PayrollNovedadesNotificationService,
} from './payroll-novedades-notification.service';
import {
  NOVEDAD_CONSUMED_BY_PROCESSED_PAYROLL_CODE,
  NOVEDAD_EDIT_BLOCKED_PROCESSED_PAYROLL_MESSAGE,
} from '../constants/payroll-novedades.constants';
import { calculateLutoEndDate } from '../utils/luto-end-date.util';

const SUPERVISOR_ROLES = new Set(['SUPERVISOR', 'MANAGER']);
const RRHH_ROLES = new Set(['NOMINA', 'OWNER', 'SUPER_ADMIN']);
const VIEW_ROLES = new Set(['NOMINA', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR', 'MANAGER']);
const RRHH_WRITE_ROLES = new Set(['NOMINA', 'OWNER', 'SUPER_ADMIN']);

const ALLOWED_SUPPORT_DOCUMENT_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const SUPPORT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const SUPPORT_DOCUMENT_PRESIGNED_TTL_SECONDS = 3600;

@Injectable()
export class PayrollNovedadesService implements IPayrollNovedadesService {
  constructor(
    private readonly repository: PayrollNovedadesRepository,
    private readonly typeConfigService: NovedadTypeConfigService,
    private readonly userLocationsService: UserLocationsService,
    private readonly storageService: StorageService,
    private readonly notificationService: PayrollNovedadesNotificationService,
  ) {}

  async submit(
    tenantId: string,
    actorUserId: string,
    input: SubmitNovedadInput,
  ): Promise<SubmitNovedadResult> {
    await this.assertCanSubmit(tenantId, actorUserId, input);

    const typeConfig = await this.typeConfigService.getConfigForTenant(tenantId, input.type);

    let startDate = input.startDate;
    let endDate = input.endDate;

    if (input.type === NovedadType.LICENCIA_LUTO) {
      endDate = calculateLutoEndDate(startDate);
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      );
    }

    if (typeConfig.requiresSupportDocument && !input.supportStorageObjectId) {
      throw new BadRequestException('Este tipo de novedad requiere adjuntar un soporte');
    }

    if (
      input.type === NovedadType.AUSENCIA_INJUSTIFICADA &&
      input.requestedBy !== NovedadRequestSource.RRHH
    ) {
      throw new ForbiddenException('La ausencia injustificada solo puede registrarla RRHH');
    }

    if (
      input.type === NovedadType.CALAMIDAD_DOMESTICA &&
      input.requestedBy === NovedadRequestSource.EMPLEADO
    ) {
      throw new ForbiddenException(
        'La calamidad doméstica solo puede registrarse por RRHH o el líder inmediato',
      );
    }

    if (
      input.requestedBy === NovedadRequestSource.EMPLEADO &&
      typeConfig.autoSolicitable === false
    ) {
      throw new ForbiddenException('Este tipo de novedad no está disponible para autosolicitud');
    }

    const overlap = await this.repository.findOverlapping(
      tenantId,
      input.employeeId,
      startDate,
      endDate,
    );
    if (overlap.hasOverlap && !input.overlapWarningAck) {
      throw new ConflictException({
        message: 'Existen novedades con fechas solapadas para este empleado',
        conflictingNovedadIds: overlap.conflictingNovedadIds,
      });
    }

    const isPaid =
      input.type === NovedadType.LICENCIA_LUTO ? true : (input.isPaid ?? typeConfig.isPaidDefault);
    const warnings: string[] = [];
    let status: NovedadStatus;

    if (input.requestedBy === NovedadRequestSource.RRHH) {
      if (input.autoApprove) {
        status = NovedadStatus.APROBADA;
      } else {
        status = NovedadStatus.PENDIENTE_RRHH;
      }
    } else if (typeConfig.requiresSupervisorApproval) {
      const hasSupervisor = await this.hasResolvableSupervisor(tenantId, input.employeeId);
      if (hasSupervisor) {
        status = NovedadStatus.PENDIENTE_SUPERVISOR;
      } else {
        status = NovedadStatus.PENDIENTE_RRHH;
        warnings.push(NO_SUPERVISOR_ASSIGNED_WARNING);
      }
    } else {
      status = NovedadStatus.PENDIENTE_RRHH;
    }

    const now = new Date();
    const novedad = await this.repository.create(tenantId, {
      employeeId: input.employeeId,
      type: input.type,
      startDate,
      endDate,
      isPaid,
      supportStorageObjectId: input.supportStorageObjectId ?? null,
      notes: input.notes ?? null,
      requestedBy: input.requestedBy,
      status,
      overlapWarningAck: input.overlapWarningAck ?? false,
      ...(status === NovedadStatus.APROBADA
        ? { rrhhApproverId: actorUserId, rrhhDecisionAt: now }
        : {}),
    });

    await this.dispatchNotifications(tenantId, novedad, warnings);

    return { novedad, warnings: warnings.length > 0 ? warnings : undefined };
  }

  async edit(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
    input: EditNovedadInput,
  ): Promise<EditNovedadResult> {
    await this.assertCanEdit(tenantId, actorUserId);

    const current = await this.requireNovedad(tenantId, novedadId);

    if (!current.isEditable) {
      throw new ForbiddenException('Esta novedad no puede editarse');
    }

    if (current.status === NovedadStatus.RECHAZADA) {
      throw new BadRequestException('No se puede editar una novedad rechazada');
    }

    if (await this.repository.isConsumedByProcessedPayroll(tenantId, current)) {
      throw new ConflictException({
        statusCode: 409,
        code: NOVEDAD_CONSUMED_BY_PROCESSED_PAYROLL_CODE,
        message: NOVEDAD_EDIT_BLOCKED_PROCESSED_PAYROLL_MESSAGE,
      });
    }

    const previousValue = this.toEditableSnapshot(current);
    const nextStartDate = input.startDate ?? current.startDate;
    let nextEndDate = input.endDate ?? current.endDate;
    const nextIsPaid =
      current.type === NovedadType.LICENCIA_LUTO ? true : (input.isPaid ?? current.isPaid);
    const nextNotes = input.notes !== undefined ? input.notes.trim() || null : current.notes;

    if (current.type === NovedadType.LICENCIA_LUTO) {
      nextEndDate = calculateLutoEndDate(nextStartDate);
    }

    if (nextStartDate > nextEndDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      );
    }

    const overlap = await this.repository.findOverlapping(
      tenantId,
      current.employeeId,
      nextStartDate,
      nextEndDate,
      current.id,
    );
    if (overlap.hasOverlap && !input.overlapWarningAck) {
      throw new ConflictException({
        message: 'Existen novedades con fechas solapadas para este empleado',
        conflictingNovedadIds: overlap.conflictingNovedadIds,
      });
    }

    const newValue: EditableNovedadSnapshot = {
      startDate: this.formatDateOnly(nextStartDate),
      endDate: this.formatDateOnly(nextEndDate),
      isPaid: nextIsPaid,
      notes: nextNotes,
    };

    if (JSON.stringify(previousValue) === JSON.stringify(newValue)) {
      throw new BadRequestException('No hay cambios para guardar');
    }

    const updated = await this.repository.updateEditableFields(
      tenantId,
      novedadId,
      {
        startDate: nextStartDate,
        endDate: nextEndDate,
        isPaid: nextIsPaid,
        notes: nextNotes,
      },
      {
        changedBy: actorUserId,
        previousValue,
        newValue,
      },
    );

    const auditLogs = await this.repository.listAuditLogsByNovedadId(tenantId, novedadId);
    const auditLog = auditLogs[0];
    if (!auditLog) {
      throw new BadRequestException('No se pudo registrar la auditoría de la edición');
    }

    return { novedad: updated, auditLog };
  }

  async listAuditLogs(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
  ): Promise<NovedadAuditLogRecord[]> {
    const novedad = await this.requireNovedad(tenantId, novedadId);
    await this.assertCanEdit(tenantId, actorUserId);
    await this.assertCanViewNovedad(tenantId, actorUserId, novedad);
    return this.repository.listAuditLogsByNovedadId(tenantId, novedadId);
  }

  async approveBySupervisor(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
  ): Promise<PayrollNovedadRecord> {
    const novedad = await this.requireNovedad(tenantId, novedadId);
    if (novedad.status !== NovedadStatus.PENDIENTE_SUPERVISOR) {
      throw new BadRequestException('La novedad no está pendiente de aprobación del supervisor');
    }

    await this.assertSupervisorCanActOnEmployee(tenantId, actorUserId, novedad.employeeId);

    const updated = await this.repository.update(tenantId, novedadId, {
      status: NovedadStatus.PENDIENTE_RRHH,
      supervisorApproverId: actorUserId,
      supervisorDecisionAt: new Date(),
    });

    await this.dispatchNotifications(tenantId, updated);
    return updated;
  }

  async rejectBySupervisor(
    tenantId: string,
    actorUserId: string,
    input: RejectNovedadInput,
  ): Promise<PayrollNovedadRecord> {
    if (!input.rejectionReason?.trim()) {
      throw new BadRequestException('El motivo de rechazo es obligatorio');
    }

    const novedad = await this.requireNovedad(tenantId, input.novedadId);
    if (novedad.status !== NovedadStatus.PENDIENTE_SUPERVISOR) {
      throw new BadRequestException('La novedad no está pendiente de aprobación del supervisor');
    }

    await this.assertSupervisorCanActOnEmployee(tenantId, actorUserId, novedad.employeeId);

    const updated = await this.repository.update(tenantId, input.novedadId, {
      status: NovedadStatus.RECHAZADA,
      supervisorApproverId: actorUserId,
      supervisorDecisionAt: new Date(),
      supervisorComment: input.comment?.trim() ?? null,
      rejectionReason: input.rejectionReason.trim(),
    });

    await this.dispatchNotifications(tenantId, updated);
    return updated;
  }

  async approveByRRHH(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
  ): Promise<PayrollNovedadRecord> {
    const novedad = await this.requireNovedad(tenantId, novedadId);
    if (novedad.status !== NovedadStatus.PENDIENTE_RRHH) {
      throw new BadRequestException('La novedad no está pendiente de aprobación de RRHH');
    }

    await this.assertCanApproveRrhh(tenantId, actorUserId);

    const updated = await this.repository.update(tenantId, novedadId, {
      status: NovedadStatus.APROBADA,
      rrhhApproverId: actorUserId,
      rrhhDecisionAt: new Date(),
    });

    await this.dispatchNotifications(tenantId, updated);
    return updated;
  }

  async rejectByRRHH(
    tenantId: string,
    actorUserId: string,
    input: RejectNovedadInput,
  ): Promise<PayrollNovedadRecord> {
    if (!input.rejectionReason?.trim()) {
      throw new BadRequestException('El motivo de rechazo es obligatorio');
    }

    const novedad = await this.requireNovedad(tenantId, input.novedadId);
    if (novedad.status !== NovedadStatus.PENDIENTE_RRHH) {
      throw new BadRequestException('La novedad no está pendiente de aprobación de RRHH');
    }

    await this.assertCanApproveRrhh(tenantId, actorUserId);

    const updated = await this.repository.update(tenantId, input.novedadId, {
      status: NovedadStatus.RECHAZADA,
      rrhhApproverId: actorUserId,
      rrhhDecisionAt: new Date(),
      rejectionReason: input.rejectionReason.trim(),
    });

    await this.dispatchNotifications(tenantId, updated);
    return updated;
  }

  async list(
    tenantId: string,
    actorUserId: string,
    filters: NovedadListFilters,
  ): Promise<PayrollNovedadSummary[]> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor || !VIEW_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para consultar novedades');
    }

    const scopedFilters = { ...filters };

    if (filters.supervisorInbox && SUPERVISOR_ROLES.has(actor.roleCode)) {
      scopedFilters.status = [NovedadStatus.PENDIENTE_SUPERVISOR];
      const employeeIds = await this.findSupervisableEmployeeIds(tenantId, actorUserId);
      scopedFilters.employeeIds = employeeIds;
      if (employeeIds.length === 0) {
        return [];
      }
    } else if (filters.rrhhInbox && RRHH_ROLES.has(actor.roleCode)) {
      scopedFilters.status = [NovedadStatus.PENDIENTE_RRHH];
    } else if (SUPERVISOR_ROLES.has(actor.roleCode) && !RRHH_ROLES.has(actor.roleCode)) {
      const employeeIds = await this.findSupervisableEmployeeIds(tenantId, actorUserId);
      scopedFilters.employeeIds = employeeIds;
      if (employeeIds.length === 0) {
        return [];
      }
    }

    const rows = await this.repository.listSummaries(tenantId, scopedFilters);
    return this.enrichSummaries(tenantId, rows);
  }

  async listMyNovedades(
    tenantId: string,
    actorUserId: string,
    filters: Omit<
      NovedadListFilters,
      'employeeId' | 'supervisorInbox' | 'rrhhInbox' | 'employeeIds'
    >,
  ): Promise<PayrollNovedadSummary[]> {
    const employeeId = await this.repository.findEmployeeIdByUserId(tenantId, actorUserId);
    if (!employeeId) {
      throw new ForbiddenException('No se encontró un empleado vinculado a su usuario');
    }

    const rows = await this.repository.listSummaries(tenantId, { ...filters, employeeId });
    return this.enrichSummaries(tenantId, rows);
  }

  async listEmployeeTypeConfigs(tenantId: string): Promise<
    Array<{
      id: string;
      type: NovedadType;
      requiresSupervisorApproval: boolean;
      requiresSupportDocument: boolean;
      isPaidDefault: boolean;
      autoSolicitable: boolean;
    }>
  > {
    const rows = await this.typeConfigService.listConfigs(tenantId);
    return rows
      .filter(
        (row) => row.type !== NovedadType.AUSENCIA_INJUSTIFICADA && row.autoSolicitable === true,
      )
      .map((row) => ({
        id: row.id,
        type: row.type,
        requiresSupervisorApproval: row.requiresSupervisorApproval,
        requiresSupportDocument: row.requiresSupportDocument,
        isPaidDefault: row.isPaidDefault,
        autoSolicitable: row.autoSolicitable,
      }));
  }

  async findOne(tenantId: string, actorUserId: string, id: string): Promise<PayrollNovedadRecord> {
    const novedad = await this.requireNovedad(tenantId, id);
    await this.assertCanViewNovedad(tenantId, actorUserId, novedad);
    return novedad;
  }

  async attachSupportDocument(
    tenantId: string,
    actorUserId: string,
    novedadId: string,
    file: PayrollNovedadSupportDocumentFile,
  ): Promise<PayrollNovedadRecord> {
    await this.assertCanWriteSupport(tenantId, actorUserId);
    await this.requireNovedad(tenantId, novedadId);
    this.assertValidSupportDocument(file);

    const stored = await this.storageService.uploadFile({
      tenantId,
      uploadedBy: actorUserId,
      domain: StorageDomain.PAYROLL,
      entityType: 'PayrollNovedad',
      entityId: novedadId,
      visibility: StorageVisibility.PRIVATE,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
    });

    return this.repository.update(tenantId, novedadId, {
      supportStorageObjectId: stored.id,
    });
  }

  async getSupportDocumentUrl(tenantId: string, actorUserId: string, id: string): Promise<string> {
    const novedad = await this.requireNovedad(tenantId, id);
    await this.assertCanViewNovedad(tenantId, actorUserId, novedad);

    if (!novedad.supportStorageObjectId) {
      throw new NotFoundException('La novedad no tiene soporte adjunto');
    }

    return this.storageService.getPresignedUrl(
      novedad.supportStorageObjectId,
      tenantId,
      SUPPORT_DOCUMENT_PRESIGNED_TTL_SECONDS,
    );
  }

  async assertSupervisorCanActOnEmployee(
    tenantId: string,
    actorUserId: string,
    employeeId: string,
  ): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor || !SUPERVISOR_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para actuar como supervisor');
    }

    const employee = await this.repository.findEmployeeApprovalContext(tenantId, employeeId);
    if (!employee) {
      throw new NotFoundException(`Empleado ${employeeId} no encontrado`);
    }

    const actorLocations = await this.userLocationsService.getActiveUserLocations(
      tenantId,
      actorUserId,
    );
    const sharesLocation = actorLocations.some((location) => location.id === employee.locationId);
    if (!sharesLocation) {
      throw new ForbiddenException('No puede actuar sobre empleados de otra sede');
    }

    if (!actor.positionId || !employee.positionId) {
      return;
    }

    const subordinatePositionIds = await this.repository.findSubordinatePositionIds(
      tenantId,
      actor.positionId,
    );
    if (subordinatePositionIds.length === 0) {
      return;
    }

    if (!subordinatePositionIds.includes(employee.positionId)) {
      throw new ForbiddenException(
        'No puede actuar sobre empleados fuera de su jerarquía de cargo',
      );
    }
  }

  private async assertCanSubmit(
    tenantId: string,
    actorUserId: string,
    input: SubmitNovedadInput,
  ): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    if (input.requestedBy === NovedadRequestSource.RRHH) {
      if (!RRHH_WRITE_ROLES.has(actor.roleCode) && !SUPERVISOR_ROLES.has(actor.roleCode)) {
        throw new ForbiddenException(
          'Solo RRHH o el líder inmediato puede registrar novedades en nombre del empleado',
        );
      }
      return;
    }

    const actorEmployeeId = await this.repository.findEmployeeIdByUserId(tenantId, actorUserId);
    if (actorEmployeeId !== input.employeeId) {
      throw new ForbiddenException('Solo puede solicitar novedades para su propio perfil');
    }
  }

  private async assertCanApproveRrhh(tenantId: string, actorUserId: string): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor || !RRHH_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para aprobar como RRHH');
    }
  }

  private async assertCanViewNovedad(
    tenantId: string,
    actorUserId: string,
    novedad: PayrollNovedadRecord,
  ): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor) {
      throw new ForbiddenException('No tiene permiso para ver esta novedad');
    }

    const actorEmployeeId = await this.repository.findEmployeeIdByUserId(tenantId, actorUserId);
    if (actorEmployeeId === novedad.employeeId) {
      return;
    }

    if (!VIEW_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para ver esta novedad');
    }

    if (RRHH_ROLES.has(actor.roleCode)) {
      return;
    }

    if (SUPERVISOR_ROLES.has(actor.roleCode)) {
      try {
        await this.assertSupervisorCanActOnEmployee(tenantId, actorUserId, novedad.employeeId);
      } catch {
        throw new ForbiddenException('No tiene permiso para ver esta novedad');
      }
      return;
    }

    throw new ForbiddenException('No tiene permiso para ver esta novedad');
  }

  private async assertCanWriteSupport(tenantId: string, actorUserId: string): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor || !RRHH_WRITE_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para adjuntar soporte');
    }
  }

  private async hasResolvableSupervisor(tenantId: string, employeeId: string): Promise<boolean> {
    const employee = await this.repository.findEmployeeApprovalContext(tenantId, employeeId);
    if (!employee) {
      return false;
    }

    const supervisors = await this.repository.findSupervisorCandidatesInLocation(
      tenantId,
      employee.locationId,
    );

    for (const supervisor of supervisors) {
      try {
        await this.assertSupervisorCanActOnEmployee(tenantId, supervisor.id, employeeId);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  private async findSupervisableEmployeeIds(
    tenantId: string,
    actorUserId: string,
  ): Promise<string[]> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor?.positionId) {
      return [];
    }

    const actorLocations = await this.userLocationsService.getActiveUserLocations(
      tenantId,
      actorUserId,
    );
    const locationIds = actorLocations.map((l) => l.id);
    if (locationIds.length === 0) {
      return [];
    }

    const subordinatePositionIds = await this.repository.findSubordinatePositionIds(
      tenantId,
      actor.positionId,
    );

    return this.repository.findEmployeeIdsInScope(tenantId, locationIds, subordinatePositionIds);
  }

  private assertValidSupportDocument(file: PayrollNovedadSupportDocumentFile): void {
    const normalizedMime = file.mimetype.toLowerCase();
    if (!ALLOWED_SUPPORT_DOCUMENT_MIME_TYPES.has(normalizedMime)) {
      throw new BadRequestException('Tipo de archivo no permitido. Use PDF, JPEG o PNG.');
    }
    if (file.size > SUPPORT_DOCUMENT_MAX_BYTES) {
      throw new BadRequestException('El soporte no puede superar 10 MB');
    }
  }

  private async requireNovedad(tenantId: string, id: string): Promise<PayrollNovedadRecord> {
    const novedad = await this.repository.findById(tenantId, id);
    if (!novedad) {
      throw new NotFoundException(`Novedad ${id} no encontrada`);
    }
    return novedad;
  }

  private async assertCanEdit(tenantId: string, actorUserId: string): Promise<void> {
    const actor = await this.repository.findActorUser(tenantId, actorUserId);
    if (!actor || !RRHH_WRITE_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('No tiene permiso para editar novedades');
    }
  }

  private async enrichSummaries(
    tenantId: string,
    rows: PayrollNovedadSummary[],
  ): Promise<PayrollNovedadSummary[]> {
    return Promise.all(
      rows.map(async (row) => {
        if (!row.isEditable) {
          return { ...row, editBlockedReason: 'Esta novedad no puede editarse' };
        }

        const consumed = await this.repository.isConsumedByProcessedPayroll(tenantId, row);
        return {
          ...row,
          editBlockedReason: consumed ? NOVEDAD_EDIT_BLOCKED_PROCESSED_PAYROLL_MESSAGE : null,
        };
      }),
    );
  }

  private toEditableSnapshot(novedad: PayrollNovedadRecord): EditableNovedadSnapshot {
    return {
      startDate: this.formatDateOnly(novedad.startDate),
      endDate: this.formatDateOnly(novedad.endDate),
      isPaid: novedad.isPaid,
      notes: novedad.notes,
    };
  }

  private formatDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private async dispatchNotifications(
    tenantId: string,
    novedad: PayrollNovedadRecord,
    warnings: string[] = [],
  ): Promise<void> {
    try {
      const employee = await this.repository.findEmployeeApprovalContext(
        tenantId,
        novedad.employeeId,
      );

      if (novedad.status === NovedadStatus.PENDIENTE_SUPERVISOR) {
        const supervisors = employee
          ? await this.repository.findSupervisorCandidatesInLocation(tenantId, employee.locationId)
          : [];
        const eligible = [];
        for (const supervisor of supervisors) {
          try {
            await this.assertSupervisorCanActOnEmployee(
              tenantId,
              supervisor.id,
              novedad.employeeId,
            );
            eligible.push(supervisor.id);
          } catch {
            // skip
          }
        }
        if (eligible.length > 0) {
          await this.notificationService.notifySupervisorPending(tenantId, eligible, novedad);
        }
      }

      if (novedad.status === NovedadStatus.PENDIENTE_RRHH) {
        await this.notificationService.notifyRrhhInbox(tenantId, novedad);
        if (employee && warnings.length === 0 && novedad.supervisorApproverId) {
          await this.notificationService.notifyEmployeeStatusChange(
            tenantId,
            employee.userId,
            novedad,
          );
        }
      }

      if (novedad.status === NovedadStatus.APROBADA || novedad.status === NovedadStatus.RECHAZADA) {
        if (employee) {
          await this.notificationService.notifyEmployeeStatusChange(
            tenantId,
            employee.userId,
            novedad,
          );
        }
      }
    } catch {
      // notifications must not block main flow
    }
  }
}
