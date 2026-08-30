import { Test, TestingModule } from '@nestjs/testing';
import { TurnoAssignmentType, TurnoJornada } from '@prisma/client';

import { EmployeeShiftAssignmentsRepository } from '../repository/employee-shift-assignments.repository';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { ShiftResolutionService } from '../service/shift-resolution.service';

describe('ShiftResolutionService', () => {
  let service: ShiftResolutionService;
  let turnoAssignmentsRepository: jest.Mocked<TurnoAssignmentsRepository>;
  let employeeShiftAssignmentsRepository: jest.Mocked<EmployeeShiftAssignmentsRepository>;

  const tenantId = 'tenant-1';
  const employeeId = 'emp-1';
  const locationId = 'loc-1';
  const workDate = new Date('2026-07-06T00:00:00.000Z');

  const baseTurno = {
    id: 'turno-1',
    nombre: 'Turno mañana',
    sigla: 'TM',
    horaInicio: '06:00',
    horaFin: '14:00',
    jornada: TurnoJornada.DIURNO,
    locationId,
    daysOfWeek: [1, 2, 3, 4, 5],
    estado: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftResolutionService,
        {
          provide: TurnoAssignmentsRepository,
          useValue: {
            findByEmployeeAndDate: jest.fn(),
          },
        },
        {
          provide: EmployeeShiftAssignmentsRepository,
          useValue: {
            findEffectiveOnDate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ShiftResolutionService);
    turnoAssignmentsRepository = module.get(TurnoAssignmentsRepository);
    employeeShiftAssignmentsRepository = module.get(EmployeeShiftAssignmentsRepository);
  });

  it('prioriza calendario ASSIGNED sobre asignación vigente', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'cal-1',
      tenantId,
      turnoId: baseTurno.id,
      employeeId,
      workDate,
      type: TurnoAssignmentType.ASSIGNED,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: baseTurno,
    });

    const result = await service.resolveForDay({ tenantId, employeeId, locationId, workDate });

    expect(result.kind).toBe('ASSIGNED');
    if (result.kind === 'ASSIGNED') {
      expect(result.source).toBe('CALENDAR');
      expect(result.targetMinutes).toBe(480);
    }
    expect(employeeShiftAssignmentsRepository.findEffectiveOnDate).not.toHaveBeenCalled();
  });

  it('devuelve REST cuando el calendario marca descanso', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'cal-rest',
      tenantId,
      turnoId: null,
      employeeId,
      workDate,
      type: TurnoAssignmentType.REST,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: null,
    });

    const result = await service.resolveForDay({ tenantId, employeeId, locationId, workDate });

    expect(result).toEqual({ kind: 'REST', targetMinutes: 0 });
  });

  it('usa asignación vigente cuando no hay calendario', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue(null);
    employeeShiftAssignmentsRepository.findEffectiveOnDate.mockResolvedValue({
      id: 'esa-1',
      tenantId,
      employeeId,
      turnoId: baseTurno.id,
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: baseTurno,
    });

    const result = await service.resolveForDay({ tenantId, employeeId, locationId, workDate });

    expect(result.kind).toBe('ASSIGNED');
    if (result.kind === 'ASSIGNED') {
      expect(result.source).toBe('EMPLOYEE_ASSIGNMENT');
      expect(result.targetMinutes).toBe(480);
    }
  });

  it('devuelve NONE si el día no está en daysOfWeek', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue(null);
    employeeShiftAssignmentsRepository.findEffectiveOnDate.mockResolvedValue({
      id: 'esa-1',
      tenantId,
      employeeId,
      turnoId: baseTurno.id,
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: { ...baseTurno, daysOfWeek: [0, 6] },
    });

    const result = await service.resolveForDay({ tenantId, employeeId, locationId, workDate });

    expect(result).toEqual({ kind: 'NONE', targetMinutes: 0 });
  });

  it('devuelve NONE si el turno vigente está inactivo', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue(null);
    employeeShiftAssignmentsRepository.findEffectiveOnDate.mockResolvedValue({
      id: 'esa-1',
      tenantId,
      employeeId,
      turnoId: baseTurno.id,
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: { ...baseTurno, estado: false },
    });

    const result = await service.resolveForDay({ tenantId, employeeId, locationId, workDate });

    expect(result).toEqual({ kind: 'NONE', targetMinutes: 0 });
  });

  it('devuelve NONE si la sede del turno no coincide', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue(null);
    employeeShiftAssignmentsRepository.findEffectiveOnDate.mockResolvedValue({
      id: 'esa-1',
      tenantId,
      employeeId,
      turnoId: baseTurno.id,
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: { ...baseTurno, locationId: 'loc-2' },
    });

    const result = await service.resolveForDay({ tenantId, employeeId, locationId, workDate });

    expect(result).toEqual({ kind: 'NONE', targetMinutes: 0 });
  });

  it('usa locationId y daysOfWeek por defecto en calendario', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'cal-1',
      tenantId,
      turnoId: baseTurno.id,
      employeeId,
      workDate,
      type: TurnoAssignmentType.ASSIGNED,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: {
        ...baseTurno,
        locationId: null as unknown as string,
        daysOfWeek: null as unknown as number[],
      },
    });

    const result = await service.resolveForDay({ tenantId, employeeId, locationId, workDate });

    expect(result.kind).toBe('ASSIGNED');
    if (result.kind === 'ASSIGNED') {
      expect(result.turno.locationId).toBe(locationId);
      expect(result.turno.daysOfWeek).toEqual([]);
    }
  });

  it('getTargetMinutesForDay delega en resolveForDay', async () => {
    turnoAssignmentsRepository.findByEmployeeAndDate.mockResolvedValue({
      id: 'cal-rest',
      tenantId,
      turnoId: null,
      employeeId,
      workDate,
      type: TurnoAssignmentType.REST,
      createdByUserId: null,
      updatedByUserId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      turno: null,
    });

    await expect(
      service.getTargetMinutesForDay({ tenantId, employeeId, locationId, workDate }),
    ).resolves.toBe(0);
  });
});
