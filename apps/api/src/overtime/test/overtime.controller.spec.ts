import { Test, TestingModule } from '@nestjs/testing';
import { OvertimeStatus, OvertimeRequestType } from '@prisma/client';

import { OvertimeController } from '../controller/overtime.controller';
import { OvertimeService } from '../service/overtime.service';

describe('OvertimeController', () => {
  let controller: OvertimeController;
  let service: jest.Mocked<OvertimeService>;

  const user = {
    sub: 'user-1',
    tenantId: 'tenant-1',
    roleCode: 'NOMINA',
    roleId: 'role-nomina',
    email: 'nomina@test.dev',
  };

  beforeEach(async () => {
    service = {
      listInbox: jest.fn(),
      getById: jest.fn(),
      approve: jest.fn(),
      object: jest.fn(),
      getPeriodSummary: jest.fn(),
    } as unknown as jest.Mocked<OvertimeService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OvertimeController],
      providers: [{ provide: OvertimeService, useValue: service }],
    }).compile();

    controller = module.get(OvertimeController);
  });

  it('listInbox delega en OvertimeService', async () => {
    service.listInbox.mockResolvedValue({
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    const result = await controller.listInbox(user, {});

    expect(service.listInbox).toHaveBeenCalledWith('tenant-1', 'user-1', {});
    expect(result.items).toEqual([]);
  });

  it('approve delega con tenantId del JWT', async () => {
    service.approve.mockResolvedValue({
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employeeName: 'Ana',
      locationName: 'Sede',
      approvals: [],
    });

    await controller.approve(user, 'req-1', {});

    expect(service.approve).toHaveBeenCalledWith('tenant-1', 'user-1', {
      overtimeRequestId: 'req-1',
      comment: undefined,
    });
  });
});
