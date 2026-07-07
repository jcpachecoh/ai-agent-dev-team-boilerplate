import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import type { EmailAttachment } from '@restopsiq/email';
import { EmailService } from '@restopsiq/email';

import { AuditService } from '../../audit/service/audit.service';
import { UserLocationsService } from '../../locations/service/user-locations.service';
import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import {
  ATTENDANCE_COLLABORATORS_EXPORT_EMPTY_MESSAGE,
  ATTENDANCE_COLLABORATORS_EXPORT_MAX_ROWS,
  ATTENDANCE_COLLABORATORS_LOCATION_SCOPED_ROLES,
  ATTENDANCE_COLLABORATORS_SUPERVISOR_INVALID_MESSAGE,
  ATTENDANCE_COLLABORATORS_SUPERVISOR_ROLES,
} from '../attendance-collaborators.constants';
import type {
  ActorContext,
  AttendanceCollaboratorItem,
  AttendanceCollaboratorsResult,
  AuditHistoryEntry,
  CollaboratorExportFormat,
  CollaboratorExportRow,
  CollaboratorTodayShift,
  ListCollaboratorsFilters,
  SupervisorOption,
} from '../interfaces/attendance-collaborators.interfaces';
import { AttendanceCollaboratorsRepository } from '../repository/attendance-collaborators.repository';
import { normalizeWorkDate } from '../repository/attendance.repository';
import { AttendanceCollaboratorsExcelService } from './attendance-collaborators-excel.service';
import { AttendanceCollaboratorsPdfService } from './attendance-collaborators-pdf.service';

export type ListCollaboratorsInput = Omit<
  ListCollaboratorsFilters,
  'allowedLocationIds' | 'tenantId'
>;

export type ExportFiltersInput = Omit<
  ListCollaboratorsInput,
  'page' | 'pageSize' | 'sortBy' | 'sortDir'
>;

export interface EmailExportInput {
  recipients: string[];
  format: CollaboratorExportFormat;
  filters: ExportFiltersInput;
}

@Injectable()
export class AttendanceCollaboratorsService {
  constructor(
    private readonly repository: AttendanceCollaboratorsRepository,
    private readonly userLocationsService: UserLocationsService,
    private readonly auditService: AuditService,
    private readonly excelService: AttendanceCollaboratorsExcelService,
    private readonly pdfService: AttendanceCollaboratorsPdfService,
    private readonly emailService: EmailService,
    private readonly shiftResolutionService: ShiftResolutionService,
  ) {}

