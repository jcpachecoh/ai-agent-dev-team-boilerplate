import { Test, TestingModule } from '@nestjs/testing';
import {
  AttendanceEventType,
  OvertimeRequestType,
  OvertimeStatus,
  TurnoJornada,
} from '@prisma/client';

import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import { OVERTIME_ACCUMULATION_THRESHOLD_MINUTES } from '../interfaces/overtime.interfaces';
import { OvertimeRepository } from '../repository/overtime.repository';
import { OvertimeDetectionService } from '../service/overtime-detection.service';
import { OvertimeNotificationService } from '../service/overtime-notification.service';

describe('OvertimeDetectionService', () => {
  let service: OvertimeDetectionService;
  let repository: jest.Mocked<OvertimeRepository>;
  let shiftResolution: jest.Mocked<ShiftResolutionService>;
  let notificationService: jest.Mocked<OvertimeNotificationService>;

  const payload = {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    locationId: 'loc-1',
    workDate: new Date('2026-07-10T00:00:00.000Z'),
    actualEndTime: new Date('2026-07-10T18:00:00.000Z'),
  };

  const assignedShift = {
    kind: 'ASSIGNED' as const,
    source: 'CALENDAR' as const,
    turno: {
      id: 'turno-1',
      nombre: 'Admin',
      sigla: 'A',
      horaInicio: '08:00',
      horaFin: '17:00',
      jornada: TurnoJornada.DIURNO,
      locationId: 'loc-1',
      daysOfWeek: [4],
    },
    targetMinutes: 540,
  };

  function overtimePair(minutes: number) {
    const entry = new Date('2026-07-10T17:05:00.000Z');
    const exit = new Date(entry.getTime() + minutes * 60_000);
    return [
      {
        id: 'ot-entry',
        workDate: payload.workDate,
        eventType: AttendanceEventType.ENTRY,
        timestamp: entry,
      },
      {
        id: 'ot-exit',
        workDate: payload.workDate,
        eventType: AttendanceEventType.EXIT,
        timestamp: exit,
      },
    ];
  }

  beforeEach(async () => {
    repository = {
      findActiveAutomaticByPeriod: jest.fn().mockResolvedValue(null),
      findOvertimeScopeLogsForPeriod: jest.fn(),
      createRequest: jest.fn(),
      updateRequest: jest.fn(),
      upsertApproval: jest.fn(),
    } as unknown as jest.Mocked<OvertimeRepository>;

    shiftResolution = {
      resolveForDay: jest.fn().mockResolvedValue(assignedShift),
    } as unknown as jest.Mocked<ShiftResolutionService>;

    notificationService = {
      notifyLevelPending: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<OvertimeNotificationService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OvertimeDetectionService,
        { provide: OvertimeRepository, useValue: repository },
        { provide: ShiftResolutionService, useValue: shiftResolution },
        { provide: OvertimeNotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get(OvertimeDetectionService);
  });

  it('EXIT ordinario tardío sin par OVERTIME → 0 min acumulados → no solicitud', async () => {
    repository.findOvertimeScopeLogsForPeriod.mockResolvedValue([]);

    await service.onExitRegistered(payload);

    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('no crea solicitud con 30 min OVERTIME acumulados exactos', async () => {
    repository.findOvertimeScopeLogsForPeriod.mockResolvedValue(overtimePair(30));

    await service.onExitRegistered(payload);

    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('par OVERTIME 55 min → acumula 55 y crea solicitud', async () => {
    repository.findOvertimeScopeLogsForPeriod.mockResolvedValue(overtimePair(55));
    repository.createRequest.mockResolvedValue({
      id: 'req-55',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date('2026-07-10T17:00:00.000Z'),
      actualEndTime: payload.actualEndTime,
      accumulatedMinutes: 55,
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
    });

    await service.onExitRegistered(payload);

    expect(repository.createRequest).toHaveBeenCalledWith(
      payload.tenantId,
      expect.objectContaining({ accumulatedMinutes: 55 }),
    );
  });

  it('crea solicitud PENDIENTE_ADMIN con 31 min OVERTIME acumulados', async () => {
    repository.findOvertimeScopeLogsForPeriod.mockResolvedValue(overtimePair(31));
    repository.createRequest.mockResolvedValue({
      id: 'req-1',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date('2026-07-10T17:00:00.000Z'),
      actualEndTime: payload.actualEndTime,
      accumulatedMinutes: 31,
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
    });

    await service.onExitRegistered(payload);

    expect(repository.createRequest).toHaveBeenCalledWith(
      payload.tenantId,
      expect.objectContaining({
        accumulatedMinutes: 31,
        status: OvertimeStatus.PENDIENTE_ADMIN,
      }),
    );
    expect(notificationService.notifyLevelPending).toHaveBeenCalled();
  });

  it('skip cuando ya existe solicitud APROBADA en el período', async () => {
    repository.findActiveAutomaticByPeriod.mockResolvedValue({
      id: 'req-approved',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
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
    });

    await service.onExitRegistered(payload);

    expect(repository.findOvertimeScopeLogsForPeriod).not.toHaveBeenCalled();
  });

  it('skip cuando ya existe solicitud OBJETADA en el período', async () => {
    repository.findActiveAutomaticByPeriod.mockResolvedValue({
      id: 'req-old',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 40,
      status: OvertimeStatus.OBJETADA,
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
    });

    await service.onExitRegistered(payload);

    expect(repository.findOvertimeScopeLogsForPeriod).not.toHaveBeenCalled();
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it(`umbral interno es ${OVERTIME_ACCUMULATION_THRESHOLD_MINUTES} minutos`, () => {
    expect(OVERTIME_ACCUMULATION_THRESHOLD_MINUTES).toBe(30);
  });

  it('actualiza solicitud pendiente existente cuando acumulado OVERTIME supera umbral', async () => {
    repository.findActiveAutomaticByPeriod.mockResolvedValue({
      id: 'req-existing',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 35,
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
    });
    repository.findOvertimeScopeLogsForPeriod.mockResolvedValue(overtimePair(45));
    repository.updateRequest.mockResolvedValue({
      id: 'req-existing',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date(),
      actualEndTime: new Date(),
      accumulatedMinutes: 45,
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
    });

    await service.onExitRegistered(payload);

    expect(repository.updateRequest).toHaveBeenCalledWith(
      payload.tenantId,
      'req-existing',
      expect.objectContaining({ accumulatedMinutes: 45 }),
    );
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('continúa si la notificación inicial falla', async () => {
    repository.findOvertimeScopeLogsForPeriod.mockResolvedValue(overtimePair(31));
    repository.createRequest.mockResolvedValue({
      id: 'req-1',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date('2026-07-10T17:00:00.000Z'),
      actualEndTime: payload.actualEndTime,
      accumulatedMinutes: 31,
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
    });
    notificationService.notifyLevelPending.mockRejectedValue(new Error('smtp down'));

    await expect(service.onExitRegistered(payload)).resolves.toBeUndefined();
    expect(repository.createRequest).toHaveBeenCalled();
  });
});
