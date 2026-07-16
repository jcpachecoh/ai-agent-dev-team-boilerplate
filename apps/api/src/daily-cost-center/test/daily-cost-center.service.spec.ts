import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentSource, CostCenter } from '@prisma/client';

import { DailyCostCenterRepository } from '../repository/daily-cost-center.repository';
import { DailyCostCenterService } from '../service/daily-cost-center.service';

const TENANT = 'tenant-1';
const ROTANTE_EMPLOYEE = 'emp-rotante';
const FIXED_EMPLOYEE = 'emp-operaciones';

describe('DailyCostCenterService', () => {
  let service: DailyCostCenterService;
  let repository: jest.Mocked<DailyCostCenterRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyCostCenterService,
        {
          provide: DailyCostCenterRepository,
          useValue: {
            upsertForDay: jest.fn(),
            findByEmployeeAndDateRange: jest.fn(),
            findByTenantAndDateRange: jest.fn(),
            findPendingDays: jest.fn(),
            deleteManual: jest.fn(),
            findEmployeeCostCenter: jest.fn(),
            findRotanteEmployees: jest.fn(),
            findActiveLocationInTenant: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DailyCostCenterService);
    repository = module.get(DailyCostCenterRepository);
  });

  describe('resolveFromShift', () => {
    it('crea la asignación TURNO_ASIGNADO cuando el empleado es ROTANTE', async () => {
      repository.findEmployeeCostCenter.mockResolvedValue(CostCenter.ROTANTE);
      repository.upsertForDay.mockResolvedValue({
        id: 'a1',
        tenantId: TENANT,
        employeeId: ROTANTE_EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-a',
        shiftId: 'shift-1',
        source: AssignmentSource.TURNO_ASIGNADO,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.resolveFromShift({
        tenantId: TENANT,
        employeeId: ROTANTE_EMPLOYEE,
        workDate: new Date('2026-07-01'),
        locationId: 'loc-a',
        shiftId: 'shift-1',
      });

      expect(repository.upsertForDay).toHaveBeenCalledWith(
        expect.objectContaining({ source: AssignmentSource.TURNO_ASIGNADO }),
      );
      expect(result?.source).toBe(AssignmentSource.TURNO_ASIGNADO);
    });

    it('skip silencioso cuando el empleado no es ROTANTE', async () => {
      repository.findEmployeeCostCenter.mockResolvedValue(CostCenter.OPERACIONES);

      const result = await service.resolveFromShift({
        tenantId: TENANT,
        employeeId: FIXED_EMPLOYEE,
        workDate: new Date('2026-07-01'),
        locationId: 'loc-a',
        shiftId: 'shift-1',
      });

      expect(repository.upsertForDay).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('resolveFromAttendance', () => {
    it('crea la asignación MARCACION_ASISTENCIA cuando el empleado es ROTANTE', async () => {
      repository.findEmployeeCostCenter.mockResolvedValue(CostCenter.ROTANTE);
      repository.upsertForDay.mockResolvedValue({
        id: 'a1',
        tenantId: TENANT,
        employeeId: ROTANTE_EMPLOYEE,
        date: new Date('2026-07-02'),
        locationId: 'loc-b',
        shiftId: null,
        source: AssignmentSource.MARCACION_ASISTENCIA,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.resolveFromAttendance({
        tenantId: TENANT,
        employeeId: ROTANTE_EMPLOYEE,
        eventDate: new Date('2026-07-02'),
        locationId: 'loc-b',
      });

      expect(repository.upsertForDay).toHaveBeenCalledWith(
        expect.objectContaining({ source: AssignmentSource.MARCACION_ASISTENCIA, shiftId: null }),
      );
      expect(result?.source).toBe(AssignmentSource.MARCACION_ASISTENCIA);
    });

    it('skip silencioso cuando el empleado no es ROTANTE', async () => {
      repository.findEmployeeCostCenter.mockResolvedValue(CostCenter.ADMINISTRATIVO);

      const result = await service.resolveFromAttendance({
        tenantId: TENANT,
        employeeId: FIXED_EMPLOYEE,
        eventDate: new Date('2026-07-02'),
        locationId: 'loc-b',
      });

      expect(repository.upsertForDay).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('assignManual', () => {
    it('rechaza asignación manual para empleados que no son ROTANTE', async () => {
      repository.findEmployeeCostCenter.mockResolvedValue(CostCenter.PLANTA);

      await expect(
        service.assignManual({
          tenantId: TENANT,
          employeeId: FIXED_EMPLOYEE,
          date: new Date('2026-07-01'),
          locationId: 'loc-a',
          actorUserId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.upsertForDay).not.toHaveBeenCalled();
    });

    it('persiste con source=MANUAL para empleados ROTANTE', async () => {
      repository.findEmployeeCostCenter.mockResolvedValue(CostCenter.ROTANTE);
      repository.findActiveLocationInTenant.mockResolvedValue({
        id: 'loc-manual',
        name: 'Sede Manual',
      });
      repository.upsertForDay.mockResolvedValue({
        id: 'a1',
        tenantId: TENANT,
        employeeId: ROTANTE_EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-manual',
        shiftId: null,
        source: AssignmentSource.MANUAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.assignManual({
        tenantId: TENANT,
        employeeId: ROTANTE_EMPLOYEE,
        date: new Date('2026-07-01'),
        locationId: 'loc-manual',
        actorUserId: 'user-1',
      });

      expect(repository.upsertForDay).toHaveBeenCalledWith(
        expect.objectContaining({ source: AssignmentSource.MANUAL }),
      );
      expect(result.source).toBe(AssignmentSource.MANUAL);
    });

    it('rechaza locationId que no pertenece al tenant', async () => {
      repository.findEmployeeCostCenter.mockResolvedValue(CostCenter.ROTANTE);
      repository.findActiveLocationInTenant.mockResolvedValue(null);

      await expect(
        service.assignManual({
          tenantId: TENANT,
          employeeId: ROTANTE_EMPLOYEE,
          date: new Date('2026-07-01'),
          locationId: 'loc-otro-tenant',
          actorUserId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repository.upsertForDay).not.toHaveBeenCalled();
    });
  });

  describe('listForEmployeeCalendar', () => {
    it('combina asignaciones existentes con días pendientes sin duplicarlos', async () => {
      repository.findByTenantAndDateRange.mockResolvedValue([
        {
          id: 'a1',
          tenantId: TENANT,
          employeeId: ROTANTE_EMPLOYEE,
          date: new Date('2026-07-01'),
          locationId: 'loc-a',
          locationName: 'Sede A',
          shiftId: 'shift-1',
          source: AssignmentSource.TURNO_ASIGNADO,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      repository.findPendingDays.mockResolvedValue([
        { employeeId: ROTANTE_EMPLOYEE, date: new Date('2026-07-02') },
      ]);

      const days = await service.listForEmployeeCalendar(
        TENANT,
        ROTANTE_EMPLOYEE,
        new Date('2026-07-01'),
        new Date('2026-07-02'),
      );

      expect(days).toHaveLength(2);
      expect(days[0].isPending).toBe(false);
      expect(days[0].locationName).toBe('Sede A');
      expect(days[1].isPending).toBe(true);
      expect(days[1].locationId).toBeNull();
    });
  });

  describe('listPendingForTenant', () => {
    it('recolecta días pendientes de todos los empleados ROTANTE del tenant', async () => {
      repository.findRotanteEmployees.mockResolvedValue([
        { id: ROTANTE_EMPLOYEE, name: 'Ana Rotante' },
      ]);
      repository.findPendingDays.mockResolvedValue([
        { employeeId: ROTANTE_EMPLOYEE, date: new Date('2026-07-03') },
      ]);

      const pending = await service.listPendingForTenant(
        TENANT,
        new Date('2026-07-01'),
        new Date('2026-07-31'),
      );

      expect(pending).toEqual([
        {
          employeeId: ROTANTE_EMPLOYEE,
          employeeName: 'Ana Rotante',
          date: new Date('2026-07-03'),
          suggestedLocationId: null,
        },
      ]);
    });
  });
});
