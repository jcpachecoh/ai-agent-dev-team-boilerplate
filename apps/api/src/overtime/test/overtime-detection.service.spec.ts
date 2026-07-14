import { Test, TestingModule } from '@nestjs/testing';
import { OvertimeRequestType, OvertimeStatus, TurnoJornada } from '@prisma/client';

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
    actualEndTime: new Date('2026-07-10T23:35:00.000Z'),
  };

  beforeEach(async () => {
    repository = {
      findActiveAutomaticByPeriod: jest.fn().mockResolvedValue(null),
      findExitLogsForPeriod: jest.fn(),
      createRequest: jest.fn(),
      updateRequest: jest.fn(),
      upsertApproval: jest.fn(),
    } as unknown as jest.Mocked<OvertimeRepository>;

    shiftResolution = {
      resolveForDay: jest.fn(),
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

  it('no crea solicitud con 30 min acumulados exactos', async () => {
    repository.findExitLogsForPeriod.mockResolvedValue([
      {
        id: 'log-1',
        workDate: payload.workDate,
        timestamp: new Date('2026-07-10T23:30:00.000Z'),
      },
    ]);
    shiftResolution.resolveForDay.mockResolvedValue({
      kind: 'ASSIGNED',
      source: 'CALENDAR',
      turno: {
        id: 'turno-1',
        nombre: 'Tarde',
        sigla: 'T',
        horaInicio: '14:00',
        horaFin: '23:00',
        jornada: TurnoJornada.DIURNO,
        locationId: 'loc-1',
        daysOfWeek: [4],
      },
      targetMinutes: 540,
    });

    await service.onExitRegistered(payload);

    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('crea solicitud PENDIENTE_ADMIN con 31 min acumulados', async () => {
    repository.findExitLogsForPeriod.mockResolvedValue([
      {
        id: 'log-1',
        workDate: payload.workDate,
        timestamp: new Date('2026-07-10T23:31:00.000Z'),
      },
    ]);
    shiftResolution.resolveForDay.mockResolvedValue({
      kind: 'ASSIGNED',
      source: 'CALENDAR',
      turno: {
        id: 'turno-1',
        nombre: 'Tarde',
        sigla: 'T',
        horaInicio: '14:00',
        horaFin: '23:00',
        jornada: TurnoJornada.DIURNO,
        locationId: 'loc-1',
        daysOfWeek: [4],
      },
      targetMinutes: 540,
    });
    repository.createRequest.mockResolvedValue({
      id: 'req-1',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date('2026-07-10T23:00:00.000Z'),
      actualEndTime: payload.actualEndTime,
      accumulatedMinutes: 31,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await service.onExitRegistered(payload);

    expect(repository.findExitLogsForPeriod).not.toHaveBeenCalled();
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await service.onExitRegistered(payload);

    expect(repository.findExitLogsForPeriod).not.toHaveBeenCalled();
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it(`umbral interno es ${OVERTIME_ACCUMULATION_THRESHOLD_MINUTES} minutos`, () => {
    expect(OVERTIME_ACCUMULATION_THRESHOLD_MINUTES).toBe(30);
  });

  it('actualiza solicitud pendiente existente cuando acumulado supera umbral', async () => {
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    repository.findExitLogsForPeriod.mockResolvedValue([
      {
        id: 'log-1',
        workDate: payload.workDate,
        timestamp: new Date('2026-07-10T23:45:00.000Z'),
      },
    ]);
    shiftResolution.resolveForDay.mockResolvedValue({
      kind: 'ASSIGNED',
      source: 'CALENDAR',
      turno: {
        id: 'turno-1',
        nombre: 'Tarde',
        sigla: 'T',
        horaInicio: '14:00',
        horaFin: '23:00',
        jornada: TurnoJornada.DIURNO,
        locationId: 'loc-1',
        daysOfWeek: [4],
      },
      targetMinutes: 540,
    });
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await service.onExitRegistered(payload);

    expect(repository.updateRequest).toHaveBeenCalled();
    expect(repository.createRequest).not.toHaveBeenCalled();
  });

  it('continúa si la notificación inicial falla', async () => {
    repository.findExitLogsForPeriod.mockResolvedValue([
      {
        id: 'log-1',
        workDate: payload.workDate,
        timestamp: new Date('2026-07-10T23:31:00.000Z'),
      },
    ]);
    shiftResolution.resolveForDay.mockResolvedValue({
      kind: 'ASSIGNED',
      source: 'CALENDAR',
      turno: {
        id: 'turno-1',
        nombre: 'Tarde',
        sigla: 'T',
        horaInicio: '14:00',
        horaFin: '23:00',
        jornada: TurnoJornada.DIURNO,
        locationId: 'loc-1',
        daysOfWeek: [4],
      },
      targetMinutes: 540,
    });
    repository.createRequest.mockResolvedValue({
      id: 'req-1',
      tenantId: payload.tenantId,
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      type: OvertimeRequestType.DETECCION_AUTOMATICA,
      shiftEndTime: new Date('2026-07-10T23:00:00.000Z'),
      actualEndTime: payload.actualEndTime,
      accumulatedMinutes: 31,
      status: OvertimeStatus.PENDIENTE_ADMIN,
      payrollPeriod: '2026-07',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    notificationService.notifyLevelPending.mockRejectedValue(new Error('smtp down'));

    await expect(service.onExitRegistered(payload)).resolves.toBeUndefined();
    expect(repository.createRequest).toHaveBeenCalled();
  });
});
