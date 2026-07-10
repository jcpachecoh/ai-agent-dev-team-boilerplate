import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OvertimeApprovalDecision, OvertimeApprovalLevel, OvertimeStatus } from '@prisma/client';

import {
  OVERTIME_APPROVAL_BLOCKED_ROLES,
  OVERTIME_INBOX_HISTORIC_ROLES,
  OVERTIME_NEXT_STATUS_AFTER_APPROVE,
  OVERTIME_RRHH_APPROVER_ROLES,
  resolveActiveApprovalLevel,
  resolveApproverPositionIds,
} from '../overtime-approval.constants';
import type {
  ApproveOvertimeInput,
  IOvertimeApprovalService,
  ObjectOvertimeInput,
  OvertimeActorContext,
  OvertimeInboxFilters,
  OvertimeInboxPage,
  OvertimeRequestDetail,
} from '../interfaces/overtime.interfaces';
import { OvertimeRepository } from '../repository/overtime.repository';
import { OvertimeNotificationService } from './overtime-notification.service';

@Injectable()
export class OvertimeApprovalService implements IOvertimeApprovalService {
  constructor(
    private readonly repository: OvertimeRepository,
    private readonly notificationService: OvertimeNotificationService,
  ) {}

  async approve(
    tenantId: string,
    actorUserId: string,
    input: ApproveOvertimeInput,
  ): Promise<OvertimeRequestDetail> {
    const request = await this.repository.findById(tenantId, input.overtimeRequestId);
    if (!request) {
      throw new NotFoundException(
        `Solicitud de tiempo extra ${input.overtimeRequestId} no encontrada`,
      );
    }

    const activeLevel = resolveActiveApprovalLevel(request.status);
    if (!activeLevel) {
      throw new BadRequestException('La solicitud no está en un estado pendiente de aprobación');
    }

    const actor = await this.getActorOrThrow(tenantId, actorUserId);
    this.assertActorCanApproveLevel(actor, activeLevel, request.locationId);

    const nextStatus = OVERTIME_NEXT_STATUS_AFTER_APPROVE[request.status];
    if (!nextStatus) {
      throw new BadRequestException('Transición de aprobación inválida');
    }

    await this.repository.upsertApproval(tenantId, request.id, activeLevel, {
      approverId: actorUserId,
      decision: OvertimeApprovalDecision.APROBADO,
      decidedAt: new Date(),
      comment: input.comment?.trim() || null,
    });

    await this.repository.updateRequest(tenantId, request.id, { status: nextStatus });

    if (nextStatus === OvertimeStatus.APROBADA) {
      await this.notificationService
        .notifyEmployeeTerminal(tenantId, request.id, OvertimeStatus.APROBADA)
        .catch(() => undefined);
    } else {
      await this.notificationService
        .notifyLevelPending(tenantId, request.id, nextStatus)
        .catch(() => undefined);
    }

    const updated = await this.repository.findById(tenantId, request.id);
    if (!updated) {
      throw new NotFoundException(
        `Solicitud de tiempo extra ${input.overtimeRequestId} no encontrada`,
      );
    }
    return updated;
  }

  async object(
    tenantId: string,
    actorUserId: string,
    input: ObjectOvertimeInput,
  ): Promise<OvertimeRequestDetail> {
    const comment = input.comment?.trim();
    if (!comment) {
      throw new BadRequestException('El comentario de objeción es obligatorio');
    }

    const request = await this.repository.findById(tenantId, input.overtimeRequestId);
    if (!request) {
      throw new NotFoundException(
        `Solicitud de tiempo extra ${input.overtimeRequestId} no encontrada`,
      );
    }

    const activeLevel = resolveActiveApprovalLevel(request.status);
    if (!activeLevel) {
      throw new BadRequestException('La solicitud no está en un estado pendiente de aprobación');
    }

    const actor = await this.getActorOrThrow(tenantId, actorUserId);
    this.assertActorCanApproveLevel(actor, activeLevel, request.locationId);

    await this.repository.upsertApproval(tenantId, request.id, activeLevel, {
      approverId: actorUserId,
      decision: OvertimeApprovalDecision.OBJETADO,
      decidedAt: new Date(),
      comment,
    });

    await this.repository.updateRequest(tenantId, request.id, { status: OvertimeStatus.OBJETADA });

    await this.notificationService
      .notifyEmployeeTerminal(tenantId, request.id, OvertimeStatus.OBJETADA)
      .catch(() => undefined);

    const updated = await this.repository.findById(tenantId, request.id);
    if (!updated) {
      throw new NotFoundException(
        `Solicitud de tiempo extra ${input.overtimeRequestId} no encontrada`,
      );
    }
    return updated;
  }

