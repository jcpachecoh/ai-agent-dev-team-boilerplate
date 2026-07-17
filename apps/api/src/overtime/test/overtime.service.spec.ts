import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OvertimeRequestType, OvertimeStatus } from '@prisma/client';

import { OvertimeRepository } from '../repository/overtime.repository';
import { OvertimeAdminCreateService } from '../service/overtime-admin-create.service';
import { OvertimeApprovalService } from '../service/overtime-approval.service';
import { OvertimeService } from '../service/overtime.service';

describe('OvertimeService', () => {
  let service: OvertimeService;
  let repository: jest.Mocked<OvertimeRepository>;
  let approvalService: jest.Mocked<OvertimeApprovalService>;
  let adminCreateService: jest.Mocked<OvertimeAdminCreateService>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      findActorContext: jest.fn(),
      countByStatusForPeriod: jest.fn(),
    } as unknown as jest.Mocked<OvertimeRepository>;

    approvalService = {
      listInbox: jest.fn(),
      approve: jest.fn(),
      object: jest.fn(),
      assertActorCanApproveLevel: jest.fn(),
    } as unknown as jest.Mocked<OvertimeApprovalService>;

    adminCreateService = {
      createAdministrativeBatch: jest.fn(),
    } as unknown as jest.Mocked<OvertimeAdminCreateService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OvertimeService,
        { provide: OvertimeRepository, useValue: repository },
        { provide: OvertimeApprovalService, useValue: approvalService },
        { provide: OvertimeAdminCreateService, useValue: adminCreateService },
      ],
    }).compile();

    service = module.get(OvertimeService);
  });

  it('getPeriodSummary agrega conteos por estado', async () => {
    repository.countByStatusForPeriod
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    const result = await service.getPeriodSummary('tenant-1', '2026-07');

    expect(result).toEqual({
      payrollPeriod: '2026-07',
      pendingCount: 2,
      approvedCount: 1,
      objectedCount: 0,
    });
  });

  it('getById permite lectura a rol NOMINA', async () => {
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
      locationName: 'Sede',
      approvals: [],
    });
    repository.findActorContext.mockResolvedValue({
      userId: 'u-1',
      roleCode: 'NOMINA',
      positionId: null,
      locationIds: [],
    });

    const result = await service.getById('tenant-1', 'u-1', 'req-1');
    expect(result.id).toBe('req-1');
  });

  it('getById lanza ForbiddenException sin acceso', async () => {
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
      locationName: 'Sede',
      approvals: [],
    });
    repository.findActorContext.mockResolvedValue({
      userId: 'u-1',
      roleCode: 'OPERATOR',
      positionId: null,
      locationIds: [],
    });
    approvalService.listInbox.mockResolvedValue({
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });
    approvalService.assertActorCanApproveLevel.mockImplementation(() => {
      throw new ForbiddenException();
    });

    await expect(service.getById('tenant-1', 'u-1', 'req-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('getById lanza NotFoundException si no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.getById('tenant-1', 'u-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getById permite acceso al aprobador activo', async () => {
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
      locationName: 'Sede',
      approvals: [],
    });
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
    });
    approvalService.assertActorCanApproveLevel.mockImplementation(() => undefined);

    const result = await service.getById('tenant-1', 'admin', 'req-1');
    expect(result.id).toBe('req-1');
  });

  it('getById permite acceso vía bandeja del actor', async () => {
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
      locationName: 'Sede',
      approvals: [],
    });
    repository.findActorContext.mockResolvedValue({
      userId: 'ops',
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-003',
      locationIds: ['loc-1'],
    });
    approvalService.assertActorCanApproveLevel.mockImplementation(() => {
      throw new ForbiddenException();
    });
    approvalService.listInbox.mockResolvedValue({
      items: [
        {
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
          locationName: 'Sede',
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    const result = await service.getById('tenant-1', 'ops', 'req-1');
    expect(result.id).toBe('req-1');
  });

  it('delega approve y object en OvertimeApprovalService', async () => {
    const detail = {
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
      locationName: 'Sede',
      approvals: [],
    };
    approvalService.approve.mockResolvedValue(detail);
    approvalService.object.mockResolvedValue(detail);

    await service.approve('tenant-1', 'admin', { overtimeRequestId: 'req-1' });
    await service.object('tenant-1', 'admin', {
      overtimeRequestId: 'req-1',
      comment: 'No',
    });

    expect(approvalService.approve).toHaveBeenCalled();
    expect(approvalService.object).toHaveBeenCalled();
  });
});
