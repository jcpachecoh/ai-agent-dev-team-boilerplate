import { Injectable, Logger } from '@nestjs/common';
import { OvertimeApprovalLevel, OvertimeStatus } from '@prisma/client';

import { OvertimeRepository } from '../repository/overtime.repository';
import {
  resolveActiveApprovalLevel,
  resolveApproverPositionIds,
} from '../overtime-approval.constants';

@Injectable()
export class OvertimeNotificationService {
  private readonly logger = new Logger(OvertimeNotificationService.name);

  constructor(private readonly repository: OvertimeRepository) {}

  async notifyLevelPending(
    tenantId: string,
    overtimeRequestId: string,
    status: OvertimeStatus,
  ): Promise<void> {
    const request = await this.repository.findById(tenantId, overtimeRequestId);
    if (!request) return;

    const level = resolveActiveApprovalLevel(status);
    if (!level) return;

    const positionIds = resolveApproverPositionIds(level);
    const locationId =
      level === OvertimeApprovalLevel.ADMINISTRADOR ? request.locationId : undefined;
    const recipientIds = await this.repository.findApproverUserIdsByPosition(
      tenantId,
      positionIds,
      locationId,
    );

    this.logger.log(
      `CONN-04a notify level=${level} recipients=[${recipientIds.join(', ')}] request=${overtimeRequestId} employee=${request.employeeId}`,
    );
  }

  async notifyEmployeeTerminal(
    tenantId: string,
    overtimeRequestId: string,
    status: 'APROBADA' | 'OBJETADA',
  ): Promise<void> {
    const request = await this.repository.findById(tenantId, overtimeRequestId);
    if (!request) return;

    this.logger.log(
      `CONN-04a notify employee=${request.employeeId} request=${overtimeRequestId} status=${status}`,
    );
  }
}
