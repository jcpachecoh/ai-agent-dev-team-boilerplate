import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentSource, TurnoAssignmentType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { DailyCostCenterRepository } from '../repository/daily-cost-center.repository';

const TENANT = 'tenant-1';
const EMPLOYEE = 'emp-rotante-1';

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'assignment-1',
    tenantId: TENANT,
    employeeId: EMPLOYEE,
    date: new Date('2026-07-01'),
    locationId: 'loc-a',
    shiftId: null,
    source: AssignmentSource.MARCACION_ASISTENCIA,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('DailyCostCenterRepository', () => {
  let repository: DailyCostCenterRepository;
  let prisma: {
    dailyCostCenterAssignment: Record<string, jest.Mock>;
    turnoAssignment: Record<string, jest.Mock>;
  };

  beforeEach(async () => {
    prisma = {
      dailyCostCenterAssignment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      turnoAssignment: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DailyCostCenterRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(DailyCostCenterRepository);
  });

  describe('upsertForDay', () => {
    it('crea la fila cuando no existe asignación previa', async () => {
      prisma.dailyCostCenterAssignment.findUnique.mockResolvedValue(null);
      prisma.dailyCostCenterAssignment.create.mockResolvedValue(row());

      const result = await repository.upsertForDay({
        tenantId: TENANT,
        employeeId: EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-a',
        source: AssignmentSource.MARCACION_ASISTENCIA,
      });

      expect(prisma.dailyCostCenterAssignment.create).toHaveBeenCalled();
      expect(result.source).toBe(AssignmentSource.MARCACION_ASISTENCIA);
    });

    it('no sobrescribe una asignación MANUAL con una fuente automática (D2)', async () => {
      prisma.dailyCostCenterAssignment.findUnique.mockResolvedValue(
        row({ source: AssignmentSource.MANUAL, locationId: 'loc-manual' }),
      );

      const result = await repository.upsertForDay({
        tenantId: TENANT,
        employeeId: EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-b',
        source: AssignmentSource.TURNO_ASIGNADO,
      });

      expect(prisma.dailyCostCenterAssignment.update).not.toHaveBeenCalled();
      expect(result.locationId).toBe('loc-manual');
    });

    it('CONN-12: no permite que un turno haga downgrade de una marcación existente', async () => {
      prisma.dailyCostCenterAssignment.findUnique.mockResolvedValue(
        row({ source: AssignmentSource.MARCACION_ASISTENCIA, locationId: 'loc-marcacion' }),
      );

      const result = await repository.upsertForDay({
        tenantId: TENANT,
        employeeId: EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-turno',
        shiftId: 'shift-1',
        source: AssignmentSource.TURNO_ASIGNADO,
      });

      expect(prisma.dailyCostCenterAssignment.update).not.toHaveBeenCalled();
      expect(result.locationId).toBe('loc-marcacion');
      expect(result.source).toBe(AssignmentSource.MARCACION_ASISTENCIA);
    });

    it('CONN-12: marcación real prevalece sobre turno planificado (sede distinta)', async () => {
      prisma.dailyCostCenterAssignment.findUnique.mockResolvedValue(
        row({ source: AssignmentSource.TURNO_ASIGNADO, locationId: 'loc-turno' }),
      );
      prisma.dailyCostCenterAssignment.update.mockResolvedValue(
        row({
          source: AssignmentSource.MARCACION_ASISTENCIA,
          locationId: 'loc-marcacion',
          shiftId: null,
        }),
      );

      const result = await repository.upsertForDay({
        tenantId: TENANT,
        employeeId: EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-marcacion',
        source: AssignmentSource.MARCACION_ASISTENCIA,
      });

      expect(prisma.dailyCostCenterAssignment.update).toHaveBeenCalled();
      expect(result.locationId).toBe('loc-marcacion');
      expect(result.source).toBe(AssignmentSource.MARCACION_ASISTENCIA);
    });

    it('actualiza el turno del día cuando cambia de sede el mismo día (D7)', async () => {
      prisma.dailyCostCenterAssignment.findUnique.mockResolvedValue(
        row({ source: AssignmentSource.TURNO_ASIGNADO, locationId: 'loc-a', shiftId: 'shift-1' }),
      );
      prisma.dailyCostCenterAssignment.update.mockResolvedValue(
        row({ source: AssignmentSource.TURNO_ASIGNADO, locationId: 'loc-b', shiftId: 'shift-2' }),
      );

      const result = await repository.upsertForDay({
        tenantId: TENANT,
        employeeId: EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-b',
        shiftId: 'shift-2',
        source: AssignmentSource.TURNO_ASIGNADO,
      });

      expect(prisma.dailyCostCenterAssignment.update).toHaveBeenCalled();
      expect(result.locationId).toBe('loc-b');
    });
  });

  describe('findByEmployeeAndDateRange', () => {
    it('filtra siempre por tenantId y employeeId', async () => {
      prisma.dailyCostCenterAssignment.findMany.mockResolvedValue([row()]);

      await repository.findByEmployeeAndDateRange(
        TENANT,
        EMPLOYEE,
        new Date('2026-07-01'),
        new Date('2026-07-31'),
      );

      expect(prisma.dailyCostCenterAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT, employeeId: EMPLOYEE }),
        }),
      );
    });
  });

  describe('findPendingDays', () => {
    it('retorna días con turno ASSIGNED sin fila de asignación', async () => {
      prisma.turnoAssignment.findMany.mockResolvedValue([
        { workDate: new Date('2026-07-01') },
        { workDate: new Date('2026-07-02') },
      ]);
      prisma.dailyCostCenterAssignment.findMany.mockResolvedValue([
        { date: new Date('2026-07-01') },
      ]);

      const pending = await repository.findPendingDays(
        TENANT,
        EMPLOYEE,
        new Date('2026-07-01'),
        new Date('2026-07-02'),
      );

      expect(prisma.turnoAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            employeeId: EMPLOYEE,
            type: TurnoAssignmentType.ASSIGNED,
          }),
        }),
      );
      expect(pending).toEqual([{ employeeId: EMPLOYEE, date: new Date('2026-07-02') }]);
    });
  });

  describe('deleteManual', () => {
    it('elimina solo si la fuente es MANUAL', async () => {
      prisma.dailyCostCenterAssignment.findFirst.mockResolvedValue(
        row({ source: AssignmentSource.MANUAL }),
      );
      prisma.dailyCostCenterAssignment.delete.mockResolvedValue(
        row({ source: AssignmentSource.MANUAL }),
      );

      const result = await repository.deleteManual(TENANT, 'assignment-1');

      expect(prisma.dailyCostCenterAssignment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ source: AssignmentSource.MANUAL }),
        }),
      );
      expect(result).not.toBeNull();
    });

    it('retorna null si la fila no existe o no es MANUAL', async () => {
      prisma.dailyCostCenterAssignment.findFirst.mockResolvedValue(null);

      const result = await repository.deleteManual(TENANT, 'assignment-1');

      expect(prisma.dailyCostCenterAssignment.delete).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
