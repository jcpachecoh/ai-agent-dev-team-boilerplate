import { Test, TestingModule } from '@nestjs/testing';
import { LeaveOrigin, LeaveStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../../prisma/prisma.service';
import { MedicalLeavesRepository } from '../repository/medical-leaves.repository';

const TENANT = 'tenant-1';
const EMPLOYEE_ID = 'emp-1';
const LEAVE_ID = 'leave-1';

const mockLeaveRow = {
  id: LEAVE_ID,
  tenantId: TENANT,
  employeeId: EMPLOYEE_ID,
  origin: LeaveOrigin.COMUN,
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-10'),
  totalDays: 10,
  employerPaidDays: 2,
  epsArlPaidDays: 8,
  epsArlAmount: new Decimal('400000.00'),
  employerAmount: new Decimal('200000.00'),
  supportStorageObjectId: null,
  status: LeaveStatus.REGISTRADA,
  radicatedAt: null,
  recoveredAt: null,
  rejectedAt: null,
  rejectionReason: null,
  createdAt: new Date('2026-03-01T10:00:00Z'),
  updatedAt: new Date('2026-03-01T10:00:00Z'),
  deletedAt: null,
};

describe('MedicalLeavesRepository', () => {
  let repository: MedicalLeavesRepository;
  let prisma: {
    medicalLeave: jest.Mocked<Record<string, jest.Mock>>;
  };

  beforeEach(async () => {
    prisma = {
      medicalLeave: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicalLeavesRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(MedicalLeavesRepository);
  });

  describe('findById', () => {
    it('filters by tenantId, id and deletedAt null', async () => {
      // Arrange
      prisma.medicalLeave.findFirst.mockResolvedValue(mockLeaveRow);

      // Act
      const result = await repository.findById(TENANT, LEAVE_ID);

      // Assert
      expect(prisma.medicalLeave.findFirst).toHaveBeenCalledWith({
        where: { tenantId: TENANT, id: LEAVE_ID, deletedAt: null },
      });
      expect(result?.totalDays).toBe(10);
    });

    it('returns null when leave is soft-deleted', async () => {
      // Arrange
      prisma.medicalLeave.findFirst.mockResolvedValue(null);

      // Act
      const result = await repository.findById(TENANT, LEAVE_ID);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('persists leave with tenantId and REGISTRADA status by default', async () => {
      // Arrange
      prisma.medicalLeave.create.mockResolvedValue(mockLeaveRow);

      // Act
      await repository.create(TENANT, {
        employeeId: EMPLOYEE_ID,
        origin: LeaveOrigin.COMUN,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-03-10'),
        totalDays: 10,
        employerPaidDays: 2,
        epsArlPaidDays: 8,
        epsArlAmount: new Decimal('400000.00'),
        employerAmount: new Decimal('200000.00'),
      });

      // Assert
      expect(prisma.medicalLeave.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT,
          employeeId: EMPLOYEE_ID,
          status: LeaveStatus.REGISTRADA,
        }),
      });
    });
  });

  describe('update', () => {
    it('updates status and enforces tenant ownership', async () => {
      // Arrange
      prisma.medicalLeave.update.mockResolvedValue({
        ...mockLeaveRow,
        status: LeaveStatus.RADICADA_EPS,
        radicatedAt: new Date('2026-03-05'),
      });

      // Act
      const result = await repository.update(TENANT, LEAVE_ID, {
        status: LeaveStatus.RADICADA_EPS,
        radicatedAt: new Date('2026-03-05'),
      });

      // Assert
      expect(prisma.medicalLeave.update).toHaveBeenCalledWith({
        where: { id: LEAVE_ID },
        data: expect.objectContaining({
          status: LeaveStatus.RADICADA_EPS,
        }),
      });
      expect(result.status).toBe(LeaveStatus.RADICADA_EPS);
    });

    it('throws when updated row belongs to another tenant', async () => {
      // Arrange
      prisma.medicalLeave.update.mockResolvedValue({
        ...mockLeaveRow,
        tenantId: 'other-tenant',
      });

      // Act & Assert
      await expect(
        repository.update(TENANT, LEAVE_ID, { status: LeaveStatus.RADICADA_EPS }),
      ).rejects.toThrow(`MedicalLeave ${LEAVE_ID} does not belong to tenant ${TENANT}`);
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt instead of hard delete', async () => {
      // Arrange
      const deletedAt = new Date('2026-03-15');
      jest.useFakeTimers();
      jest.setSystemTime(deletedAt);
      prisma.medicalLeave.update.mockResolvedValue({
        ...mockLeaveRow,
        deletedAt,
      });

      // Act
      const result = await repository.softDelete(TENANT, LEAVE_ID);

      // Assert
      expect(prisma.medicalLeave.update).toHaveBeenCalledWith({
        where: { id: LEAVE_ID },
        data: { deletedAt },
      });
      expect(result.deletedAt).toEqual(deletedAt);
      jest.useRealTimers();
    });

    it('throws when soft-deleted row belongs to another tenant', async () => {
      prisma.medicalLeave.update.mockResolvedValue({
        ...mockLeaveRow,
        tenantId: 'other-tenant',
        deletedAt: new Date(),
      });

      await expect(repository.softDelete(TENANT, LEAVE_ID)).rejects.toThrow(
        `MedicalLeave ${LEAVE_ID} does not belong to tenant ${TENANT}`,
      );
    });
  });

  describe('listSummaries', () => {
    it('joins employee and location with tenant filter', async () => {
      // Arrange
      prisma.medicalLeave.findMany.mockResolvedValue([
        {
          ...mockLeaveRow,
          employee: {
            name: 'Ana Pérez',
            locationId: 'loc-1',
            location: { name: 'Sede Norte' },
          },
        },
      ]);

      // Act
      const result = await repository.listSummaries(TENANT, {
        locationId: 'loc-1',
        month: '2026-03',
      });

      // Assert
      expect(prisma.medicalLeave.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT,
            deletedAt: null,
            employee: {
              locationId: 'loc-1',
              tenantId: TENANT,
            },
            AND: [
              { endDate: { gte: new Date(Date.UTC(2026, 2, 1)) } },
              { startDate: { lte: new Date(Date.UTC(2026, 3, 0)) } },
            ],
          }),
          include: {
            employee: {
              select: {
                name: true,
                locationId: true,
                location: { select: { name: true } },
              },
            },
          },
        }),
      );
      expect(result[0]?.employeeName).toBe('Ana Pérez');
      expect(result[0]?.locationName).toBe('Sede Norte');
    });

    it('filters by dateFrom and dateTo when month is not provided', async () => {
      prisma.medicalLeave.findMany.mockResolvedValue([]);

      await repository.listSummaries(TENANT, {
        dateFrom: new Date('2026-01-01'),
        dateTo: new Date('2026-01-31'),
      });

      expect(prisma.medicalLeave.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              { endDate: { gte: new Date('2026-01-01') } },
              { startDate: { lte: new Date('2026-01-31') } },
            ],
          }),
        }),
      );
    });
  });

  describe('sumActiveDaysInCalendarYear', () => {
    it('sums totalDays for non-rejected leaves starting in the calendar year', async () => {
      // Arrange
      prisma.medicalLeave.aggregate.mockResolvedValue({
        _sum: { totalDays: 45 },
      });

      // Act
      const result = await repository.sumActiveDaysInCalendarYear(TENANT, EMPLOYEE_ID, 2026);

      // Assert
      expect(prisma.medicalLeave.aggregate).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT,
          employeeId: EMPLOYEE_ID,
          deletedAt: null,
          status: { not: LeaveStatus.RECHAZADA },
          startDate: {
            gte: new Date(Date.UTC(2026, 0, 1)),
            lte: new Date(Date.UTC(2026, 11, 31)),
          },
        },
        _sum: { totalDays: true },
      });
      expect(result).toBe(45);
    });

    it('returns 0 when aggregate sum is null', async () => {
      prisma.medicalLeave.aggregate.mockResolvedValue({
        _sum: { totalDays: null },
      });

      const result = await repository.sumActiveDaysInCalendarYear(TENANT, EMPLOYEE_ID, 2026);

      expect(result).toBe(0);
    });
  });

  describe('findOverlappingForPayrollPeriod', () => {
    it('returns leaves intersecting the payroll period', async () => {
      // Arrange
      const periodStart = new Date('2026-03-01');
      const periodEnd = new Date('2026-03-31');
      prisma.medicalLeave.findMany.mockResolvedValue([mockLeaveRow]);

      // Act
      const result = await repository.findOverlappingForPayrollPeriod(
        TENANT,
        EMPLOYEE_ID,
        periodStart,
        periodEnd,
      );

      // Assert
      expect(prisma.medicalLeave.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT,
          employeeId: EMPLOYEE_ID,
          deletedAt: null,
          status: { not: LeaveStatus.RECHAZADA },
          startDate: { lte: periodEnd },
          endDate: { gte: periodStart },
        },
        orderBy: { startDate: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.employerPaidDays).toBe(2);
    });
  });

  describe('findOverlappingForPayrollPeriodByEmployeeIds', () => {
    it('returns empty array when employeeIds is empty', async () => {
      const result = await repository.findOverlappingForPayrollPeriodByEmployeeIds(
        TENANT,
        [],
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );

      expect(result).toEqual([]);
      expect(prisma.medicalLeave.findMany).not.toHaveBeenCalled();
    });

    it('returns overlapping leaves for multiple employees', async () => {
      prisma.medicalLeave.findMany.mockResolvedValue([mockLeaveRow]);

      const result = await repository.findOverlappingForPayrollPeriodByEmployeeIds(
        TENANT,
        [EMPLOYEE_ID, 'emp-2'],
        new Date('2026-03-01'),
        new Date('2026-03-31'),
      );

      expect(prisma.medicalLeave.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: TENANT,
          employeeId: { in: [EMPLOYEE_ID, 'emp-2'] },
          deletedAt: null,
          status: { not: LeaveStatus.RECHAZADA },
          startDate: { lte: new Date('2026-03-31') },
          endDate: { gte: new Date('2026-03-01') },
        },
        orderBy: [{ employeeId: 'asc' }, { startDate: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });
  });
});