  async list(
    tenantId: string,
    actor: ActorContext,
    filters: ListCollaboratorsInput,
  ): Promise<AttendanceCollaboratorsResult> {
    const allowedLocationIds = await this.resolveEffectiveScope(tenantId, actor, filters);

    const page = await this.repository.findPage({ ...filters, tenantId, allowedLocationIds });
    const employeeIds = page.items.map((item) => item.id);
    const locationIds = [...new Set(page.items.map((item) => item.locationId))];

    const [supervisorsByLocation, shiftsByEmployee] = await Promise.all([
      this.repository.findSupervisorsForLocations(tenantId, locationIds),
      this.repository.findTodayAssignments(tenantId, employeeIds, normalizeWorkDate(new Date())),
    ]);

    const today = normalizeWorkDate(new Date());
    const items: AttendanceCollaboratorItem[] = await Promise.all(
      page.items.map(async (item) => ({
        ...item,
        supervisors: supervisorsByLocation.get(item.locationId) ?? [],
        todayShift:
          shiftsByEmployee.get(item.id) ??
          (await this.resolveTodayShiftFromAssignment(tenantId, item.id, item.locationId, today)),
      })),
    );

    const totalPages = Math.max(1, Math.ceil(page.total / filters.pageSize));

    return {
      items,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: page.total,
        totalPages,
      },
      summary: {
        total: page.total,
        active: page.activeTotal,
        inactive: page.inactiveTotal,
      },
    };
  }

  async listSupervisorOptions(tenantId: string, actor: ActorContext): Promise<SupervisorOption[]> {
    const allowedLocationIds = await this.resolveScope(tenantId, actor);
    return this.repository.findSupervisorOptions(tenantId, allowedLocationIds);
  }

  async setPortalWorkerEnabled(
    tenantId: string,
    employeeDetailsId: string,
    enabled: boolean,
    actorUserId: string,
  ): Promise<{ portalWorkerEnabled: boolean }> {
    const employee = await this.repository.findEmployeeForPortalToggle(tenantId, employeeDetailsId);
    if (!employee) {
      throw new NotFoundException(`Colaborador "${employeeDetailsId}" no encontrado`);
    }

    await this.repository.updatePortalWorkerEnabled(employeeDetailsId, enabled);

    await this.auditService.log({
      tenantId,
      action: AuditAction.UPDATE,
      entityType: 'EmployeeDetails',
      entityId: employeeDetailsId,
      actorUserId,
      oldValue: { portalWorkerEnabled: employee.portalWorkerEnabled },
      newValue: { portalWorkerEnabled: enabled },
    });

    return { portalWorkerEnabled: enabled };
  }

  async getAuditHistory(tenantId: string, employeeDetailsId: string): Promise<AuditHistoryEntry[]> {
    const employee = await this.repository.findEmployeeForPortalToggle(tenantId, employeeDetailsId);
    if (!employee) {
      throw new NotFoundException(`Colaborador "${employeeDetailsId}" no encontrado`);
    }

    return this.auditService.findRecentByEntity(tenantId, 'EmployeeDetails', employeeDetailsId);
  }

  async exportFile(
    tenantId: string,
    actor: ActorContext,
    filters: ExportFiltersInput,
    format: CollaboratorExportFormat,
    actorUserId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const rows = await this.buildExportRows(tenantId, actor, filters);
    const buffer = await this.generateExportBuffer(rows, format);
    const filename = this.buildExportFilename(format);

    await this.auditService.log({
      tenantId,
      action: AuditAction.EXPORT,
      entityType: 'EmployeeDetails',
      entityId: tenantId,
      actorUserId,
      payload: { format, rowCount: rows.length, filters },
    });

    return { buffer, filename };
  }

  async emailExport(
    tenantId: string,
    actor: ActorContext,
    requestedByEmail: string,
    input: EmailExportInput,
    actorUserId: string,
  ): Promise<void> {
    const rows = await this.buildExportRows(tenantId, actor, input.filters);
    const buffer = await this.generateExportBuffer(rows, input.format);
    const filename = this.buildExportFilename(input.format);
    const generatedAt = this.formatGeneratedAt();

    const attachment: EmailAttachment = {
      filename,
      // BullMQ serializa el payload del job a JSON al encolarlo en Redis — un
      // ArrayBuffer no sobrevive ese round-trip (se convierte en `{}`), lo que
      // causaba "The attachment content is empty." en Resend. base64 sí es JSON-safe.
      content: buffer.toString('base64'),
      contentType:
        input.format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf',
    };

    await this.emailService.send({
      to: input.recipients,
      subject: 'Listado de colaboradores',
      tenantId,
      tenantName: tenantId,
      template: {
        type: 'collaborators-export',
        props: {
          requestedByName: requestedByEmail,
          format: input.format,
          rowCount: rows.length,
          generatedAt,
        },
      },
      attachments: [attachment],
    });

    await this.auditService.log({
      tenantId,
      action: AuditAction.EXPORT,
      entityType: 'EmployeeDetails',
      entityId: tenantId,
      actorUserId,
      payload: { recipients: input.recipients, format: input.format, rowCount: rows.length },
    });
  }

  private async buildExportRows(
    tenantId: string,
    actor: ActorContext,
    filters: ExportFiltersInput,
  ): Promise<CollaboratorExportRow[]> {
    const result = await this.list(tenantId, actor, {
      ...filters,
      page: 1,
      pageSize: ATTENDANCE_COLLABORATORS_EXPORT_MAX_ROWS,
    });

    if (result.items.length === 0) {
      throw new BadRequestException(ATTENDANCE_COLLABORATORS_EXPORT_EMPTY_MESSAGE);
    }

    return result.items.map(
      (item): CollaboratorExportRow => ({
        cedula: item.cedula,
        primerApellido: item.primerApellido ?? '',
        segundoApellido: item.segundoApellido ?? '',
        name: item.name,
        positionName: item.positionName,
        area: item.area,
        supervisorsLabel: this.formatSupervisorsLabel(item.supervisors),
        contractType: item.contractType,
        turnoLabel: this.formatTurnoLabel(item.todayShift),
        portalLabel: item.portalWorkerEnabled ? 'Sí' : 'No',
      }),
    );
  }

  private async generateExportBuffer(
    rows: CollaboratorExportRow[],
    format: CollaboratorExportFormat,
  ): Promise<Buffer> {
    if (format === 'excel') {
      return this.excelService.generateXlsx(rows);
    }
    return this.pdfService.generatePdf(rows, { generatedAt: this.formatGeneratedAt() });
  }

  private buildExportFilename(format: CollaboratorExportFormat): string {
    const date = new Date().toISOString().slice(0, 10);
    const extension = format === 'excel' ? 'xlsx' : 'pdf';
    return `colaboradores_asistencia_${date}.${extension}`;
  }

  private formatGeneratedAt(): string {
    return new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatSupervisorsLabel(supervisors: Array<{ name: string }>): string {
    if (supervisors.length === 0) return 'N/A';
    return supervisors.map((supervisor) => supervisor.name).join(', ');
  }

  private async resolveTodayShiftFromAssignment(
    tenantId: string,
    employeeId: string,
    locationId: string,
    workDate: Date,
  ): Promise<CollaboratorTodayShift> {
    const resolved = await this.shiftResolutionService.resolveForDay({
      tenantId,
      employeeId,
      locationId,
      workDate,
    });

    if (resolved.kind === 'REST') {
      return { type: 'REST', turno: null };
    }

    if (resolved.kind === 'ASSIGNED' && resolved.source === 'EMPLOYEE_ASSIGNMENT') {
      const turno = resolved.turno;
      return {
        type: 'ASSIGNED',
        turno: {
          id: turno.id,
          nombre: turno.nombre,
          sigla: turno.sigla,
          horaInicio: turno.horaInicio,
          horaFin: turno.horaFin,
          jornada: turno.jornada,
        },
      };
    }

    return { type: 'BASE', turno: null };
  }

  private formatTurnoLabel(todayShift: CollaboratorTodayShift): string {
    if (todayShift.type === 'ASSIGNED' && todayShift.turno) {
      return `${todayShift.turno.sigla} ${todayShift.turno.horaInicio}-${todayShift.turno.horaFin}`;
    }
    if (todayShift.type === 'REST') return 'Descanso';
    return 'Turno Base';
  }

  /** Mismo patrón que TurnoAssignmentsService.resolveScope: null = sin restricción (OWNER/SUPER_ADMIN/NOMINA). */
  private async resolveScope(tenantId: string, actor: ActorContext): Promise<string[] | null> {
    const isLocationScoped = (
      ATTENDANCE_COLLABORATORS_LOCATION_SCOPED_ROLES as readonly string[]
    ).includes(actor.roleCode);
    if (!isLocationScoped) {
      return null;
    }

    const locations = await this.userLocationsService.getActiveUserLocations(
      tenantId,
      actor.userId,
    );
    return locations.map((location): string => location.id);
  }

  /**
   * Resuelve el scope del caller y, si viene `supervisorUserId`, lo intersecta con las
   * sedes de ese supervisor (instrucción explícita: nunca ignorar el filtro — una
   * intersección vacía debe devolver 0 filas, no el scope completo del caller).
   */
  private async resolveEffectiveScope(
    tenantId: string,
    actor: ActorContext,
    filters: ListCollaboratorsInput,
  ): Promise<string[] | null> {
    const callerScope = await this.resolveScope(tenantId, actor);

    if (!filters.supervisorUserId) {
      return callerScope;
    }

    const supervisor = await this.repository.findSupervisorUser(tenantId, filters.supervisorUserId);
    if (
      !supervisor ||
      !(ATTENDANCE_COLLABORATORS_SUPERVISOR_ROLES as readonly string[]).includes(
        supervisor.roleCode,
      )
    ) {
      throw new BadRequestException(ATTENDANCE_COLLABORATORS_SUPERVISOR_INVALID_MESSAGE);
    }

    const supervisorLocations = await this.userLocationsService.getActiveUserLocations(
      tenantId,
      filters.supervisorUserId,
    );
    const supervisorLocationIds = supervisorLocations.map((location) => location.id);

    if (!callerScope) {
      return supervisorLocationIds;
    }

    const supervisorSet = new Set(supervisorLocationIds);
    return callerScope.filter((locationId) => supervisorSet.has(locationId));
  }
}
