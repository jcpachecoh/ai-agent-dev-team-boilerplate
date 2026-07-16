import { type CanActivate, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentSource } from '@prisma/client';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DailyCostCenterController } from '../controller/daily-cost-center.controller';
import { DailyCostCenterService } from '../service/daily-cost-center.service';

const allowGuard: CanActivate = { canActivate: (): boolean => true };

const TENANT = 'tenant-1';

const user = {
  sub: 'user-1',
  tenantId: TENANT,
  roleCode: 'NOMINA',
  roleId: 'role-nomina',
  email: 'nomina@test.dev',
} as unknown as JwtPayload;

describe('DailyCostCenterController', () => {
  let controller: DailyCostCenterController;
  let service: jest.Mocked<DailyCostCenterService>;

  beforeEach(async () => {
    service = {
      listForEmployeeCalendar: jest.fn(),
      assignManual: jest.fn(),
      listPendingForTenant: jest.fn(),
      deleteManual: jest.fn(),
    } as unknown as jest.Mocked<DailyCostCenterService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyCostCenterController],
      providers: [{ provide: DailyCostCenterService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allowGuard)
      .overrideGuard(RolesGuard)
      .useValue(allowGuard)
      .overrideGuard(PermissionsGuard)
      .useValue(allowGuard)
      .compile();

    controller = module.get(DailyCostCenterController);
  });

  describe('listForEmployeeCalendar', () => {
    it('delega en el service con tenantId del JWT y mapea las fechas a YYYY-MM-DD', async () => {
      service.listForEmployeeCalendar.mockResolvedValue([
        {
          date: new Date('2026-07-01'),
          locationId: 'loc-a',
          locationName: 'Sede A',
          source: AssignmentSource.TURNO_ASIGNADO,
          isPending: false,
        },
        {
          date: new Date('2026-07-02'),
          locationId: null,
          locationName: null,
          source: null,
          isPending: true,
        },
      ]);

      const result = await controller.listForEmployeeCalendar(user, '', 'emp-1', {
        from: '2026-07-01',
        to: '2026-07-02',
      });

      expect(service.listForEmployeeCalendar).toHaveBeenCalledWith(
        TENANT,
        'emp-1',
        new Date('2026-07-01'),
        new Date('2026-07-02'),
      );
      expect(result).toEqual([
        {
          date: '2026-07-01',
          locationId: 'loc-a',
          locationName: 'Sede A',
          source: AssignmentSource.TURNO_ASIGNADO,
          isPending: false,
        },
        { date: '2026-07-02', locationId: null, locationName: null, source: null, isPending: true },
      ]);
    });
  });

  describe('assignManual', () => {
    it('delega en el service con actorUserId del JWT y mapea la respuesta', async () => {
      service.assignManual.mockResolvedValue({
        id: 'assignment-1',
        tenantId: TENANT,
        employeeId: 'emp-1',
        date: new Date('2026-07-01'),
        locationId: 'loc-b',
        shiftId: null,
        source: AssignmentSource.MANUAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.assignManual(user, '', 'emp-1', '2026-07-01', {
        locationId: 'loc-b',
      });

      expect(service.assignManual).toHaveBeenCalledWith({
        tenantId: TENANT,
        employeeId: 'emp-1',
        date: new Date('2026-07-01'),
        locationId: 'loc-b',
        actorUserId: 'user-1',
      });
      expect(result).toEqual({
        id: 'assignment-1',
        employeeId: 'emp-1',
        date: '2026-07-01',
        locationId: 'loc-b',
        shiftId: null,
        source: AssignmentSource.MANUAL,
      });
    });
  });

  describe('listPendingForTenant', () => {
    it('delega en el service y mapea la fecha', async () => {
      service.listPendingForTenant.mockResolvedValue([
        {
          employeeId: 'emp-1',
          employeeName: 'Ana Rotante',
          date: new Date('2026-07-03'),
          suggestedLocationId: null,
        },
      ]);

      const result = await controller.listPendingForTenant(user, '', {
        from: '2026-07-01',
        to: '2026-07-31',
      });

      expect(service.listPendingForTenant).toHaveBeenCalledWith(
        TENANT,
        new Date('2026-07-01'),
        new Date('2026-07-31'),
      );
      expect(result).toEqual([
        {
          employeeId: 'emp-1',
          employeeName: 'Ana Rotante',
          date: '2026-07-03',
          suggestedLocationId: null,
        },
      ]);
    });
  });

  describe('deleteManual', () => {
    it('elimina la asignación manual cuando existe', async () => {
      service.deleteManual.mockResolvedValue({
        id: 'assignment-1',
        tenantId: TENANT,
        employeeId: 'emp-1',
        date: new Date('2026-07-01'),
        locationId: 'loc-b',
        shiftId: null,
        source: AssignmentSource.MANUAL,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(controller.deleteManual(user, '', 'assignment-1')).resolves.toBeUndefined();
      expect(service.deleteManual).toHaveBeenCalledWith(TENANT, 'assignment-1');
    });

    it('lanza NotFoundException cuando no existe o no es MANUAL', async () => {
      service.deleteManual.mockResolvedValue(null);

      await expect(controller.deleteManual(user, '', 'assignment-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
