import { Injectable, Logger } from '@nestjs/common';

import type { PayrollNovedadRecord } from '../interfaces/payroll-novedades.interfaces';

export const NO_SUPERVISOR_ASSIGNED_WARNING = 'NO_SUPERVISOR_ASSIGNED';

@Injectable()
export class PayrollNovedadesNotificationService {
  private readonly logger = new Logger(PayrollNovedadesNotificationService.name);

  async notifySupervisorPending(
    tenantId: string,
    supervisorUserIds: string[],
    novedad: PayrollNovedadRecord,
  ): Promise<void> {
    this.logger.log(
      `NOM-14 notify supervisors [${supervisorUserIds.join(', ')}] tenant=${tenantId} novedad=${novedad.id} type=${novedad.type}`,
    );
  }

  async notifyEmployeeStatusChange(
    tenantId: string,
    employeeUserId: string,
    novedad: PayrollNovedadRecord,
  ): Promise<void> {
    this.logger.log(
      `NOM-14 notify employee user=${employeeUserId} tenant=${tenantId} novedad=${novedad.id} status=${novedad.status}`,
    );
  }

  async notifyRrhhInbox(tenantId: string, novedad: PayrollNovedadRecord): Promise<void> {
    this.logger.log(
      `NOM-14 notify RRHH inbox tenant=${tenantId} novedad=${novedad.id} status=${novedad.status}`,
    );
  }

  async notifyEmployeeNovedadEdited(
    tenantId: string,
    employeeUserId: string,
    novedad: PayrollNovedadRecord,
  ): Promise<void> {
    this.logger.log(
      `NOM-14 notify employee edit user=${employeeUserId} tenant=${tenantId} novedad=${novedad.id} type=${novedad.type}`,
    );
  }
}
