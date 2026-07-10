import { Test, TestingModule } from '@nestjs/testing';
import { NovedadRequestSource, NovedadStatus, NovedadType } from '@prisma/client';

import { PayrollNovedadesNotificationService } from '../service/payroll-novedades-notification.service';

const mockNovedad = {
  id: 'nov-1',
  tenantId: 'tenant-1',
  employeeId: 'emp-1',
  type: NovedadType.PERMISO_REMUNERADO,
  startDate: new Date('2026-07-01'),
  endDate: new Date('2026-07-03'),
  isPaid: true,
  linkedLeaveId: null,
  supportStorageObjectId: null,
  notes: null,
  requestedBy: NovedadRequestSource.EMPLEADO,
  status: NovedadStatus.PENDIENTE_SUPERVISOR,
  supervisorApproverId: null,
  supervisorDecisionAt: null,
  supervisorComment: null,
  rrhhApproverId: null,
  rrhhDecisionAt: null,
  rejectionReason: null,
  overlapWarningAck: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('PayrollNovedadesNotificationService', () => {
  let service: PayrollNovedadesNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollNovedadesNotificationService],
    }).compile();

    service = module.get(PayrollNovedadesNotificationService);
  });

  it('notifySupervisorPending resolves without error', async () => {
    await expect(
      service.notifySupervisorPending('tenant-1', ['sup-1'], mockNovedad),
    ).resolves.toBeUndefined();
  });

  it('notifyEmployeeStatusChange resolves without error', async () => {
    await expect(
      service.notifyEmployeeStatusChange('tenant-1', 'emp-user', mockNovedad),
    ).resolves.toBeUndefined();
  });

  it('notifyRrhhInbox resolves without error', async () => {
    await expect(service.notifyRrhhInbox('tenant-1', mockNovedad)).resolves.toBeUndefined();
  });
});
