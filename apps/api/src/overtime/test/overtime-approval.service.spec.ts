import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OvertimeApprovalDecision,
  OvertimeApprovalLevel,
  OvertimeRequestType,
  OvertimeStatus,
} from '@prisma/client';

import { OvertimeRepository } from '../repository/overtime.repository';
import { OvertimeApprovalService } from '../service/overtime-approval.service';
import { OvertimeNotificationService } from '../service/overtime-notification.service';

const TENANT = 'tenant-1';

const baseRequest = {
  id: 'req-1',
  tenantId: TENANT,
  employeeId: 'emp-1',
  locationId: 'loc-1',
  type: OvertimeRequestType.DETECCION_AUTOMATICA,
  shiftEndTime: new Date(),
  actualEndTime: new Date(),
  accumulatedMinutes: 45,
  payrollPeriod: '2026-07',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  employeeName: 'Juan',
  locationName: 'Sede 1',
  approvals: [],
};

describe('OvertimeApprovalService', () => {
  let service: OvertimeApprovalService;
  let repository: jest.Mocked<OvertimeRepository>;
  let notificationService: jest.Mocked<OvertimeNotificationService>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      updateRequest: jest.fn(),
      upsertApproval: jest.fn(),
      findActorContext: jest.fn(),
      listInbox: jest.fn(),
    } as unknown as jest.Mocked<OvertimeRepository>;

    notificationService = {
      notifyLevelPending: jest.fn().mockResolvedValue(undefined),
      notifyEmployeeTerminal: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OvertimeNotificationService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OvertimeApprovalService,
        { provide: OvertimeRepository, useValue: repository },
        { provide: OvertimeNotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get(OvertimeApprovalService);
  });

  it('cascada Admin → Operaciones → General → APROBADA', async () => {
    const statuses = [
      OvertimeStatus.PENDIENTE_ADMIN,
      OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
    ];
    const actors = [
      { userId: 'admin', positionId: 'pos-pdl-001', locationIds: ['loc-1'], roleCode: 'MANAGER' },
      {
        userId: 'ops',
        positionId: 'pos-pdl-003',
        locationIds: ['loc-1'],
        roleCode: 'MANAGER',
      },
      {
        userId: 'gg',
        positionId: 'pos-pdl-007',
        locationIds: ['loc-1'],
        roleCode: 'MANAGER',
      },
    ];

    for (let i = 0; i < statuses.length; i += 1) {
      const nextStatus =
        i === 0
          ? OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES
          : i === 1
            ? OvertimeStatus.PENDIENTE_GERENCIA_GENERAL
            : OvertimeStatus.APROBADA;

      repository.findById
        .mockResolvedValueOnce({ ...baseRequest, status: statuses[i], approvals: [] })
        .mockResolvedValueOnce({ ...baseRequest, status: nextStatus, approvals: [] });
      repository.findActorContext.mockResolvedValue(actors[i]);
      repository.updateRequest.mockResolvedValue({ ...baseRequest, status: nextStatus });
      repository.upsertApproval.mockResolvedValue({
        id: `appr-${i}`,
        tenantId: TENANT,
        overtimeRequestId: 'req-1',
        level: OvertimeApprovalLevel.ADMINISTRADOR,
        approverId: actors[i].userId,
        decision: OvertimeApprovalDecision.APROBADO,
        decidedAt: new Date(),
        comment: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.approve(TENANT, actors[i].userId, {
        overtimeRequestId: 'req-1',
      });

      expect(result.status).toBe(nextStatus);
    }
  });

  it('objeción en PENDIENTE_ADMIN termina en OBJETADA', async () => {
    repository.findById
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.PENDIENTE_ADMIN })
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.OBJETADA });
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });
    repository.updateRequest.mockResolvedValue({ ...baseRequest, status: OvertimeStatus.OBJETADA });

    const result = await service.object(TENANT, 'admin', {
      overtimeRequestId: 'req-1',
      comment: 'No autorizado',
    });

    expect(result.status).toBe(OvertimeStatus.OBJETADA);
  });

  it('rechaza actor con cargo incorrecto', async () => {
    repository.findById.mockResolvedValue({
      ...baseRequest,
      status: OvertimeStatus.PENDIENTE_ADMIN,
    });
    repository.findActorContext.mockResolvedValue({
      userId: 'wrong',
      positionId: 'pos-pdl-007',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });

    await expect(
      service.approve(TENANT, 'wrong', { overtimeRequestId: 'req-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza administrador de otra sede', async () => {
    repository.findById.mockResolvedValue({
      ...baseRequest,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      locationId: 'loc-2',
    });
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });

    await expect(
      service.approve(TENANT, 'admin', { overtimeRequestId: 'req-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('objeción sin comentario lanza BadRequestException', async () => {
    await expect(
      service.object(TENANT, 'admin', { overtimeRequestId: 'req-1', comment: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('solicitud inexistente lanza NotFoundException', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.approve(TENANT, 'admin', { overtimeRequestId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('listInbox NOMINA ve histórico completo', async () => {
    repository.findActorContext.mockResolvedValue({
      userId: 'nomina',
      roleCode: 'NOMINA',
      positionId: null,
      locationIds: [],
    });
    repository.listInbox.mockResolvedValue({
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    await service.listInbox(TENANT, 'nomina', { payrollPeriod: '2026-07' });

    expect(repository.listInbox).toHaveBeenCalledWith(
      TENANT,
      expect.objectContaining({ payrollPeriod: '2026-07' }),
    );
  });

  it('listInbox administrador filtra por sedes asignadas', async () => {
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
    });
    repository.listInbox.mockResolvedValue({
      items: [
        {
          id: 'req-1',
          tenantId: TENANT,
          employeeId: 'emp-1',
          locationId: 'loc-1',
          type: OvertimeRequestType.DETECCION_AUTOMATICA,
          shiftEndTime: new Date(),
          actualEndTime: new Date(),
          accumulatedMinutes: 40,
          status: OvertimeStatus.PENDIENTE_ADMIN,
          payrollPeriod: '2026-07',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          employeeName: 'Ana',
          locationName: 'Sede 1',
        },
        {
          id: 'req-2',
          tenantId: TENANT,
          employeeId: 'emp-2',
          locationId: 'loc-2',
          type: OvertimeRequestType.DETECCION_AUTOMATICA,
          shiftEndTime: new Date(),
          actualEndTime: new Date(),
          accumulatedMinutes: 40,
          status: OvertimeStatus.PENDIENTE_ADMIN,
          payrollPeriod: '2026-07',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          employeeName: 'Luis',
          locationName: 'Sede 2',
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    const page = await service.listInbox(TENANT, 'admin', {});
    expect(page.items).toHaveLength(1);
    expect(page.items[0].locationId).toBe('loc-1');
  });

  it('objeción en PENDIENTE_GERENCIA_OPERACIONES termina en OBJETADA', async () => {
    repository.findById
      .mockResolvedValueOnce({
        ...baseRequest,
        status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      })
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.OBJETADA });
    repository.findActorContext.mockResolvedValue({
      userId: 'ops',
      positionId: 'pos-pdl-003',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });
    repository.updateRequest.mockResolvedValue({ ...baseRequest, status: OvertimeStatus.OBJETADA });

    const result = await service.object(TENANT, 'ops', {
      overtimeRequestId: 'req-1',
      comment: 'No procede',
    });

    expect(result.status).toBe(OvertimeStatus.OBJETADA);
  });

  it('objeción en PENDIENTE_GERENCIA_GENERAL termina en OBJETADA', async () => {
    repository.findById
      .mockResolvedValueOnce({
        ...baseRequest,
        status: OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
      })
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.OBJETADA });
    repository.findActorContext.mockResolvedValue({
      userId: 'gg',
      positionId: 'pos-pdl-007',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });
    repository.updateRequest.mockResolvedValue({ ...baseRequest, status: OvertimeStatus.OBJETADA });

    const result = await service.object(TENANT, 'gg', {
      overtimeRequestId: 'req-1',
      comment: 'Rechazado por gerencia general',
    });

    expect(result.status).toBe(OvertimeStatus.OBJETADA);
  });

  it('approve en estado terminal lanza BadRequestException', async () => {
    repository.findById.mockResolvedValue({ ...baseRequest, status: OvertimeStatus.APROBADA });
    repository.findActorContext.mockResolvedValue({
      userId: 'gg',
      positionId: 'pos-pdl-007',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });

    await expect(
      service.approve(TENANT, 'gg', { overtimeRequestId: 'req-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('listInbox retorna vacío sin cargo aprobador', async () => {
    repository.findActorContext.mockResolvedValue({
      userId: 'op',
      roleCode: 'OPERATOR',
      positionId: null,
      locationIds: [],
    });

    const page = await service.listInbox(TENANT, 'op', {});
    expect(page.items).toHaveLength(0);
  });

  it('listInbox gerencia operaciones usa estado pendiente operaciones', async () => {
    repository.findActorContext.mockResolvedValue({
      userId: 'ops',
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-003',
      locationIds: ['loc-1'],
    });
    repository.listInbox.mockResolvedValue({
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    await service.listInbox(TENANT, 'ops', { payrollPeriod: '2026-07' });

    expect(repository.listInbox).toHaveBeenCalledWith(
      TENANT,
      expect.objectContaining({
        status: [OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES],
      }),
    );
  });

  it('listInbox gerencia general respeta filtros de estado explícitos', async () => {
    repository.findActorContext.mockResolvedValue({
      userId: 'gg',
      roleCode: 'MANAGER',
      positionId: 'pos-pdl-007',
      locationIds: ['loc-1'],
    });
    repository.listInbox.mockResolvedValue({
      items: [],
      pageInfo: { hasNextPage: false, endCursor: null },
    });

    await service.listInbox(TENANT, 'gg', {
      status: [OvertimeStatus.PENDIENTE_GERENCIA_GENERAL],
    });

    expect(repository.listInbox).toHaveBeenCalledWith(
      TENANT,
      expect.objectContaining({
        status: [OvertimeStatus.PENDIENTE_GERENCIA_GENERAL],
      }),
    );
  });

  it('actor inexistente lanza ForbiddenException', async () => {
    repository.findById.mockResolvedValue({
      ...baseRequest,
      status: OvertimeStatus.PENDIENTE_ADMIN,
    });
    repository.findActorContext.mockResolvedValue(null);

    await expect(
      service.approve(TENANT, 'ghost', { overtimeRequestId: 'req-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rol OWNER no puede aprobar', () => {
    expect(() =>
      service.assertActorCanApproveLevel(
        { userId: 'owner', roleCode: 'OWNER', positionId: 'pos-pdl-001', locationIds: ['loc-1'] },
        OvertimeApprovalLevel.ADMINISTRADOR,
        'loc-1',
      ),
    ).toThrow(ForbiddenException);
  });

  it('rol NOMINA puede aprobar sin cargo de cascada', () => {
    expect(() =>
      service.assertActorCanApproveLevel(
        { userId: 'nomina', roleCode: 'NOMINA', positionId: null, locationIds: [] },
        OvertimeApprovalLevel.ADMINISTRADOR,
        'loc-1',
      ),
    ).not.toThrow();
  });

  it('NOMINA aprueba solicitud pendiente de administrador', async () => {
    repository.findById
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.PENDIENTE_ADMIN })
      .mockResolvedValueOnce({
        ...baseRequest,
        status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      });
    repository.findActorContext.mockResolvedValue({
      userId: 'nomina',
      roleCode: 'NOMINA',
      positionId: null,
      locationIds: [],
    });
    repository.updateRequest.mockResolvedValue({
      ...baseRequest,
      status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    });

    const result = await service.approve(TENANT, 'nomina', { overtimeRequestId: 'req-1' });

    expect(result.status).toBe(OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES);
  });

  it('approve continúa si la notificación falla', async () => {
    repository.findById
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.PENDIENTE_ADMIN })
      .mockResolvedValueOnce({
        ...baseRequest,
        status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
      });
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });
    repository.updateRequest.mockResolvedValue({
      ...baseRequest,
      status: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
    });
    notificationService.notifyLevelPending.mockRejectedValue(new Error('smtp down'));

    const result = await service.approve(TENANT, 'admin', {
      overtimeRequestId: 'req-1',
      comment: '  ok  ',
    });

    expect(result.status).toBe(OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES);
    expect(repository.upsertApproval).toHaveBeenCalledWith(
      TENANT,
      'req-1',
      OvertimeApprovalLevel.ADMINISTRADOR,
      expect.objectContaining({ comment: 'ok' }),
    );
  });

  it('approve lanza NotFoundException si desaparece tras actualizar', async () => {
    repository.findById
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.PENDIENTE_ADMIN })
      .mockResolvedValueOnce(null);
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });

    await expect(
      service.approve(TENANT, 'admin', { overtimeRequestId: 'req-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('object lanza NotFoundException si solicitud no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.object(TENANT, 'admin', { overtimeRequestId: 'missing', comment: 'No' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('object en estado terminal lanza BadRequestException', async () => {
    repository.findById.mockResolvedValue({ ...baseRequest, status: OvertimeStatus.OBJETADA });
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });

    await expect(
      service.object(TENANT, 'admin', { overtimeRequestId: 'req-1', comment: 'Tarde' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('object continúa si notificación terminal falla', async () => {
    repository.findById
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.PENDIENTE_ADMIN })
      .mockResolvedValueOnce({ ...baseRequest, status: OvertimeStatus.OBJETADA });
    repository.findActorContext.mockResolvedValue({
      userId: 'admin',
      positionId: 'pos-pdl-001',
      locationIds: ['loc-1'],
      roleCode: 'MANAGER',
    });
    notificationService.notifyEmployeeTerminal.mockRejectedValue(new Error('smtp down'));

    const result = await service.object(TENANT, 'admin', {
      overtimeRequestId: 'req-1',
      comment: 'No autorizado',
    });

    expect(result.status).toBe(OvertimeStatus.OBJETADA);
  });
});
