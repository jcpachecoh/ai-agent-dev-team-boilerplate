import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OvertimeStatus } from '@prisma/client';

import type {
  ApproveOvertimeInput,
  IOvertimeService,
  ObjectOvertimeInput,
  OvertimeInboxFilters,
  OvertimeInboxPage,
  OvertimePeriodSummary,
  OvertimeRequestDetail,
} from '../interfaces/overtime.interfaces';
import {
  OVERTIME_INBOX_HISTORIC_ROLES,
  OVERTIME_PENDING_STATUSES,
  resolveActiveApprovalLevel,
} from '../overtime-approval.constants';
import { OvertimeRepository } from '../repository/overtime.repository';
import { OvertimeApprovalService } from './overtime-approval.service';

@Injectable()
export class OvertimeService implements IOvertimeService {
  constructor(
    private readonly repository: OvertimeRepository,
    private readonly approvalService: OvertimeApprovalService,
  ) {}

  async getById(tenantId: string, actorUserId: string, id: string): Promise<OvertimeRequestDetail> {
    const request = await this.repository.findById(tenantId, id);
    if (!request) {
      throw new NotFoundException(`Solicitud de tiempo extra ${id} no encontrada`);
    }

    const actor = await this.repository.findActorContext(tenantId, actorUserId);
    if (!actor) {
      throw new ForbiddenException('Usuario no encontrado o inactivo');
    }

    if (OVERTIME_INBOX_HISTORIC_ROLES.has(actor.roleCode)) {
      return request;
    }

    const activeLevel = resolveActiveApprovalLevel(request.status);
    if (activeLevel) {
      try {
        this.approvalService.assertActorCanApproveLevel(actor, activeLevel, request.locationId);
        return request;
      } catch {
        // Not the active approver — fall through to inbox check.
      }
    }

    const page = await this.approvalService.listInbox(tenantId, actorUserId, {
      payrollPeriod: request.payrollPeriod ?? undefined,
      take: 100,
    });
    if (page.items.some((item) => item.id === id)) {
      return request;
    }

    throw new ForbiddenException('No tiene acceso a esta solicitud');
  }

  listInbox(
    tenantId: string,
    actorUserId: string,
    filters: OvertimeInboxFilters,
  ): Promise<OvertimeInboxPage> {
    return this.approvalService.listInbox(tenantId, actorUserId, filters);
  }

  approve(
    tenantId: string,
    actorUserId: string,
    input: ApproveOvertimeInput,
  ): Promise<OvertimeRequestDetail> {
    return this.approvalService.approve(tenantId, actorUserId, input);
  }

  object(
    tenantId: string,
    actorUserId: string,
    input: ObjectOvertimeInput,
  ): Promise<OvertimeRequestDetail> {
    return this.approvalService.object(tenantId, actorUserId, input);
  }

  async getPeriodSummary(tenantId: string, payrollPeriod: string): Promise<OvertimePeriodSummary> {
    const [pendingCount, approvedCount, objectedCount] = await Promise.all([
      this.repository.countByStatusForPeriod(tenantId, payrollPeriod, [
        ...OVERTIME_PENDING_STATUSES,
      ]),
      this.repository.countByStatusForPeriod(tenantId, payrollPeriod, [OvertimeStatus.APROBADA]),
      this.repository.countByStatusForPeriod(tenantId, payrollPeriod, [OvertimeStatus.OBJETADA]),
    ]);

    return {
      payrollPeriod,
      pendingCount,
      approvedCount,
      objectedCount,
    };
  }
}
