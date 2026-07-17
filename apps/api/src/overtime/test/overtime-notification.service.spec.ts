import { Test, TestingModule } from '@nestjs/testing';
import { OvertimeRequestType, OvertimeStatus } from '@prisma/client';

import { OvertimeRepository } from '../repository/overtime.repository';
import { OvertimeNotificationService } from '../service/overtime-notification.service';

describe('OvertimeNotificationService', () => {
  let service: OvertimeNotificationService;
  let repository: jest.Mocked<OvertimeRepository>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findApproverUserIdsByPosition: jest.fn(),
    } as unknown as jest.Mocked<OvertimeRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OvertimeNotificationService,
        { provide: OvertimeRepository, useValue: repository },
      ],
    }).compile();

    service = module.get(OvertimeNotificationService);
  });

  it('notifica administradores de la sede al pasar a PENDIENTE_ADMIN', async () => {
    repository.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 40,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
      workDate: null,
      proposedStartTime: null,
      proposedEndTime: null,
      proposedMinutes: null,
      reasonOptionId: null,
      requestedByUserId: null,
      batchId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employeeName: 'Ana',
      locationName: 'Sede 1',
      approvals: [],
    });
    repository.findApproverUserIdsByPosition.mockResolvedValue(['admin-user']);

    await service.notifyLevelPending('tenant-1', 'req-1', OvertimeStatus.PENDIENTE_ADMIN);

    expect(repository.findApproverUserIdsByPosition).toHaveBeenCalledWith(
      'tenant-1',
      expect.arrayContaining(['pos-pdl-001']),
      'loc-1',
    );
  });

  it('notifica gerencia operaciones tenant-wide', async () => {
    repository.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 40,
      status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      payrollPeriod: '2026-07',
      workDate: null,
      proposedStartTime: null,
      proposedEndTime: null,
      proposedMinutes: null,
      reasonOptionId: null,
      requestedByUserId: null,
      batchId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employeeName: 'Ana',
      locationName: 'Sede 1',
      approvals: [],
    });
    repository.findApproverUserIdsByPosition.mockResolvedValue(['ops-user']);

    await service.notifyLevelPending(
      'tenant-1',
      'req-1',
      OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    );

    expect(repository.findApproverUserIdsByPosition).toHaveBeenCalledWith(
      'tenant-1',
      expect.arrayContaining(['pos-pdl-003']),
      undefined,
    );
  });

  it('notifica gerencia general tenant-wide', async () => {
    repository.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 40,
      status: OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
      payrollPeriod: '2026-07',
      workDate: null,
      proposedStartTime: null,
      proposedEndTime: null,
      proposedMinutes: null,
      reasonOptionId: null,
      requestedByUserId: null,
      batchId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employeeName: 'Ana',
      locationName: 'Sede 1',
      approvals: [],
    });
    repository.findApproverUserIdsByPosition.mockResolvedValue(['gg-user']);

    await service.notifyLevelPending(
      'tenant-1',
      'req-1',
      OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
    );

    expect(repository.findApproverUserIdsByPosition).toHaveBeenCalledWith(
      'tenant-1',
      expect.arrayContaining(['pos-pdl-007']),
      undefined,
    );
  });

  it('notifica empleado en estado terminal', async () => {
    repository.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 40,
      status: OvertimeStatus.APROBADA,
      payrollPeriod: '2026-07',
      workDate: null,
      proposedStartTime: null,
      proposedEndTime: null,
      proposedMinutes: null,
      reasonOptionId: null,
      requestedByUserId: null,
      batchId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employeeName: 'Ana',
      locationName: 'Sede 1',
      approvals: [],
    });

    await service.notifyEmployeeTerminal('tenant-1', 'req-1', 'APROBADA');
    expect(repository.findById).toHaveBeenCalled();
  });

  it('notifyLevelPending no hace nada si la solicitud no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await service.notifyLevelPending('tenant-1', 'missing', OvertimeStatus.PENDIENTE_ADMIN);

    expect(repository.findApproverUserIdsByPosition).not.toHaveBeenCalled();
  });

  it('notifyLevelPending no hace nada en estado sin nivel activo', async () => {
    repository.findById.mockResolvedValue({
      id: 'req-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 40,
      status: OvertimeStatus.APROBADA,
      payrollPeriod: '2026-07',
      workDate: null,
      proposedStartTime: null,
      proposedEndTime: null,
      proposedMinutes: null,
      reasonOptionId: null,
      requestedByUserId: null,
      batchId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employeeName: 'Ana',
      locationName: 'Sede 1',
      approvals: [],
    });

    await service.notifyLevelPending('tenant-1', 'req-1', OvertimeStatus.APROBADA);

    expect(repository.findApproverUserIdsByPosition).not.toHaveBeenCalled();
  });

  it('notifyEmployeeTerminal no hace nada si la solicitud no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await service.notifyEmployeeTerminal('tenant-1', 'missing', 'OBJETADA');

    expect(repository.findById).toHaveBeenCalled();
  });
});
