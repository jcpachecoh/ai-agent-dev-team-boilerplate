import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { EmployeeCatalogType, OvertimeRequestType, OvertimeStatus, Prisma } from '@prisma/client';

import { EmployeeCatalogRepository } from '../../payroll/repository/employee-catalog.repository';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateAdministrativeOvertimeBatchInput } from '../interfaces/overtime.interfaces';
import { OvertimeRepository } from '../repository/overtime.repository';
import { OvertimeAdminCreateService } from '../service/overtime-admin-create.service';
import { OvertimeNotificationService } from '../service/overtime-notification.service';

const TENANT = 'tenant-1';
const ACTOR = 'user-admin-1';
const LOCATION = 'loc-1';
const REASON = 'reason-aseo';

const workDate = new Date('2026-07-20T00:00:00.000Z');
/** 22:00 Bogotá 2026-07-20 */
const startSameDay = new Date('2026-07-20T22:00:00.000-05:00');
/** 23:00 Bogotá same day */
const endSameDay = new Date('2026-07-20T23:00:00.000-05:00');
/** 01:00 Bogotá next calendar day (midnight cross) */
const endAfterMidnight = new Date('2026-07-21T01:00:00.000-05:00');

function baseInput(
  overrides: Partial<CreateAdministrativeOvertimeBatchInput> = {},
): CreateAdministrativeOvertimeBatchInput {
  return {
    employeeIds: ['emp-1'],
    locationId: LOCATION,
    workDate,
    proposedStartTime: startSameDay,
    proposedEndTime: endSameDay,
    reasonOptionId: REASON,
    ...overrides,
  };
}

function adminRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'req-1',
    tenantId: TENANT,
    employeeId: 'emp-1',
    locationId: LOCATION,
    type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
    shiftEndTime: null,
    actualEndTime: null,
    accumulatedMinutes: null,
    status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    payrollPeriod: '2026-07',
    workDate,
    proposedStartTime: startSameDay,
    proposedEndTime: endSameDay,
    proposedMinutes: 60,
    reasonOptionId: REASON,
    requestedByUserId: ACTOR,
    batchId: 'batch-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };
}

