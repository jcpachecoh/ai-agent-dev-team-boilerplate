import { Test, TestingModule } from '@nestjs/testing';
import {
  AttendanceEventType,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { OvertimeRepository } from '../repository/overtime.repository';

const TENANT = 'tenant-1';

describe('OvertimeRepository', () => {
  let repository: OvertimeRepository;
  let prisma: {
    overtimeRequest: Record<string, jest.Mock>;
    overtimeApproval: Record<string, jest.Mock>;
    attendanceLog: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      overtimeRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      overtimeApproval: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      attendanceLog: {
        findMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OvertimeRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(OvertimeRepository);
  });

  it('findActiveAutomaticByPeriod filtra por tenant, type y payrollPeriod', async () => {
    prisma.overtimeRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 35,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await repository.findActiveAutomaticByPeriod(
      TENANT,
      'emp-1',
      'loc-1',
      '2026-07',
    );

    expect(prisma.overtimeRequest.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT,
          type: OvertimeRequestType.DETECCION_AUTOMATICA,
          payrollPeriod: '2026-07',
          deletedAt: null,
        }),
      }),
    );
    expect(result?.accumulatedMinutes).toBe(35);
  });

  it('incrementAccumulatedMinutes actualiza actualEndTime y shiftEndTime', async () => {
    const actualEnd = new Date('2026-07-10T23:35:00.000Z');
    const shiftEnd = new Date('2026-07-10T23:00:00.000Z');

    prisma.overtimeRequest.findFirst.mockResolvedValue({ id: 'req-1' });
    prisma.overtimeRequest.update.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: shiftEnd,
      actualEndTime: actualEnd,
      accumulatedMinutes: 40,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await repository.incrementAccumulatedMinutes(
      TENANT,
      'req-1',
      5,
      actualEnd,
      shiftEnd,
    );

    expect(prisma.overtimeRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: {
        accumulatedMinutes: { increment: 5 },
        actualEndTime: actualEnd,
        shiftEndTime: shiftEnd,
      },
    });
    expect(result?.actualEndTime).toEqual(actualEnd);
  });

  it('upsertApproval respeta unique por nivel', async () => {
    prisma.overtimeApproval.upsert.mockResolvedValue({
      id: 'appr-1',
      tenantId: TENANT,
      overtimeRequestId: 'req-1',
      level: OvertimeApprovalLevel.ADMINISTRADOR,
      approverId: null,
      decision: null,
      decidedAt: null,
      comment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await repository.upsertApproval(TENANT, 'req-1', OvertimeApprovalLevel.ADMINISTRADOR, {});

    expect(prisma.overtimeApproval.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          overtimeRequestId_level: {
            overtimeRequestId: 'req-1',
            level: OvertimeApprovalLevel.ADMINISTRADOR,
          },
        },
      }),
    );
  });

  it('findExitLogsForPeriod filtra EXIT activos por rango workDate', async () => {
    prisma.attendanceLog.findMany.mockResolvedValue([]);

    await repository.findExitLogsForPeriod(
      TENANT,
      'emp-1',
      'loc-1',
      new Date('2026-07-01T00:00:00.000Z'),
      new Date('2026-07-31T00:00:00.000Z'),
    );

    expect(prisma.attendanceLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT,
          eventType: AttendanceEventType.EXIT,
          isActive: true,
        }),
      }),
    );
  });

  it('findById retorna null cuando no existe', async () => {
    prisma.overtimeRequest.findFirst.mockResolvedValue(null);
    await expect(repository.findById(TENANT, 'missing')).resolves.toBeNull();
  });

  it('createRequest inserta con tenantId', async () => {
    prisma.overtimeRequest.create.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 35,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await repository.createRequest(TENANT, {
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 35,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
    });

    expect(result.tenantId).toBe(TENANT);
  });

  it('updateRequest retorna null si no existe', async () => {
    prisma.overtimeRequest.findFirst.mockResolvedValue(null);
    const result = await repository.updateRequest(TENANT, 'missing', {
      status: OvertimeStatus.APROBADA,
    });
    expect(result).toBeNull();
  });

  it('listInbox aplica cursor-based pagination', async () => {
    prisma.overtimeRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        tenantId: TENANT,
        employeeId: 'emp-1',
        locationId: 'loc-1',
        type: OvertimeRequestType.DETECCION_AUTOMATICA,
        shiftEndTime: new Date(),
        actualEndTime: new Date(),
        accumulatedMinutes: 35,
        status: OvertimeStatus.PENDIENTE_ADMIN,
        payrollPeriod: '2026-07',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        employee: { user: { email: 'ana@test.dev' } },
        location: { name: 'Sede 1' },
      },
    ]);

    const page = await repository.listInbox(TENANT, { take: 20, cursor: 'cursor-1' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0].employeeName).toBe('ana');
    expect(prisma.overtimeRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: 'cursor-1' }, skip: 1 }),
    );
  });

  it('findActorContext mapea rol, cargo y sedes', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      role: { code: 'MANAGER' },
      employeeDetails: { positionId: 'pos-pdl-001' },
      userLocations: [{ locationId: 'loc-1' }],
    });

    const actor = await repository.findActorContext(TENANT, 'user-1');
    expect(actor).toEqual({
      userId: 'user-1',
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
    });
  });

  it('findApproverUserIdsByPosition filtra por sede para administrador', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

    const ids = await repository.findApproverUserIdsByPosition(TENANT, ['pos-pdl-001'], 'loc-1');
    expect(ids).toEqual(['admin-1']);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userLocations: { some: { locationId: 'loc-1' } },
        }),
      }),
    );
  });

  it('countByStatusForPeriod cuenta por estados', async () => {
    prisma.overtimeRequest.count.mockResolvedValue(3);
    const count = await repository.countByStatusForPeriod(TENANT, '2026-07', [
      OvertimeStatus.PENDIENTE_ADMIN,
    ]);
    expect(count).toBe(3);
  });

  it('findApprovalStatusByEmployeeIdsForPeriod retorna vacío sin ids', async () => {
    await expect(
      repository.findApprovalStatusByEmployeeIdsForPeriod(TENANT, [], '2026-07'),
    ).resolves.toEqual([]);
  });

  it('findById retorna detalle con aprobaciones', async () => {
    prisma.overtimeRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 35,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employee: { user: { email: 'carlos@test.dev' } },
      location: { name: 'Sede Norte' },
      approvals: [
        {
          id: 'appr-1',
          tenantId: TENANT,
          overtimeRequestId: 'req-1',
          level: OvertimeApprovalLevel.ADMINISTRADOR,
          approverId: null,
          decision: null,
          decidedAt: null,
          comment: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const detail = await repository.findById(TENANT, 'req-1');
    expect(detail?.employeeName).toBe('carlos');
    expect(detail?.approvals).toHaveLength(1);
  });

  it('incrementAccumulatedMinutes retorna null si no existe', async () => {
    prisma.overtimeRequest.findFirst.mockResolvedValue(null);
    const result = await repository.incrementAccumulatedMinutes(
      TENANT,
      'missing',
      5,
      new Date(),
      new Date(),
    );
    expect(result).toBeNull();
  });

  it('updateRequest actualiza cuando existe', async () => {
    prisma.overtimeRequest.findFirst.mockResolvedValue({ id: 'req-1' });
    prisma.overtimeRequest.update.mockResolvedValue({
      id: 'req-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 50,
      status: OvertimeStatus.APROBADA,
      payrollPeriod: '2026-07',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await repository.updateRequest(TENANT, 'req-1', {
      status: OvertimeStatus.APROBADA,
    });

    expect(result?.status).toBe(OvertimeStatus.APROBADA);
  });

  it('findApprovalsByRequestId retorna aprobaciones ordenadas', async () => {
    prisma.overtimeApproval.findMany.mockResolvedValue([
      {
        id: 'appr-1',
        tenantId: TENANT,
        overtimeRequestId: 'req-1',
        level: OvertimeApprovalLevel.ADMINISTRADOR,
        approverId: 'admin-1',
        decision: null,
        decidedAt: null,
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const approvals = await repository.findApprovalsByRequestId(TENANT, 'req-1');
    expect(approvals).toHaveLength(1);
    expect(approvals[0].level).toBe(OvertimeApprovalLevel.ADMINISTRADOR);
  });

  it('findApprovalStatusByEmployeeIdsForPeriod retorna estados por empleado', async () => {
    prisma.overtimeRequest.findMany.mockResolvedValue([
      {
        employeeId: 'emp-1',
        status: OvertimeStatus.PENDIENTE_ADMIN,
        accumulatedMinutes: 35,
      },
    ]);

    const rows = await repository.findApprovalStatusByEmployeeIdsForPeriod(
      TENANT,
      ['emp-1'],
      '2026-07',
    );

    expect(rows).toEqual([
      {
        employeeId: 'emp-1',
        status: OvertimeStatus.PENDIENTE_ADMIN,
        accumulatedMinutes: 35,
      },
    ]);
  });

  it('listInbox indica hasNextPage cuando hay más resultados', async () => {
    const row = {
      id: 'req-1',
      tenantId: TENANT,
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 35,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      employee: { user: { email: 'ana@test.dev' } },
      location: { name: 'Sede 1' },
    };
    prisma.overtimeRequest.findMany.mockResolvedValue([row, { ...row, id: 'req-2' }]);

    const page = await repository.listInbox(TENANT, { take: 1 });
    expect(page.pageInfo.hasNextPage).toBe(true);
    expect(page.items).toHaveLength(1);
  });
});