  async listInbox(
    tenantId: string,
    actorUserId: string,
    filters: OvertimeInboxFilters,
  ): Promise<OvertimeInboxPage> {
    const actor = await this.getActorOrThrow(tenantId, actorUserId);

    if (OVERTIME_INBOX_HISTORIC_ROLES.has(actor.roleCode)) {
      return this.repository.listInbox(tenantId, filters);
    }

    const approverLevel = this.resolveActorApproverLevel(actor.positionId);
    if (!approverLevel) {
      return { items: [], pageInfo: { hasNextPage: false, endCursor: null } };
    }

    const statusForLevel = this.statusForApproverLevel(approverLevel);
    const scopedFilters: OvertimeInboxFilters = {
      ...filters,
      status: filters.status?.length ? filters.status : [statusForLevel],
    };

    if (approverLevel === OvertimeApprovalLevel.ADMINISTRADOR) {
      const page = await this.repository.listInbox(tenantId, scopedFilters);
      const allowed = new Set(actor.locationIds);
      return {
        items: page.items.filter((item) => allowed.has(item.locationId)),
        pageInfo: page.pageInfo,
      };
    }

    return this.repository.listInbox(tenantId, scopedFilters);
  }

  assertActorCanApproveLevel(
    actor: OvertimeActorContext,
    level: OvertimeApprovalLevel,
    locationId: string,
  ): void {
    if (OVERTIME_APPROVAL_BLOCKED_ROLES.has(actor.roleCode)) {
      throw new ForbiddenException('Su rol no puede aprobar solicitudes de tiempo extra');
    }

    if (OVERTIME_RRHH_APPROVER_ROLES.has(actor.roleCode)) {
      return;
    }

    const positionIds = resolveApproverPositionIds(level);
    if (!actor.positionId || !positionIds.includes(actor.positionId)) {
      throw new ForbiddenException('Su cargo no corresponde al nivel activo de aprobación');
    }

    if (level === OvertimeApprovalLevel.ADMINISTRADOR && !actor.locationIds.includes(locationId)) {
      throw new ForbiddenException('No puede aprobar solicitudes de otra sede');
    }
  }

  private async getActorOrThrow(tenantId: string, userId: string): Promise<OvertimeActorContext> {
    const actor = await this.repository.findActorContext(tenantId, userId);
    if (!actor) {
      throw new ForbiddenException('Usuario no encontrado o inactivo');
    }
    return actor;
  }

  private resolveActorApproverLevel(positionId: string | null): OvertimeApprovalLevel | null {
    if (!positionId) return null;

    for (const level of [
      OvertimeApprovalLevel.ADMINISTRADOR,
      OvertimeApprovalLevel.GERENCIA_OPERACIONES,
      OvertimeApprovalLevel.GERENCIA_GENERAL,
    ]) {
      if (resolveApproverPositionIds(level).includes(positionId)) {
        return level;
      }
    }

    return null;
  }

  private statusForApproverLevel(level: OvertimeApprovalLevel): OvertimeStatus {
    switch (level) {
      case OvertimeApprovalLevel.ADMINISTRADOR:
        return OvertimeStatus.PENDIENTE_ADMIN;
      case OvertimeApprovalLevel.GERENCIA_OPERACIONES:
        return OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES;
      case OvertimeApprovalLevel.GERENCIA_GENERAL:
        return OvertimeStatus.PENDIENTE_GERENCIA_GENERAL;
      default:
        return OvertimeStatus.PENDIENTE_ADMIN;
    }
  }
}
