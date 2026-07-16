import { Test, TestingModule } from '@nestjs/testing';
import { CostCenter, EmployeeContractType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ReportsRepository } from '../repository/reports.repository';

describe('ReportsRepository', () => {
  let repository: ReportsRepository;
  let prisma: {
    employeeDetails: { findMany: jest.Mock };
    attendanceLog: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      employeeDetails: { findMany: jest.fn().mockResolvedValue([]) },
      attendanceLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get(ReportsRepository);
  });

  describe('findActiveEmployees', () => {
    it('queries without location clause when no location filters are provided', async () => {
      await repository.findActiveEmployees('tenant-1');

      expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant-1',
            isActive: true,
            deletedAt: null,
          },
        }),
      );
    });

    it('includes rotantes with daily assignments when filtering by locationId + period', async () => {
      const periodFrom = new Date('2026-07-01T00:00:00.000Z');
      const periodTo = new Date('2026-07-31T23:59:59.999Z');

      await repository.findActiveEmployees('tenant-1', {
        locationId: 'loc-a',
        periodFrom,
        periodTo,
        contractType: EmployeeContractType.INDEFINIDO,
        employeeId: 'emp-1',
      });

      expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                tenantId: 'tenant-1',
                isActive: true,
                deletedAt: null,
                contractType: EmployeeContractType.INDEFINIDO,
                id: 'emp-1',
              },
              {
                OR: [
                  { locationId: 'loc-a' },
                  {
                    costCenter: CostCenter.ROTANTE,
                    dailyCostCenterAssignments: {
                      some: {
                        tenantId: 'tenant-1',
                        locationId: 'loc-a',
                        date: { gte: periodFrom, lte: periodTo },
                      },
                    },
                  },
                ],
              },
            ],
          },
        }),
      );
    });

    it('filters by locationId alone without rotante assignment clause when period is missing', async () => {
      await repository.findActiveEmployees('tenant-1', { locationId: 'loc-a' });

      expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                tenantId: 'tenant-1',
                isActive: true,
                deletedAt: null,
              },
              {
                OR: [{ locationId: 'loc-a' }],
              },
            ],
          },
        }),
      );
    });

    it('includes all rotantes when actor is scoped by allowedLocationIds', async () => {
      await repository.findActiveEmployees('tenant-1', {
        allowedLocationIds: ['loc-a', 'loc-b'],
      });

      expect(prisma.employeeDetails.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                tenantId: 'tenant-1',
                isActive: true,
                deletedAt: null,
              },
              {
                OR: [
                  { locationId: { in: ['loc-a', 'loc-b'] } },
                  { costCenter: CostCenter.ROTANTE },
                ],
              },
            ],
          },
        }),
      );
    });
  });

  describe('findAttendanceLogsByDateRange', () => {
    it('filters by employeeIds when provided', async () => {
      const from = new Date('2026-07-01T00:00:00.000Z');
      const to = new Date('2026-07-31T23:59:59.999Z');

      await repository.findAttendanceLogsByDateRange('tenant-1', from, to, ['emp-1']);

      expect(prisma.attendanceLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant-1',
            isActive: true,
            workDate: { gte: from, lte: to },
            employeeId: { in: ['emp-1'] },
          },
        }),
      );
    });

    it('omits employeeId filter when employeeIds is empty', async () => {
      const from = new Date('2026-07-01T00:00:00.000Z');
      const to = new Date('2026-07-31T23:59:59.999Z');

      await repository.findAttendanceLogsByDateRange('tenant-1', from, to, []);

      expect(prisma.attendanceLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant-1',
            isActive: true,
            workDate: { gte: from, lte: to },
          },
        }),
      );
    });
  });
});
