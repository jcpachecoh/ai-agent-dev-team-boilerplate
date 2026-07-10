import { Test, TestingModule } from '@nestjs/testing';
import { NovedadRequestSource, NovedadStatus, NovedadType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { PayrollNovedadesRepository } from '../repository/payroll-novedades.repository';

const TENANT = 'tenant-1';
const EMPLOYEE_ID = 'emp-1';
const NOVEDAD_ID = 'nov-1';

const mockNovedadRow = {
  id: NOVEDAD_ID,
  tenantId: TENANT,
  employeeId: EMPLOYEE_ID,
  type: NovedadType.PERMISO_REMUNERADO,
  startDate: new Date('2026-07-01T00:00:00.000Z'),
  endDate: new Date('2026-07-03T00:00:00.000Z'),
  isPaid: true,
  linkedLeaveId: null,
  supportStorageObjectId: null,
  notes: null,
  requestedBy: NovedadRequestSource.EMPLEADO,
  status: NovedadStatus.PENDIENTE_SUPERVISOR,
  supervisorApproverId: null,
  supervisorDecisionAt: null,
  supervisorComment: null,
  rrhhApproverId: null,
  rrhhDecisionAt: null,
  rejectionReason: null,
  overlapWarningAck: false,
  createdAt: new Date('2026-07-01T10:00:00Z'),
  updatedAt: new Date('2026-07-01T10:00:00Z'),
  deletedAt: null,
};

describe('PayrollNovedadesRepository', () => {
  let repository: PayrollNovedadesRepository;
  let prisma: {
    payrollNovedad: jest.Mocked<Record<string, jest.Mock>>;
    employeePositionSupervisor: jest.Mocked<Record<string, jest.Mock>>;
    employeeDetails: jest.Mocked<Record<string, jest.Mock>>;
    user: jest.Mocked<Record<string, jest.Mock>>;
    userLocation: jest.Mocked<Record<string, jest.Mock>>;
  };

  beforeEach(async () => {
    prisma = {
      payrollNovedad: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      employeePositionSupervisor: {
        findMany: jest.fn(),
      },
      employeeDetails: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      userLocation: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PayrollNovedadesRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(PayrollNovedadesRepository);
  });

  describe('findById', () => {
    it('filters by tenantId, id and deletedAt null', async () => {
      prisma.payrollNovedad.findFirst.mockResolvedValue(mockNovedadRow);

      const result = await repository.findById(TENANT, NOVEDAD_ID);

      expect(prisma.payrollNovedad.findFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT, id: NOVEDAD_ID, deletedAt: null },
      });
      expect(result?.status).toBe(NovedadStatus.PENDIENTE_SUPERVISOR);
    });

    it('returns null when novedad is soft-deleted', async () => {
      prisma.payrollNovedad.findFirst.mockResolvedValue(null);

      const result = await repository.findById(TENANT, NOVEDAD_ID);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('persists novedad with tenantId', async () => {
      prisma.payrollNovedad.create.mockResolvedValue(mockNovedadRow);

      await repository.create(TENANT, {
        employeeId: EMPLOYEE_ID,
        type: NovedadType.PERMISO_REMUNERADO,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-03'),
        isPaid: true,
        requestedBy: NovedadRequestSource.EMPLEADO,
        status: NovedadStatus.PENDIENTE_SUPERVISOR,
      });

      expect(prisma.payrollNovedad.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          employeeId: EMPLOYEE_ID,
          status: NovedadStatus.PENDIENTE_SUPERVISOR,
        }),
      });
    });
  });

  describe('update', () => {
    it('throws when updated row belongs to another tenant', async () => {
      prisma.payrollNovedad.update.mockResolvedValue({
        ...mockNovedadRow,
        tenantId: 'other-tenant',
      });

      await expect(
        repository.update(TENANT, NOVEDAD_ID, { status: NovedadStatus.RECHAZADA }),
      ).rejects.toThrow('does not belong to tenant');
    });

    it('updates novedad fields for matching tenant', async () => {
      prisma.payrollNovedad.update.mockResolvedValue({
        ...mockNovedadRow,
        status: NovedadStatus.APROBADA,
        rrhhApproverId: 'user-rrhh',
      });

      const result = await repository.update(TENANT, NOVEDAD_ID, {
        status: NovedadStatus.APROBADA,
        rrhhApproverId: 'user-rrhh',
      });

      expect(result.status).toBe(NovedadStatus.APROBADA);
      expect(result.rrhhApproverId).toBe('user-rrhh');
    });
  });

  describe('listSummaries', () => {
    it('maps employee and location labels from included relation', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([
        {
          ...mockNovedadRow,
          employee: {
            name: 'Ana Perez',
            locationId: 'loc-1',
            location: { name: 'Sede Norte' },
          },
        },
      ]);

      const result = await repository.listSummaries(TENANT, { take: 20 });

      expect(result).toHaveLength(1);
      expect(result[0]?.employeeName).toBe('Ana Perez');
      expect(result[0]?.locationName).toBe('Sede Norte');
    });

    it('trims pagination and defaults missing employee fields', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([
        { ...mockNovedadRow, id: 'nov-1', employee: null },
        {
          ...mockNovedadRow,
          id: 'nov-2',
          employee: { name: 'Luis', locationId: 'loc-2', location: null },
        },
        {
          ...mockNovedadRow,
          id: 'nov-3',
          employee: {
            name: 'Camila',
            locationId: 'loc-3',
            location: { name: 'Sede Centro' },
          },
        },
      ]);

      const result = await repository.listSummaries(TENANT, { take: 2, cursor: 'nov-0' });

      expect(prisma.payrollNovedad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
          cursor: { id: 'nov-0' },
          skip: 1,
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]?.employeeName).toBe('');
      expect(result[0]?.locationName).toBeNull();
    });
  });

  describe('findOverlapping', () => {
    it('returns conflicting ids when overlap exists', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([{ id: 'other-1' }]);

      const result = await repository.findOverlapping(
        TENANT,
        EMPLOYEE_ID,
        new Date('2026-07-01'),
        new Date('2026-07-03'),
      );

      expect(result.hasOverlap).toBe(true);
      expect(result.conflictingNovedadIds).toEqual(['other-1']);
    });

    it('excludes current novedad when excludeId is provided', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([]);

      await repository.findOverlapping(
        TENANT,
        EMPLOYEE_ID,
        new Date('2026-07-01'),
        new Date('2026-07-03'),
        NOVEDAD_ID,
      );

      expect(prisma.payrollNovedad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: NOVEDAD_ID },
          }),
        }),
      );
    });
  });

  describe('findApprovedForPeriodByEmployeeIds', () => {
    it('returns empty array when employeeIds is empty', async () => {
      const result = await repository.findApprovedForPeriodByEmployeeIds(
        TENANT,
        [],
        new Date('2026-07-01'),
        new Date('2026-07-31'),
      );

      expect(result).toEqual([]);
      expect(prisma.payrollNovedad.findMany).not.toHaveBeenCalled();
    });

    it('queries approved novedades intersecting the period', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([mockNovedadRow]);

      const result = await repository.findApprovedForPeriodByEmployeeIds(
        TENANT,
        [EMPLOYEE_ID],
        new Date('2026-07-01'),
        new Date('2026-07-31'),
      );

      expect(prisma.payrollNovedad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            employeeId: { in: [EMPLOYEE_ID] },
            status: NovedadStatus.APROBADA,
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findSubordinatePositionIds', () => {
    it('returns transitive subordinate position ids via BFS', async () => {
      prisma.employeePositionSupervisor.findMany
        .mockResolvedValueOnce([{ positionId: 'pos-b' }])
        .mockResolvedValueOnce([{ positionId: 'pos-c' }])
        .mockResolvedValueOnce([]);

      const result = await repository.findSubordinatePositionIds(TENANT, 'pos-a');

      expect(result).toEqual(['pos-b', 'pos-c']);
    });
  });

  describe('findEmployeeApprovalContext', () => {
    it('returns null when employee is not found', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue(null);

      const result = await repository.findEmployeeApprovalContext(TENANT, EMPLOYEE_ID);

      expect(result).toBeNull();
    });

    it('returns approval context for active employee', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue({
        userId: 'user-1',
        locationId: 'loc-1',
        positionId: 'pos-1',
      });

      const result = await repository.findEmployeeApprovalContext(TENANT, EMPLOYEE_ID);

      expect(result).toEqual({
        userId: 'user-1',
        locationId: 'loc-1',
        positionId: 'pos-1',
      });
    });
  });

  describe('findActorUser', () => {
    it('returns null when user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      const result = await repository.findActorUser(TENANT, 'missing-user');

      expect(result).toBeNull();
    });

    it('returns role and position for existing user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        role: { code: 'NOMINA' },
        employeeDetails: { positionId: 'pos-rrhh' },
      });

      const result = await repository.findActorUser(TENANT, 'user-rrhh');

      expect(result).toEqual({ roleCode: 'NOMINA', positionId: 'pos-rrhh' });
    });
  });

  describe('findEmployeeIdByUserId', () => {
    it('returns employee id when mapping exists', async () => {
      prisma.employeeDetails.findFirst.mockResolvedValue({ id: EMPLOYEE_ID });

      const result = await repository.findEmployeeIdByUserId(TENANT, 'user-1');

      expect(result).toBe(EMPLOYEE_ID);
    });
  });

  describe('findSupervisorCandidatesInLocation', () => {
    it('maps supervisor users in location', async () => {
      prisma.userLocation.findMany.mockResolvedValue([
        {
          user: {
            id: 'sup-1',
            employeeDetails: { positionId: 'pos-boss' },
          },
        },
      ]);

      const result = await repository.findSupervisorCandidatesInLocation(TENANT, 'loc-1');

      expect(result).toEqual([{ id: 'sup-1', positionId: 'pos-boss' }]);
    });
  });

  describe('findEmployeeIdsInScope', () => {
    it('returns empty array when locationIds is empty', async () => {
      const result = await repository.findEmployeeIdsInScope(TENANT, [], ['pos-1']);

      expect(result).toEqual([]);
      expect(prisma.employeeDetails.findMany).not.toHaveBeenCalled();
    });

    it('filters employees by location and subordinate positions', async () => {
      prisma.employeeDetails.findMany.mockResolvedValue([{ id: EMPLOYEE_ID }]);

      const result = await repository.findEmployeeIdsInScope(TENANT, ['loc-1'], ['pos-emp']);

      expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            locationId: { in: ['loc-1'] },
            positionId: { in: ['pos-emp'] },
          }),
        }),
      );
      expect(result).toEqual([EMPLOYEE_ID]);
    });

    it('omits position filter when subordinate list is empty', async () => {
      prisma.employeeDetails.findMany.mockResolvedValue([{ id: EMPLOYEE_ID }]);

      await repository.findEmployeeIdsInScope(TENANT, ['loc-1'], []);

      expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            positionId: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('listSummaries filters', () => {
    it('applies status, location and date filters', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([]);

      await repository.listSummaries(TENANT, {
        status: [NovedadStatus.PENDIENTE_RRHH],
        employeeIds: [EMPLOYEE_ID],
        locationId: 'loc-1',
        type: NovedadType.PERMISO_REMUNERADO,
        startDateFrom: new Date('2026-07-01'),
        startDateTo: new Date('2026-07-31'),
      });

      expect(prisma.payrollNovedad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            status: { in: [NovedadStatus.PENDIENTE_RRHH] },
            employeeId: { in: [EMPLOYEE_ID] },
            type: NovedadType.PERMISO_REMUNERADO,
            employee: { locationId: 'loc-1', tenantId: TENANT },
            AND: [
              { endDate: { gte: new Date('2026-07-01') } },
              { startDate: { lte: new Date('2026-07-31') } },
            ],
          }),
        }),
      );
    });

    it('applies supervisor inbox status when no explicit status is provided', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([]);

      await repository.listSummaries(TENANT, { supervisorInbox: true });

      expect(prisma.payrollNovedad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: NovedadStatus.PENDIENTE_SUPERVISOR,
          }),
        }),
      );
    });

    it('applies rrhh inbox status when no explicit status is provided', async () => {
      prisma.payrollNovedad.findMany.mockResolvedValue([]);

      await repository.listSummaries(TENANT, { rrhhInbox: true });

      expect(prisma.payrollNovedad.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: NovedadStatus.PENDIENTE_RRHH,
          }),
        }),
      );
    });
  });
});
