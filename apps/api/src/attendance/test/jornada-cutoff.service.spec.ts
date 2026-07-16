import { Test, TestingModule } from '@nestjs/testing';
import { TurnoJornada } from '@prisma/client';

import { ShiftResolutionService } from '../../turnos/service/shift-resolution.service';
import type { CutoffCandidate } from '../interfaces/jornada-cutoff.interfaces';
import { JornadaCutoffRepository } from '../repository/jornada-cutoff.repository';
import { JornadaCutoffService } from '../service/jornada-cutoff.service';

describe('JornadaCutoffService', () => {
  let service: JornadaCutoffService;

  const repositoryMock = {
    findByEmployeeAndWorkDate: jest.fn(),
    create: jest.fn(),
    findOpenOrdinaryEntries: jest.fn(),
    createSystemExitLog: jest.fn(),
  };

  const shiftResolutionMock = {
    resolveForDay: jest.fn(),
  };

  const tenantId = 'tenant-1';
  const employeeId = 'emp-1';
  const locationId = 'loc-1';
  const workDate = new Date('2026-07-10T00:00:00.000Z');
  const shiftEndTime = new Date('2026-07-10T17:00:00.000Z');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JornadaCutoffService,
        { provide: JornadaCutoffRepository, useValue: repositoryMock },
        { provide: ShiftResolutionService, useValue: shiftResolutionMock },
      ],
    }).compile();

    service = module.get(JornadaCutoffService);
  });

  describe('isBeforeCutoff', () => {
    it('retorna true cuando no existe corte', async () => {
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);
      await expect(service.isBeforeCutoff(tenantId, employeeId, workDate)).resolves.toBe(true);
    });

    it('retorna false cuando ya existe corte', async () => {
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue({ id: 'cutoff-1' });
      await expect(service.isBeforeCutoff(tenantId, employeeId, workDate)).resolves.toBe(false);
    });
  });

  describe('executeCutoffIfDue', () => {
    const candidate: CutoffCandidate = {
      tenantId,
      employeeId,
      locationId,
      workDate,
      entryLogId: 'entry-1',
      shiftEndTime,
    };

    it('crea EXIT SYSTEM y JornadaCutoff cuando hay ENTRY abierta', async () => {
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);
      repositoryMock.findOpenOrdinaryEntries.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId,
          employeeId,
          locationId,
          workDate,
          timestamp: new Date('2026-07-10T08:00:00.000Z'),
          shift: 'MORNING',
        },
      ]);
      repositoryMock.createSystemExitLog.mockResolvedValue({ id: 'exit-system-1' });
      repositoryMock.create.mockResolvedValue({ id: 'cutoff-1' });

      const asOf = new Date('2026-07-10T17:05:00.000Z');
      const result = await service.executeCutoffIfDue(candidate, asOf);

      expect(result).toEqual({ id: 'cutoff-1' });
      expect(repositoryMock.createSystemExitLog).toHaveBeenCalled();
      expect(repositoryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entryLogId: 'entry-1',
          exitLogId: 'exit-system-1',
        }),
      );
    });

    it('es idempotente si ya existe corte', async () => {
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue({ id: 'cutoff-existing' });

      const result = await service.executeCutoffIfDue(
        candidate,
        new Date('2026-07-10T17:05:00.000Z'),
      );

      expect(result).toBeNull();
      expect(repositoryMock.createSystemExitLog).not.toHaveBeenCalled();
    });

    it('no ejecuta corte antes de shiftEndTime', async () => {
      const result = await service.executeCutoffIfDue(
        candidate,
        new Date('2026-07-10T16:30:00.000Z'),
      );
      expect(result).toBeNull();
      expect(repositoryMock.create).not.toHaveBeenCalled();
    });
  });

  describe('findDueCutoffCandidates', () => {
    it('excluye empleados sin turno ASSIGNED', async () => {
      repositoryMock.findOpenOrdinaryEntries.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId,
          employeeId,
          locationId,
          workDate,
          timestamp: new Date('2026-07-10T08:00:00.000Z'),
          shift: 'MORNING',
        },
      ]);
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);
      shiftResolutionMock.resolveForDay.mockResolvedValue({ kind: 'REST', targetMinutes: 0 });

      const candidates = await service.findDueCutoffCandidates(
        tenantId,
        new Date('2026-07-10T18:00:00.000Z'),
      );

      expect(candidates).toHaveLength(0);
    });

    it('incluye candidato cuando turno ASSIGNED y shiftEnd ya pasó', async () => {
      repositoryMock.findOpenOrdinaryEntries.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId,
          employeeId,
          locationId,
          workDate,
          timestamp: new Date('2026-07-10T08:00:00.000Z'),
          shift: 'MORNING',
        },
      ]);
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);
      shiftResolutionMock.resolveForDay.mockResolvedValue({
        kind: 'ASSIGNED',
        source: 'CALENDAR',
        targetMinutes: 540,
        turno: {
          id: 'turno-1',
          nombre: 'Admin',
          sigla: 'A',
          horaInicio: '08:00',
          horaFin: '17:00',
          jornada: TurnoJornada.DIURNO,
          locationId,
          daysOfWeek: [4],
        },
      });

      const candidates = await service.findDueCutoffCandidates(
        tenantId,
        new Date('2026-07-10T17:05:00.000Z'),
      );

      expect(candidates).toHaveLength(1);
      expect(candidates[0]).toEqual(
        expect.objectContaining({
          employeeId,
          entryLogId: 'entry-1',
        }),
      );
    });
  });

  describe('runDueCutoffsForTenant', () => {
    it('procesa candidatos y retorna cantidad de cortes ejecutados', async () => {
      repositoryMock.findOpenOrdinaryEntries.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId,
          employeeId,
          locationId,
          workDate,
          timestamp: new Date('2026-07-10T08:00:00.000Z'),
          shift: 'MORNING',
        },
      ]);
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);
      shiftResolutionMock.resolveForDay.mockResolvedValue({
        kind: 'ASSIGNED',
        source: 'CALENDAR',
        targetMinutes: 540,
        turno: {
          id: 'turno-1',
          nombre: 'Admin',
          sigla: 'A',
          horaInicio: '08:00',
          horaFin: '17:00',
          jornada: TurnoJornada.DIURNO,
          locationId,
          daysOfWeek: [4],
        },
      });
      repositoryMock.createSystemExitLog.mockResolvedValue({ id: 'exit-system-1' });
      repositoryMock.create.mockResolvedValue({ id: 'cutoff-1' });

      const processed = await service.runDueCutoffsForTenant(
        tenantId,
        new Date('2026-07-10T17:05:00.000Z'),
      );

      expect(processed).toBe(1);
    });

    it('continúa cuando un candidato falla', async () => {
      repositoryMock.findOpenOrdinaryEntries.mockResolvedValue([
        {
          id: 'entry-1',
          tenantId,
          employeeId,
          locationId,
          workDate,
          timestamp: new Date('2026-07-10T08:00:00.000Z'),
          shift: 'MORNING',
        },
      ]);
      repositoryMock.findByEmployeeAndWorkDate.mockResolvedValue(null);
      shiftResolutionMock.resolveForDay.mockResolvedValue({
        kind: 'ASSIGNED',
        source: 'CALENDAR',
        targetMinutes: 540,
        turno: {
          id: 'turno-1',
          nombre: 'Admin',
          sigla: 'A',
          horaInicio: '08:00',
          horaFin: '17:00',
          jornada: TurnoJornada.DIURNO,
          locationId,
          daysOfWeek: [4],
        },
      });
      repositoryMock.createSystemExitLog.mockResolvedValue({ id: 'exit-system-1' });
      repositoryMock.create.mockRejectedValue(new Error('db error'));

      const processed = await service.runDueCutoffsForTenant(
        tenantId,
        new Date('2026-07-10T17:05:00.000Z'),
      );

      expect(processed).toBe(0);
    });
  });
});
