import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { OvertimeApprovalLevel, OvertimeRequestType, OvertimeStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateAdministrativeOvertimeRequestData,
  OvertimeRequestRecord,
} from '../interfaces/overtime.interfaces';
import { OvertimeRepository } from '../repository/overtime.repository';

const TENANT = 'tenant-1';

/** Detection-shaped row: admin columns null (no coercion). */
const adminNulls = {
  workDate: null as Date | null,
  proposedStartTime: null as Date | null,
  proposedEndTime: null as Date | null,
  proposedMinutes: null as number | null,
  reasonOptionId: null as string | null,
  requestedByUserId: null as string | null,
  batchId: null as string | null,
};

function detectionRow(overrides: Record<string, unknown> = {}): OvertimeRequestRecord {
  const shiftEndTime = new Date('2026-07-10T23:00:00.000Z');
  const actualEndTime = new Date('2026-07-10T23:35:00.000Z');
  return {
    id: 'req-1',
    tenantId: TENANT,
    employeeId: 'emp-1',
    locationId: 'loc-1',
    type: OvertimeRequestType.DETECCION_AUTOMATICA,
    shiftEndTime,
    actualEndTime,
    accumulatedMinutes: 35,
    status: OvertimeStatus.PENDIENTE_ADMIN,
    payrollPeriod: '2026-07',
    ...adminNulls,
    createdAt: new Date('2026-07-10T12:00:00.000Z'),
    updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

function adminCreateData(
  overrides: Partial<CreateAdministrativeOvertimeRequestData> = {},
): CreateAdministrativeOvertimeRequestData {
  return {
    employeeId: 'emp-1',
    locationId: 'loc-1',
    payrollPeriod: '2026-07',
    workDate: new Date('2026-07-15T00:00:00.000Z'),
    proposedStartTime: new Date('2026-07-15T22:00:00.000Z'),
    proposedEndTime: new Date('2026-07-16T00:00:00.000Z'),
    proposedMinutes: 120,
    reasonOptionId: 'reason-1',
    requestedByUserId: 'user-admin-1',
    batchId: 'batch-1',
    type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
    status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    ...overrides,
  };
}

function adminRow(overrides: Record<string, unknown> = {}): OvertimeRequestRecord {
  const data = adminCreateData();
  return {
    id: 'admin-req-1',
    tenantId: TENANT,
    employeeId: data.employeeId,
    locationId: data.locationId,
    type: data.type,
    shiftEndTime: null,
    actualEndTime: null,
    accumulatedMinutes: null,
    status: data.status,
    payrollPeriod: data.payrollPeriod,
    workDate: data.workDate,
    proposedStartTime: data.proposedStartTime,
    proposedEndTime: data.proposedEndTime,
    proposedMinutes: data.proposedMinutes,
    reasonOptionId: data.reasonOptionId,
    requestedByUserId: data.requestedByUserId,
    batchId: data.batchId,
    createdAt: new Date('2026-07-15T12:00:00.000Z'),
    updatedAt: new Date('2026-07-15T12:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

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
    prisma.overtimeRequest.findFirst.mockResolvedValue(detectionRow());

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
    prisma.overtimeRequest.update.mockResolvedValue(
      detectionRow({
        shiftEndTime: shiftEnd,
        actualEndTime: actualEnd,
        accumulatedMinutes: 40,
      }),
    );

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

  it('findOvertimeScopeLogsForPeriod filtra logs OVERTIME activos por rango workDate', async () => {
    prisma.attendanceLog.findMany.mockResolvedValue([]);

    await repository.findOvertimeScopeLogsForPeriod(
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
          markingScope: 'OVERTIME',
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
    const shiftEndTime = new Date('2026-07-10T23:00:00.000Z');
    const actualEndTime = new Date('2026-07-10T23:35:00.000Z');
    const row = detectionRow({ shiftEndTime, actualEndTime });
    prisma.overtimeRequest.create.mockResolvedValue(row);

    const result = await repository.createRequest(TENANT, {
      employeeId: 'emp-1',
      locationId: 'loc-1',
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime,
      actualEndTime,
      accumulatedMinutes: 35,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
    });

    expect(result.tenantId).toBe(TENANT);
    expect(result.workDate).toBeNull();
    expect(result.batchId).toBeNull();
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
        ...detectionRow(),
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
      ...detectionRow(),
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
    expect(detail?.proposedMinutes).toBeNull();
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
    prisma.overtimeRequest.update.mockResolvedValue(
      detectionRow({
        accumulatedMinutes: 50,
        status: OvertimeStatus.APROBADA,
      }),
    );

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

  it('findApprovedAdministrativeWindowsByEmployeeIdsForPeriod retorna vacío sin ids', async () => {
    await expect(
      repository.findApprovedAdministrativeWindowsByEmployeeIdsForPeriod(TENANT, [], '2026-07'),
    ).resolves.toEqual([]);
    expect(prisma.overtimeRequest.findMany).not.toHaveBeenCalled();
  });

  it('findApprovedAdministrativeWindowsByEmployeeIdsForPeriod consulta bulk tenant-scoped y omite incompletas', async () => {
    prisma.overtimeRequest.findMany.mockResolvedValue([
      {
        employeeId: 'emp-1',
        locationId: 'loc-1',
        workDate: new Date('2026-07-15T00:00:00.000Z'),
        proposedStartTime: new Date('2026-07-15T22:00:00.000Z'),
        proposedEndTime: new Date('2026-07-16T00:00:00.000Z'),
        proposedMinutes: 120,
      },
      {
        employeeId: 'emp-2',
        locationId: 'loc-1',
        workDate: null,
        proposedStartTime: new Date('2026-07-15T22:00:00.000Z'),
        proposedEndTime: new Date('2026-07-16T00:00:00.000Z'),
        proposedMinutes: 120,
      },
      {
        employeeId: 'emp-3',
        locationId: 'loc-1',
        workDate: new Date('2026-07-16T00:00:00.000Z'),
        proposedStartTime: new Date('2026-07-16T23:00:00.000Z'),
        proposedEndTime: new Date('2026-07-16T22:00:00.000Z'),
        proposedMinutes: 0,
      },
    ]);

    const windows = await repository.findApprovedAdministrativeWindowsByEmployeeIdsForPeriod(
      TENANT,
      ['emp-1', 'emp-2', 'emp-3'],
      '2026-07',
    );

    expect(prisma.overtimeRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT,
          employeeId: { in: ['emp-1', 'emp-2', 'emp-3'] },
          payrollPeriod: '2026-07',
          type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
          status: OvertimeStatus.APROBADA,
          deletedAt: null,
        }),
      }),
    );
    expect(windows).toEqual([
      {
        employeeId: 'emp-1',
        locationId: 'loc-1',
        workDate: new Date('2026-07-15T00:00:00.000Z'),
        proposedStartTime: new Date('2026-07-15T22:00:00.000Z'),
        proposedEndTime: new Date('2026-07-16T00:00:00.000Z'),
        proposedMinutes: 120,
      },
    ]);
  });

  it('listInbox indica hasNextPage cuando hay más resultados', async () => {
    const row = {
      ...detectionRow(),
      employee: { user: { email: 'ana@test.dev' } },
      location: { name: 'Sede 1' },
    };
    prisma.overtimeRequest.findMany.mockResolvedValue([row, { ...row, id: 'req-2' }]);

    const page = await repository.listInbox(TENANT, { take: 1 });
    expect(page.pageInfo.hasNextPage).toBe(true);
    expect(page.items).toHaveLength(1);
  });

  describe('OS-606 administrative persistence', () => {
    it('createAdministrativeRequest persiste campos admin completos y estado Operaciones', async () => {
      const data = adminCreateData();
      prisma.overtimeRequest.create.mockResolvedValue(adminRow());

      const result = await repository.createAdministrativeRequest(TENANT, data);

      expect(prisma.overtimeRequest.create).toHaveBeenCalledWith({
        data: {
          tenantId: TENANT,
          employeeId: data.employeeId,
          locationId: data.locationId,
          type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
          status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
          payrollPeriod: data.payrollPeriod,
          workDate: data.workDate,
          proposedStartTime: data.proposedStartTime,
          proposedEndTime: data.proposedEndTime,
          proposedMinutes: data.proposedMinutes,
          reasonOptionId: data.reasonOptionId,
          requestedByUserId: data.requestedByUserId,
          batchId: data.batchId,
          shiftEndTime: null,
          actualEndTime: null,
          accumulatedMinutes: null,
        },
      });
      expect(result.type).toBe(OvertimeRequestType.SOLICITUD_ADMINISTRATIVA);
      expect(result.status).toBe(OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES);
      expect(result.proposedMinutes).toBe(120);
      expect(result.reasonOptionId).toBe('reason-1');
      expect(result.requestedByUserId).toBe('user-admin-1');
      expect(result.batchId).toBe('batch-1');
      expect(result.shiftEndTime).toBeNull();
      expect(result.actualEndTime).toBeNull();
      expect(result.accumulatedMinutes).toBeNull();
    });

    it('createAdministrativeRequest usa TransactionClient cuando se proporciona', async () => {
      const data = adminCreateData();
      const txCreate = jest.fn().mockResolvedValue(adminRow({ id: 'admin-tx-1' }));
      const tx = {
        overtimeRequest: { create: txCreate },
      } as unknown as Prisma.TransactionClient;

      const result = await repository.createAdministrativeRequest(TENANT, data, tx);

      expect(txCreate).toHaveBeenCalled();
      expect(prisma.overtimeRequest.create).not.toHaveBeenCalled();
      expect(result.id).toBe('admin-tx-1');
    });

    it('createAdministrativeRequests crea N filas con el mismo TransactionClient', async () => {
      const rows = [
        adminCreateData({ employeeId: 'emp-1', batchId: 'batch-n' }),
        adminCreateData({ employeeId: 'emp-2', batchId: 'batch-n' }),
      ];
      const txCreate = jest
        .fn()
        .mockResolvedValueOnce(adminRow({ id: 'a1', employeeId: 'emp-1', batchId: 'batch-n' }))
        .mockResolvedValueOnce(adminRow({ id: 'a2', employeeId: 'emp-2', batchId: 'batch-n' }));
      const tx = {
        overtimeRequest: { create: txCreate },
      } as unknown as Prisma.TransactionClient;

      const created = await repository.createAdministrativeRequests(TENANT, rows, tx);

      expect(txCreate).toHaveBeenCalledTimes(2);
      expect(prisma.overtimeRequest.create).not.toHaveBeenCalled();
      expect(created).toHaveLength(2);
      expect(created.map((r) => r.employeeId)).toEqual(['emp-1', 'emp-2']);
    });

    it('mapRequest conserva mapeo automático con columnas admin null', async () => {
      prisma.overtimeRequest.findFirst.mockResolvedValue(detectionRow());

      const result = await repository.findActiveAutomaticByPeriod(
        TENANT,
        'emp-1',
        'loc-1',
        '2026-07',
      );

      expect(result?.accumulatedMinutes).toBe(35);
      expect(result?.workDate).toBeNull();
      expect(result?.proposedStartTime).toBeNull();
      expect(result?.proposedEndTime).toBeNull();
      expect(result?.proposedMinutes).toBeNull();
      expect(result?.reasonOptionId).toBeNull();
      expect(result?.requestedByUserId).toBeNull();
      expect(result?.batchId).toBeNull();
    });

    it('findAdministrativeByEmployeeWorkDate es tenant-scoped y excluye deletedAt', async () => {
      const workDate = new Date('2026-07-15T00:00:00.000Z');
      prisma.overtimeRequest.findMany.mockResolvedValue([adminRow()]);

      const result = await repository.findAdministrativeByEmployeeWorkDate(
        TENANT,
        'emp-1',
        'loc-1',
        workDate,
      );

      expect(prisma.overtimeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: TENANT,
            employeeId: 'emp-1',
            locationId: 'loc-1',
            workDate,
            type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
            deletedAt: null,
          },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('findOverlappingAdministrativeWindows consulta solape tenant-scoped sin depender solo del unique', async () => {
      const start = new Date('2026-07-15T22:00:00.000Z');
      const end = new Date('2026-07-16T00:00:00.000Z');
      prisma.overtimeRequest.findMany.mockResolvedValue([adminRow()]);

      const result = await repository.findOverlappingAdministrativeWindows(TENANT, {
        employeeId: 'emp-1',
        locationId: 'loc-1',
        proposedStartTime: start,
        proposedEndTime: end,
      });

      expect(prisma.overtimeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            employeeId: 'emp-1',
            locationId: 'loc-1',
            type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
            deletedAt: null,
            status: {
              in: [
                OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
                OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
                OvertimeStatus.APROBADA,
              ],
            },
            proposedStartTime: { lt: end },
            proposedEndTime: { gt: start },
          }),
        }),
      );
      expect(result[0]?.proposedMinutes).toBe(120);
    });

    it('findByBatchId filtra por tenantId y batchId con deletedAt null', async () => {
      prisma.overtimeRequest.findMany.mockResolvedValue([
        adminRow({ id: 'a1', batchId: 'batch-xyz' }),
        adminRow({ id: 'a2', employeeId: 'emp-2', batchId: 'batch-xyz' }),
      ]);

      const result = await repository.findByBatchId(TENANT, 'batch-xyz');

      expect(prisma.overtimeRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: TENANT,
            batchId: 'batch-xyz',
            deletedAt: null,
          },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('no coerción: minutos y ventanas detection/admin pasan null sin default ficticio', async () => {
      prisma.overtimeRequest.create.mockResolvedValue(
        adminRow({
          proposedMinutes: null,
          shiftEndTime: null,
          accumulatedMinutes: null,
        }),
      );

      const result = await repository.createAdministrativeRequest(TENANT, adminCreateData());

      expect(result.proposedMinutes).toBeNull();
      expect(result.accumulatedMinutes).toBeNull();
      expect(result.shiftEndTime).toBeNull();
    });
  });
});
