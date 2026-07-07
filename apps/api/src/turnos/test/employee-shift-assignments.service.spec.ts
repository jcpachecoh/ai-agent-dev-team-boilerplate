import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TurnoJornada, TurnoTipo } from '@prisma/client';

import { UserLocationsService } from '../../locations/service/user-locations.service';
import type { EmployeeShiftAssignmentRecord } from '../interfaces/employee-shift-assignment.interfaces';
import { EmployeeShiftAssignmentsRepository } from '../repository/employee-shift-assignments.repository';
import { TurnoAssignmentsRepository } from '../repository/turno-assignments.repository';
import { EmployeeShiftAssignmentsService } from '../service/employee-shift-assignments.service';

describe('EmployeeShiftAssignmentsService', () => {
  let service: EmployeeShiftAssignmentsService;
  let repository: jest.Mocked<EmployeeShiftAssignmentsRepository>;
  let turnoAssignmentsRepository: jest.Mocked<TurnoAssignmentsRepository>;
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

  function buildRecord(
    overrides: Partial<EmployeeShiftAssignmentRecord> = {},
  ): EmployeeShiftAssignmentRecord {
    return {
      id: 'esa-1',
      tenantId,
      employeeId: 'emp-1',
      turnoId: 'turno-1',
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveTo: null,
      createdByUserId: ownerActor.userId,
      updatedByUserId: ownerActor.userId,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      turno: activeTurno,
      ...overrides,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeShiftAssignmentsService,
        {
          provide: EmployeeShiftAssignmentsRepository,
          useValue: {
            findByEmployee: jest.fn(),
            findById: jest.fn(),
            findOpenByEmployee: jest.fn(),
            hasOverlappingAssignment: jest.fn(),
            createWithAudit: jest.fn(),
            updateWithAudit: jest.fn(),
          },
        },
        {
          provide: TurnoAssignmentsRepository,
          useValue: {
            findEmployeeScope: jest.fn(),
            findTurnoScope: jest.fn(),
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

    service = module.get(EmployeeShiftAssignmentsService);
    repository = module.get(EmployeeShiftAssignmentsRepository);
    turnoAssignmentsRepository = module.get(TurnoAssignmentsRepository);
    userLocationsService = module.get(UserLocationsService);

    turnoAssignmentsRepository.findEmployeeScope.mockResolvedValue(employeeInScope);
    turnoAssignmentsRepository.findTurnoScope.mockResolvedValue(activeTurno);
    repository.findOpenByEmployee.mockResolvedValue(null);
    repository.hasOverlappingAssignment.mockResolvedValue(false);
    userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-1' } as never]);
  });

  describe('listByEmployee', () => {
    it('retorna asignaciones del colaborador', async () => {
      const records = [buildRecord()];
      repository.findByEmployee.mockResolvedValue(records);

      await expect(service.listByEmployee(tenantId, ownerActor, 'emp-1')).resolves.toEqual(records);
    });

    it('lanza NotFoundException si el colaborador no existe', async () => {
      turnoAssignmentsRepository.findEmployeeScope.mockResolvedValue(null);

      await expect(service.listByEmployee(tenantId, ownerActor, 'emp-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('crea asignación sin cierre previo', async () => {
      const created = buildRecord({ id: 'esa-new' });
      repository.createWithAudit.mockResolvedValue(created);

      const result = await service.create(tenantId, ownerActor, 'emp-1', {
        turnoId: 'turno-1',
        effectiveFrom: '2026-08-01',
      });

      expect(result).toEqual(created);
      expect(repository.createWithAudit).toHaveBeenCalledWith(
        tenantId,
        'emp-1',
        expect.objectContaining({ turnoId: 'turno-1' }),
        ownerActor.userId,
        expect.any(Object),
        null,
        null,
      );
    });

    it('cierra asignación abierta previa', async () => {
      repository.findOpenByEmployee.mockResolvedValue(
        buildRecord({ effectiveFrom: new Date('2026-07-01T00:00:00.000Z') }),
      );
      repository.createWithAudit.mockResolvedValue(buildRecord({ id: 'esa-new' }));

      await service.create(tenantId, ownerActor, 'emp-1', {
        turnoId: 'turno-1',
        effectiveFrom: '2026-08-01',
      });

      expect(repository.createWithAudit).toHaveBeenCalledWith(
        tenantId,
        'emp-1',
        expect.any(Object),
        ownerActor.userId,
        expect.any(Object),
        'esa-1',
        new Date('2026-07-31T00:00:00.000Z'),
      );
    });

    it('rechaza turno inexistente', async () => {
      turnoAssignmentsRepository.findTurnoScope.mockResolvedValue(null);

      await expect(
        service.create(tenantId, ownerActor, 'emp-1', {
          turnoId: 'missing',
          effectiveFrom: '2026-08-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza turno inactivo', async () => {
      turnoAssignmentsRepository.findTurnoScope.mockResolvedValue({
        ...activeTurno,
        estado: false,
      });

      await expect(
        service.create(tenantId, ownerActor, 'emp-1', {
          turnoId: 'turno-1',
          effectiveFrom: '2026-08-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza colaborador inactivo', async () => {
      turnoAssignmentsRepository.findEmployeeScope.mockResolvedValue({
        ...employeeInScope,
        isActive: false,
      });

      await expect(
        service.create(tenantId, ownerActor, 'emp-1', {
          turnoId: 'turno-1',
          effectiveFrom: '2026-08-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza effectiveFrom anterior o igual a la vigencia abierta', async () => {
      repository.findOpenByEmployee.mockResolvedValue(
        buildRecord({ effectiveFrom: new Date('2026-08-01T00:00:00.000Z') }),
      );

      await expect(
        service.create(tenantId, ownerActor, 'emp-1', {
          turnoId: 'turno-1',
          effectiveFrom: '2026-08-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza solapamiento de vigencias', async () => {
      repository.hasOverlappingAssignment.mockResolvedValue(true);

      await expect(
        service.create(tenantId, ownerActor, 'emp-1', {
          turnoId: 'turno-1',
          effectiveFrom: '2026-08-01',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza supervisor fuera de sede', async () => {
      userLocationsService.getActiveUserLocations.mockResolvedValue([{ id: 'loc-2' } as never]);

      await expect(
        service.create(tenantId, supervisorActor, 'emp-1', {
          turnoId: 'turno-1',
          effectiveFrom: '2026-08-01',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('patch', () => {
    it('actualiza vigencia y turno', async () => {
      const current = buildRecord();
      const updated = buildRecord({ turnoId: 'turno-2' });
      repository.findById.mockResolvedValue(current);
      repository.updateWithAudit.mockResolvedValue(updated);

      const result = await service.patch(tenantId, ownerActor, 'emp-1', 'esa-1', {
        turnoId: 'turno-2',
        effectiveTo: '2026-12-31',
      });

      expect(result).toEqual(updated);
      expect(repository.updateWithAudit).toHaveBeenCalled();
    });

    it('lanza NotFoundException si la asignación no existe', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.patch(tenantId, ownerActor, 'emp-1', 'missing', { effectiveTo: '2026-12-31' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza effectiveTo anterior a effectiveFrom', async () => {
      repository.findById.mockResolvedValue(
        buildRecord({ effectiveFrom: new Date('2026-08-01T00:00:00.000Z') }),
      );

      await expect(
        service.patch(tenantId, ownerActor, 'emp-1', 'esa-1', { effectiveTo: '2026-07-01' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza turno inexistente al cambiar turnoId', async () => {
      repository.findById.mockResolvedValue(buildRecord());
      turnoAssignmentsRepository.findTurnoScope.mockResolvedValue(null);

      await expect(
        service.patch(tenantId, ownerActor, 'emp-1', 'esa-1', { turnoId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza solapamiento al actualizar vigencia', async () => {
      repository.findById.mockResolvedValue(buildRecord());
      repository.hasOverlappingAssignment.mockResolvedValue(true);

      await expect(
        service.patch(tenantId, ownerActor, 'emp-1', 'esa-1', { effectiveTo: '2026-12-31' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
