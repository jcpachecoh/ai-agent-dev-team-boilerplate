import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TurnoAssignmentType, TurnoJornada, TurnoTipo } from '@prisma/client';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import type { TurnoAssignmentRecord } from '../interfaces/turno-assignments.interfaces';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { TurnoAssignmentsService } from '../service/turno-assignments.service';

describe('TurnoAssignmentsService', () => {
  let service: TurnoAssignmentsService;
  let repository: jest.Mocked<TurnoAssignmentsRepository>;
  let userLocationsService: jest.Mocked<UserLocationsService>;

  const tenantId = 'tenant-1';
  const ownerActor = { userId: 'owner-1', roleCode: 'OWNER' };
  const supervisorActor = { userId: 'sup-1', roleCode: 'SUPERVISOR' };

  const activeTurno = {
    id: 'turno-1',
    locationId: 'loc-1',
    nombre: 'Turno mañana',
    sigla: 'TM',
    horaInicio: '06:00',
    horaFin: '14:00',
    jornada: TurnoJornada.DIURNO,
    tipo: TurnoTipo.PERMANENTE,
    daysOfWeek: [1, 2, 3, 4, 5],
    estado: true,
  };

  const employeeInScope = { id: 'emp-1', locationId: 'loc-1', isActive: true };

  function buildAssignmentRecord(
    overrides: Partial<TurnoAssignmentRecord> = {},
  ): TurnoAssignmentRecord {
    return {
      id: 'assignment-1',
      tenantId,
      turnoId: 'turno-1',
      employeeId: 'emp-1',
      workDate: new Date('2026-07-08T00:00:00.000Z'),
      type: TurnoAssignmentType.ASSIGNED,
      createdByUserId: 'owner-1',
      updatedByUserId: 'owner-1',
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      updatedAt: new Date('2026-07-01T00:00:00.000Z'),
      turno: {
        id: 'turno-1',
        nombre: 'Turno mañana',
        sigla: 'TM',
        horaInicio: '06:00',
        horaFin: '14:00',
        jornada: TurnoJornada.DIURNO,
      },
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnoAssignmentsService,
        {
          provide: TurnoAssignmentsRepository,
          useValue: {
            findActiveEmployeesPage: jest.fn(),
            findAssignmentsForEmployeesInRange: jest.fn(),
            findById: jest.fn(),
            findByEmployeeAndDate: jest.fn(),
            findEmployeeScope: jest.fn(),
            findTurnoScope: jest.fn(),
            upsertWithAudit: jest.fn(),
            deleteWithAudit: jest.fn(),
          },
        },
        {
          provide: UserLocationsService,
          useValue: {
            getActiveUserLocations: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TurnoAssignmentsService);
    repository = module.get(TurnoAssignmentsRepository);
    userLocationsService = module.get(UserLocationsService);

    repository.findActiveEmployeesPage.mockResolvedValue({
      employees: [
        {
          id: 'emp-1',
          userId: 'user-emp-1',
          nombre: 'Ana Pérez',
          documento: '123',
          locationId: 'loc-1',
        },
      ],
      total: 1,
    });
    repository.findAssignmentsForEmployeesInRange.mockResolvedValue([]);
  });

  describe('getWeekly', () => {
    it('devuelve celda BASE cuando no hay asignación para el día', async () => {
      const result = await service.getWeekly(tenantId, ownerActor, {
        weekStart: new Date('2026-07-08T00:00:00.000Z'),
      });

      const monday = result.weekStart;
      expect(result.dates).toHaveLength(7);
      expect(monday).toBe(result.dates[0]);
      const firstCell = result.colaboradores[0]?.turnos[0];
      expect(firstCell).toMatchObject({
        type: 'BASE',
        esDescanso: false,
        turnoBase: true,
        turno: null,
      });
      expect(firstCell?.assignmentId).toBeUndefined();
    });

    it('devuelve celda ASSIGNED cuando existe asignación con turno', async () => {
      repository.findAssignmentsForEmployeesInRange.mockResolvedValue([
        buildAssignmentRecord({ workDate: new Date('2026-07-06T00:00:00.000Z') }),
      ]);

      const result = await service.getWeekly(tenantId, ownerActor, {
        weekStart: new Date('2026-07-08T00:00:00.000Z'),
      });

      const cell = result.colaboradores[0]?.turnos.find((turno) => turno.fecha === '2026-07-06');
      expect(cell).toMatchObject({
        type: 'ASSIGNED',
        esDescanso: false,
        turnoBase: false,
        assignmentId: 'assignment-1',
      });
      expect(cell?.turno?.sigla).toBe('TM');
    });

    it('devuelve celda REST cuando hay descanso explícito', async () => {
      repository.findAssignmentsForEmployeesInRange.mockResolvedValue([
        buildAssignmentRecord({
          workDate: new Date('2026-07-06T00:00:00.000Z'),
          type: TurnoAssignmentType.REST,
          turnoId: null,
          turno: null,
        }),
      ]);

      const result = await service.getWeekly(tenantId, ownerActor, {
        weekStart: new Date('2026-07-08T00:00:00.000Z'),
      });

      const cell = result.colaboradores[0]?.turnos.find((turno) => turno.fecha === '2026-07-06');
      expect(cell).toMatchObject({ type: 'REST', esDescanso: true, turnoBase: false, turno: null });
    });

    it('normaliza weekStart al lunes de la semana', async () => {
      const result = await service.getWeekly(tenantId, ownerActor, {
        weekStart: new Date('2026-07-08T00:00:00.000Z'), // miércoles
      });

      expect(result.weekStart).toBe('2026-07-06'); // lunes de esa semana
      expect(result.dates).toEqual([
        '2026-07-06',
        '2026-07-07',
        '2026-07-08',
        '2026-07-09',
        '2026-07-10',
        '2026-07-11',
        '2026-07-12',
      ]);
    });

    it('resuelve sedes permitidas para SUPERVISOR y las pasa al repository', async () => {
      userLocationsService.getActiveUserLocations.mockResolvedValue([
        { id: 'loc-1' } as never,
        { id: 'loc-2' } as never,
      ]);

      await service.getWeekly(tenantId, supervisorActor, {
        weekStart: new Date('2026-07-08T00:00:00.000Z'),
      });

      expect(userLocationsService.getActiveUserLocations).toHaveBeenCalledWith(
        tenantId,
        supervisorActor.userId,
      );
      expect(repository.findActiveEmployeesPage).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ allowedLocationIds: ['loc-1', 'loc-2'] }),
      );
    });

    it('OWNER no queda restringido por sede', async () => {
      await service.getWeekly(tenantId, ownerActor, {
        weekStart: new Date('2026-07-08T00:00:00.000Z'),
      });

      expect(userLocationsService.getActiveUserLocations).not.toHaveBeenCalled();
      expect(repository.findActiveEmployeesPage).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ allowedLocationIds: null }),
      );
    });
  });

  describe('assign', () => {
    const futureDate = '2026-07-08';

    beforeEach(() => {
      repository.findEmployeeScope.mockResolvedValue(employeeInScope);
      repository.findTurnoScope.mockResolvedValue(activeTurno);
      repository.findByEmployeeAndDate.mockResolvedValue(null);
      repository.upsertWithAudit.mockResolvedValue(buildAssignmentRecord());
    });

    it('asigna un turno activo en happy path', async () => {
      const result = await service.assign(tenantId, ownerActor, {
        employeeId: 'emp-1',
        workDate: futureDate,
        turnoId: 'turno-1',
      });

      expect(repository.upsertWithAudit).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          employeeId: 'emp-1',
          turnoId: 'turno-1',
          type: TurnoAssignmentType.ASSIGNED,
        }),
        ownerActor.userId,
        expect.objectContaining({
          newValue: expect.objectContaining({ turnoId: 'turno-1' }),
        }),
      );
      expect(result.id).toBe('assignment-1');
    });

    it('rechaza turno inactivo', async () => {
      repository.findTurnoScope.mockResolvedValue({ ...activeTurno, estado: false });

      await expect(
        service.assign(tenantId, ownerActor, {
          employeeId: 'emp-1',
          workDate: futureDate,
          turnoId: 'turno-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza turno inexistente o de otro tenant', async () => {
      repository.findTurnoScope.mockResolvedValue(null);

      await expect(
        service.assign(tenantId, ownerActor, {
          employeeId: 'emp-1',
          workDate: futureDate,
          turnoId: 'turno-ajeno',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza empleado fuera del tenant', async () => {
      repository.findEmployeeScope.mockResolvedValue(null);

      await expect(
        service.assign(tenantId, ownerActor, {
          employeeId: 'emp-ajeno',
          workDate: futureDate,
          turnoId: 'turno-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza empleado inactivo', async () => {
      repository.findEmployeeScope.mockResolvedValue({ ...employeeInScope, isActive: false });

      await expect(
        service.assign(tenantId, ownerActor, {
          employeeId: 'emp-1',
          workDate: futureDate,
          turnoId: 'turno-1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza turnoId ausente cuando type es ASSIGNED', async () => {
      await expect(
        service.assign(tenantId, ownerActor, { employeeId: 'emp-1', workDate: futureDate }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza turnoId presente cuando type es REST', async () => {
      await expect(
        service.assign(tenantId, ownerActor, {
          employeeId: 'emp-1',
          workDate: futureDate,
          turnoId: 'turno-1',
          type: TurnoAssignmentType.REST,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('marca descanso explícito sin turnoId', async () => {
      repository.upsertWithAudit.mockResolvedValue(
        buildAssignmentRecord({ type: TurnoAssignmentType.REST, turnoId: null, turno: null }),
      );

      await service.assign(tenantId, ownerActor, {
        employeeId: 'emp-1',
        workDate: futureDate,
        type: TurnoAssignmentType.REST,
      });

      expect(repository.upsertWithAudit).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({ turnoId: null, type: TurnoAssignmentType.REST }),
        ownerActor.userId,
        expect.anything(),
      );
      expect(repository.findTurnoScope).not.toHaveBeenCalled();
    });

    it('supervisor no puede asignar fuera de su sede', async () => {
      userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-2' } as never]);

      await expect(
        service.assign(tenantId, supervisorActor, {
          employeeId: 'emp-1',
          workDate: futureDate,
          turnoId: 'turno-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('supervisor sí puede asignar dentro de su sede', async () => {
      userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-1' } as never]);

      await expect(
        service.assign(tenantId, supervisorActor, {
          employeeId: 'emp-1',
          workDate: futureDate,
          turnoId: 'turno-1',
        }),
      ).resolves.toBeDefined();
    });

    it('rechaza fecha pasada para roles distintos de OWNER/SUPER_ADMIN', async () => {
      await expect(
        service.assign(tenantId, supervisorActor, {
          employeeId: 'emp-1',
          workDate: '2020-01-01',
          turnoId: 'turno-1',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite fecha pasada para OWNER/SUPER_ADMIN', async () => {
      await expect(
        service.assign(tenantId, ownerActor, {
          employeeId: 'emp-1',
          workDate: '2020-01-01',
          turnoId: 'turno-1',
        }),
      ).resolves.toBeDefined();
    });

    it('construye oldValue/newValue con el turno anterior en una reasignación', async () => {
      repository.findByEmployeeAndDate.mockResolvedValue(
        buildAssignmentRecord({
          turnoId: 'turno-viejo',
          turno: { ...activeTurno, id: 'turno-viejo', sigla: 'TV' },
        }),
      );

      await service.assign(tenantId, ownerActor, {
        employeeId: 'emp-1',
        workDate: futureDate,
        turnoId: 'turno-1',
      });

      expect(repository.upsertWithAudit).toHaveBeenCalledWith(
        tenantId,
        expect.anything(),
        ownerActor.userId,
        {
          oldValue: expect.objectContaining({ turnoId: 'turno-viejo', turnoSigla: 'TV' }),
          newValue: expect.objectContaining({ turnoId: 'turno-1' }),
        },
      );
    });
  });

  describe('remove', () => {
    it('lanza 404 si la asignación no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(tenantId, ownerActor, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('elimina la asignación en happy path', async () => {
      repository.findById.mockResolvedValue(
        buildAssignmentRecord({ workDate: new Date('2026-07-08T00:00:00.000Z') }),
      );
      repository.findEmployeeScope.mockResolvedValue(employeeInScope);

      await service.remove(tenantId, ownerActor, 'assignment-1');

      expect(repository.deleteWithAudit).toHaveBeenCalledWith(
        tenantId,
        'assignment-1',
        ownerActor.userId,
        expect.objectContaining({
          oldValue: expect.objectContaining({ turnoId: 'turno-1' }),
        }),
      );
    });

    it('rechaza eliminar fuera de sede para supervisor', async () => {
      repository.findById.mockResolvedValue(
        buildAssignmentRecord({ workDate: new Date('2026-07-08T00:00:00.000Z') }),
      );
      repository.findEmployeeScope.mockResolvedValue(employeeInScope);
      userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-2' } as never]);

      await expect(service.remove(tenantId, supervisorActor, 'assignment-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rechaza eliminar una asignación de fecha pasada para roles no admin', async () => {
      repository.findById.mockResolvedValue(
        buildAssignmentRecord({ workDate: new Date('2020-01-01T00:00:00.000Z') }),
      );

      await expect(service.remove(tenantId, supervisorActor, 'assignment-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