describe('OvertimeAdminCreateService', () => {
  let service: OvertimeAdminCreateService;
  let repository: jest.Mocked<OvertimeRepository>;
  let catalog: jest.Mocked<EmployeeCatalogRepository>;
  let notification: jest.Mocked<OvertimeNotificationService>;
  let prisma: { $transaction: jest.Mock };

  beforeEach(async () => {
    repository = {
      findActorContext: jest.fn().mockResolvedValue({
        userId: ACTOR,
        roleCode: 'MANAGER',
        positionId: 'pos-pdl-001',
        locationIds: [LOCATION],
      }),
      findActiveLocationById: jest.fn().mockResolvedValue({ id: LOCATION }),
      findActiveEmployeesByIds: jest
        .fn()
        .mockResolvedValue([{ id: 'emp-1', locationId: LOCATION, isActive: true }]),
      findOverlappingAdministrativeWindows: jest.fn().mockResolvedValue([]),
      createAdministrativeRequests: jest.fn().mockImplementation((_t, rows) =>
        Promise.resolve(
          rows.map((row: { employeeId: string; batchId: string }, index: number) =>
            adminRow({
              id: `req-${index + 1}`,
              employeeId: row.employeeId,
              batchId: row.batchId,
              proposedMinutes: 60,
              proposedStartTime: startSameDay,
              proposedEndTime: endSameDay,
              status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
            }),
          ),
        ),
      ),
    } as unknown as jest.Mocked<OvertimeRepository>;

    catalog = {
      findActiveByIdAndType: jest.fn().mockResolvedValue({
        id: REASON,
        tenantId: TENANT,
        type: EmployeeCatalogType.OVERTIME_REASON,
        name: 'Aseo',
        pilaCode: null,
        isActive: true,
      }),
    } as unknown as jest.Mocked<EmployeeCatalogRepository>;

    notification = {
      notifyLevelPending: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OvertimeNotificationService>;

    prisma = {
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn({ tag: 'tx' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OvertimeAdminCreateService,
        { provide: OvertimeRepository, useValue: repository },
        { provide: EmployeeCatalogRepository, useValue: catalog },
        { provide: OvertimeNotificationService, useValue: notification },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(OvertimeAdminCreateService);
  });

  it('crea un empleado con estado Operaciones, minutos y payrollPeriod derivados', async () => {
    const result = await service.createAdministrativeBatch(TENANT, ACTOR, baseInput());

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe(OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES);
    expect(result.items[0].type).toBe(OvertimeRequestType.SOLICITUD_ADMINISTRATIVA);
    expect(result.batchId).toBeTruthy();
    expect(repository.createAdministrativeRequests).toHaveBeenCalledWith(
      TENANT,
      [
        expect.objectContaining({
          employeeId: 'emp-1',
          proposedMinutes: 60,
          payrollPeriod: '2026-07',
          batchId: result.batchId,
          type: OvertimeRequestType.SOLICITUD_ADMINISTRATIVA,
          status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
          requestedByUserId: ACTOR,
        }),
      ],
      { tag: 'tx' },
    );
    expect(notification.notifyLevelPending).toHaveBeenCalledWith(
      TENANT,
      'req-1',
      OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    );
  });

  it('crea multi-empleado con el mismo batchId', async () => {
    repository.findActiveEmployeesByIds.mockResolvedValue([
      { id: 'emp-1', locationId: LOCATION, isActive: true },
      { id: 'emp-2', locationId: LOCATION, isActive: true },
    ]);

    const result = await service.createAdministrativeBatch(
      TENANT,
      ACTOR,
      baseInput({ employeeIds: ['emp-1', 'emp-2'] }),
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0].batchId).toBe(result.batchId);
    expect(result.items[1].batchId).toBe(result.batchId);
    expect(notification.notifyLevelPending).toHaveBeenCalledTimes(2);
  });

  it('soporta cruce de medianoche (22:00–01:00 = 180 minutos)', async () => {
    await service.createAdministrativeBatch(
      TENANT,
      ACTOR,
      baseInput({
        proposedStartTime: startSameDay,
        proposedEndTime: endAfterMidnight,
      }),
    );

    expect(repository.createAdministrativeRequests).toHaveBeenCalledWith(
      TENANT,
      [expect.objectContaining({ proposedMinutes: 180, payrollPeriod: '2026-07' })],
      expect.anything(),
    );
  });

  it('rechaza employeeIds duplicados', async () => {
    await expect(
      service.createAdministrativeBatch(
        TENANT,
        ACTOR,
        baseInput({ employeeIds: ['emp-1', 'emp-1'] }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rechaza solicitante inválido / inactivo', async () => {
    repository.findActorContext.mockResolvedValue(null);
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza solicitante sin cargo Administrador de sede', async () => {
    repository.findActorContext.mockResolvedValue({
      userId: ACTOR,
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-003',
      locationIds: [LOCATION],
    });
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza solicitante sin acceso a la sede', async () => {
    repository.findActorContext.mockResolvedValue({
      userId: ACTOR,
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-other'],
    });
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza empleado inactivo', async () => {
    repository.findActiveEmployeesByIds.mockResolvedValue([
      { id: 'emp-1', locationId: LOCATION, isActive: false },
    ]);
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza empleado de otro tenant / inexistente', async () => {
    repository.findActiveEmployeesByIds.mockResolvedValue([]);
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza empleado no asociado a la sede', async () => {
    repository.findActiveEmployeesByIds.mockResolvedValue([
      { id: 'emp-1', locationId: 'loc-other', isActive: true },
    ]);
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza sede inexistente', async () => {
    repository.findActiveLocationById.mockResolvedValue(null);
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rechaza motivo inexistente / inactivo / tipo incorrecto / otro tenant', async () => {
    catalog.findActiveByIdAndType.mockResolvedValue(null);
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(catalog.findActiveByIdAndType).toHaveBeenCalledWith(
      TENANT,
      REASON,
      EmployeeCatalogType.OVERTIME_REASON,
    );
  });

  it.each([
    OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
    OvertimeStatus.APROBADA,
  ])('bloquea solape con status %s', async (status) => {
    repository.findOverlappingAdministrativeWindows.mockResolvedValue([
      adminRow({ status, id: 'conflict-1' }),
    ]);

    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createAdministrativeRequests).not.toHaveBeenCalled();
  });

  it('OBJETADA no bloquea (overlap query vacía)', async () => {
    repository.findOverlappingAdministrativeWindows.mockResolvedValue([]);
    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).resolves.toMatchObject({ items: [expect.objectContaining({ employeeId: 'emp-1' })] });
  });

  it('permite ventanas contiguas (sin intersección)', async () => {
    repository.findOverlappingAdministrativeWindows.mockResolvedValue([]);
    const contiguousEnd = new Date('2026-07-20T22:00:00.000-05:00');
    const contiguousStart = contiguousEnd;
    // New window starts exactly when prior ends — repo returns [] (no gt/lt overlap).
    await expect(
      service.createAdministrativeBatch(
        TENANT,
        ACTOR,
        baseInput({
          proposedStartTime: contiguousStart,
          proposedEndTime: endSameDay,
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('rollback total: si un empleado falla por solape no crea ninguna fila', async () => {
    repository.findActiveEmployeesByIds.mockResolvedValue([
      { id: 'emp-1', locationId: LOCATION, isActive: true },
      { id: 'emp-2', locationId: LOCATION, isActive: true },
    ]);
    repository.findOverlappingAdministrativeWindows
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([adminRow({ employeeId: 'emp-2', id: 'conflict-2' })]);

    await expect(
      service.createAdministrativeBatch(
        TENANT,
        ACTOR,
        baseInput({ employeeIds: ['emp-1', 'emp-2'] }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(repository.createAdministrativeRequests).not.toHaveBeenCalled();
    expect(notification.notifyLevelPending).not.toHaveBeenCalled();
  });

  it('convierte P2002 en ConflictException', async () => {
    repository.createAdministrativeRequests.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createAdministrativeBatch(TENANT, ACTOR, baseInput()),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(notification.notifyLevelPending).not.toHaveBeenCalled();
  });

  it('notifica solo tras éxito de la transacción', async () => {
    prisma.$transaction.mockRejectedValue(new Error('db down'));
    await expect(service.createAdministrativeBatch(TENANT, ACTOR, baseInput())).rejects.toThrow(
      'db down',
    );
    expect(notification.notifyLevelPending).not.toHaveBeenCalled();
  });

  it('rechaza end <= start', async () => {
    await expect(
      service.createAdministrativeBatch(
        TENANT,
        ACTOR,
        baseInput({
          proposedStartTime: endSameDay,
          proposedEndTime: startSameDay,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
