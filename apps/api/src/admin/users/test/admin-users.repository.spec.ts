import { Test, type TestingModule } from '@nestjs/testing';
import { DocumentType } from '@prisma/client';

import { EmployeeHistoryRepository } from '../../../payroll/repository/employee-history.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdminUsersRepository } from '../repository/admin-users.repository';

const mockEmployeeHistoryRepository = {
  syncSalaryHistoryTx: jest.fn(),
  syncFundHistoryTx: jest.fn(),
};

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  employeeDetails: {
    update: jest.fn(),
  },
  operationalUser: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userLocation: {
    upsert: jest.fn(),
    create: jest.fn(),
  },
  location: {
    findFirst: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  userPermission: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const baseRow = {
  id: 'u1',
  tenantId: 't1',
  cedula: '12345678',
  documentType: DocumentType.CC,
  email: 'test@test.com',
  isActive: true,
  emailVerified: false,
  lastLoginAt: null,
  createdAt: new Date(),
  loginAttempts: 0,
  lockedUntil: null,
  passwordChangedAt: null,
  createdBy: null,
  role: { id: 'r1', code: 'OPERATOR', name: 'Operator' },
  employeeDetails: { name: 'Test User' },
};

describe('AdminUsersRepository', (): void => {
  let repo: AdminUsersRepository;

  beforeEach(async (): Promise<void> => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersRepository,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmployeeHistoryRepository, useValue: mockEmployeeHistoryRepository },
      ],
    }).compile();

    repo = module.get<AdminUsersRepository>(AdminUsersRepository);
  });

  describe('findAll', (): void => {
    it('filters inactive users by default', async (): Promise<void> => {
      mockPrisma.user.findMany.mockResolvedValue([baseRow]);

      await repo.findAll('t1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true, deletedAt: null }),
        }),
      );
    });

    it('includes inactive when flag is true', async (): Promise<void> => {
      mockPrisma.user.findMany.mockResolvedValue([baseRow]);

      await repo.findAll('t1', true);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('deactivate', (): void => {
    it('sets isActive=false and deletedAt', async (): Promise<void> => {
      mockPrisma.user.update.mockResolvedValue(baseRow);

      await repo.deactivate('t1', 'u1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: expect.objectContaining({ isActive: false, deletedAt: expect.any(Date) }),
      });
    });
  });

  describe('createWithEmployeeDetails', (): void => {
    it('seeds placeholder salary and fund history in the same transaction (OS-588)', async (): Promise<void> => {
      const createdUser = { id: 'user-new', role: baseRow.role, employeeDetails: null };
      const createdEmployeeDetails = {
        id: 'emp-new',
        salaryType: 'ORDINARIO',
        salaryAmount: 0,
        cesantiasFundName: 'Por definir',
        pensionFundName: 'Por definir',
      };
      const tx = {
        user: { create: jest.fn().mockResolvedValue(createdUser) },
        employeeDetails: { create: jest.fn().mockResolvedValue(createdEmployeeDetails) },
        operationalUser: { create: jest.fn() },
        userLocation: { create: jest.fn() },
      };
      mockPrisma.$transaction.mockImplementation((callback: (arg: typeof tx) => unknown): unknown =>
        callback(tx),
      );
      mockPrisma.location.findFirst.mockResolvedValue({ id: 'loc-1' });

      await repo.createWithEmployeeDetails('t1', {
        name: 'New Employee',
        cedula: '99999999',
        documentType: DocumentType.CC,
        email: 'new@test.com',
        roleId: 'r1',
        passwordHash: 'hash',
        createdBy: 'admin-1',
      });

      expect(mockEmployeeHistoryRepository.syncSalaryHistoryTx).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          tenantId: 't1',
          employeeDetailsId: 'emp-new',
          salaryAmount: 0,
          changedBy: 'admin-1',
        }),
      );
      expect(mockEmployeeHistoryRepository.syncFundHistoryTx).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          tenantId: 't1',
          employeeDetailsId: 'emp-new',
          fundType: 'CESANTIAS_FUND',
          fundName: 'Por definir',
        }),
      );
      expect(mockEmployeeHistoryRepository.syncFundHistoryTx).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({
          fundType: 'PENSION_FUND',
          fundName: 'Por definir',
        }),
      );
    });
  });

  describe('setUserPermissionOverrides', (): void => {
    it('runs deleteMany + createMany in transaction', async (): Promise<void> => {
      mockPrisma.$transaction.mockResolvedValue([]);

      await repo.setUserPermissionOverrides('u1', []);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findEmployeeProvisioningContext', (): void => {
    it('returns null when user has no employee details', async (): Promise<void> => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        cedula: '12345678',
        createdBy: null,
        employeeDetails: null,
        operationalProfile: null,
      });

      const result = await repo.findEmployeeProvisioningContext('t1', 'u1');

      expect(result).toBeNull();
    });

    it('returns provisioning context when employee details exist', async (): Promise<void> => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        cedula: '12345678',
        createdBy: null,
        employeeDetails: { id: 'emp-1', locationId: 'loc-1' },
        operationalProfile: { id: 'op-1' },
      });

      const result = await repo.findEmployeeProvisioningContext('t1', 'u1');

      expect(result).toEqual({
        id: 'u1',
        email: 'test@test.com',
        cedula: '12345678',
        createdBy: null,
        employeeDetailsId: 'emp-1',
        employeeLocationId: 'loc-1',
        hasOperationalProfile: true,
      });
    });
  });

  describe('completeEmployeeUserProvisioning', (): void => {
    it('updates user, employee, operational profile and location in transaction', async (): Promise<void> => {
      const tx = {
        user: {
          update: jest.fn(),
          findUniqueOrThrow: jest.fn().mockResolvedValue(baseRow),
        },
        employeeDetails: { update: jest.fn() },
        operationalUser: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
        },
        userLocation: { upsert: jest.fn() },
      };
      mockPrisma.$transaction.mockImplementation((callback: (arg: typeof tx) => unknown): unknown =>
        callback(tx),
      );

      const result = await repo.completeEmployeeUserProvisioning('t1', 'u1', {
        name: 'Updated Name',
        cedula: '12345678',
        documentType: DocumentType.CC,
        email: 'test@test.com',
        roleId: 'r1',
        passwordHash: 'hash',
        createdBy: 'admin-1',
        locationId: 'loc-1',
        operationalUser: { cedulaHash: 'cedula-hash', pinHash: 'pin-hash' },
      });

      expect(tx.user.update).toHaveBeenCalled();
      expect(tx.employeeDetails.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { locationId: 'loc-1', name: 'Updated Name' },
      });
      expect(tx.operationalUser.create).toHaveBeenCalled();
      expect(tx.userLocation.upsert).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('updates existing operational profile when already present', async (): Promise<void> => {
      const tx = {
        user: {
          update: jest.fn(),
          findUniqueOrThrow: jest.fn().mockResolvedValue(baseRow),
        },
        employeeDetails: { update: jest.fn() },
        operationalUser: {
          findUnique: jest.fn().mockResolvedValue({ id: 'op-1' }),
          create: jest.fn(),
          update: jest.fn(),
        },
        userLocation: { upsert: jest.fn() },
      };
      mockPrisma.$transaction.mockImplementation((callback: (arg: typeof tx) => unknown): unknown =>
        callback(tx),
      );

      await repo.completeEmployeeUserProvisioning('t1', 'u1', {
        name: 'Updated Name',
        cedula: '12345678',
        documentType: DocumentType.CC,
        email: 'test@test.com',
        roleId: 'r1',
        passwordHash: 'hash',
        createdBy: 'admin-1',
        operationalUser: { cedulaHash: 'cedula-hash', pinHash: 'pin-hash' },
      });

      expect(tx.employeeDetails.update).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        data: { name: 'Updated Name' },
      });
      expect(tx.operationalUser.update).toHaveBeenCalled();
      expect(tx.operationalUser.create).not.toHaveBeenCalled();
    });
  });
});
