import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { LeaveOrigin, NovedadRequestSource, NovedadType } from '@prisma/client';

import { MedicalLeavesService } from '../../medical-leaves/service/medical-leaves.service';
import { NovedadTypeConfigService } from '../../payroll-novedades/service/novedad-type-config.service';
import { PayrollNovedadesService } from '../../payroll-novedades/service/payroll-novedades.service';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  IManualMarkingProvisionService,
  ManualMarkingProvisionInput,
  ManualMarkingProvisionResult,
} from '../interfaces/manual-marking-provision.interfaces';
import { resolveManualMarkingReason } from '../interfaces/manual-marking-provision.interfaces';

/** CONN-05 PC-5 — roles que pueden provisionar NOM-13 / NOM-14 desde asistencia. */
const MANUAL_MARKING_PROVISION_ROLES = new Set(['NOMINA', 'OWNER', 'SUPER_ADMIN']);

@Injectable()
export class ManualMarkingProvisionService implements IManualMarkingProvisionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payrollNovedadesService: PayrollNovedadesService,
    private readonly medicalLeavesService: MedicalLeavesService,
    private readonly novedadTypeConfigService: NovedadTypeConfigService,
  ) {}

  async validateBeforeManualMarking(
    tenantId: string,
    actorRoleCode: string,
    reason: string,
    supportStorageObjectId?: string,
  ): Promise<void> {
    const resolved = resolveManualMarkingReason(reason);
    if (!resolved || resolved.target === 'ATTENDANCE_ONLY') {
      return;
    }

    this.assertPayrollWriteRole(actorRoleCode);

    if (resolved.target === 'PAYROLL_NOVEDAD' && resolved.novedadType) {
      const typeConfig = await this.novedadTypeConfigService.getConfigForTenant(
        tenantId,
        resolved.novedadType,
      );
      if (typeConfig.requiresSupportDocument && !supportStorageObjectId) {
        throw new BadRequestException('Este tipo de novedad requiere adjuntar un soporte');
      }
    }
  }

  /**
   * Provisiona novedad de nómina o incapacidad según el motivo de marcación manual.
   *
   * La marcación (`AttendanceLog`) debe existir antes de invocar este método.
   * Si el provisionamiento falla después de crear el log, el caller debe compensar
   * (p. ej. eliminar la marcación manual o reintentar) — ver CONN-05 epic D6.
   */
  async provisionAfterManualMarking(
    input: ManualMarkingProvisionInput,
  ): Promise<ManualMarkingProvisionResult> {
    const resolved = resolveManualMarkingReason(input.reason);
    if (!resolved || resolved.target === 'ATTENDANCE_ONLY') {
      return { provisioned: false };
    }

    this.assertPayrollWriteRole(input.actorRoleCode);

    if (resolved.target === 'PAYROLL_NOVEDAD' && resolved.novedadType) {
      return this.provisionPayrollNovedad(input, resolved.novedadType);
    }

    if (resolved.target === 'MEDICAL_LEAVE' && resolved.leaveOrigin) {
      return this.provisionMedicalLeave(input, resolved.leaveOrigin);
    }

    return { provisioned: false };
  }

  private assertPayrollWriteRole(roleCode: string): void {
    if (!MANUAL_MARKING_PROVISION_ROLES.has(roleCode)) {
      throw new ForbiddenException(
        'No tiene permiso de nómina para registrar este motivo de cambio',
      );
    }
  }

  private async provisionPayrollNovedad(
    input: ManualMarkingProvisionInput,
    novedadType: NovedadType,
  ): Promise<ManualMarkingProvisionResult> {
    const { tenantId, actorUserId, employeeId, attendanceLogId, workDate } = input;

    const result = await this.payrollNovedadesService.submit(tenantId, actorUserId, {
      employeeId,
      type: novedadType,
      startDate: workDate,
      endDate: workDate,
      requestedBy: NovedadRequestSource.RRHH,
      overlapWarningAck: true,
      notes: 'Provisionado desde marcación manual de asistencia',
      supportStorageObjectId: input.supportStorageObjectId,
    });

    await this.prisma.payrollNovedad.update({
      where: { id: result.novedad.id },
      data: {
        ...(attendanceLogId ? { sourceAttendanceLogId: attendanceLogId } : {}),
      },
    });

    return { provisioned: true, payrollNovedadId: result.novedad.id };
  }

  private async provisionMedicalLeave(
    input: ManualMarkingProvisionInput,
    leaveOrigin: LeaveOrigin,
  ): Promise<ManualMarkingProvisionResult> {
    const { tenantId, actorUserId, employeeId, attendanceLogId, workDate } = input;

    const leave = await this.medicalLeavesService.register(tenantId, actorUserId, {
      employeeId,
      origin: leaveOrigin,
      startDate: workDate,
      endDate: workDate,
    });

    await this.prisma.medicalLeave.update({
      where: { id: leave.id },
      data: {
        ...(attendanceLogId ? { sourceAttendanceLogId: attendanceLogId } : {}),
      },
    });

    return { provisioned: true, medicalLeaveId: leave.id };
  }
}
