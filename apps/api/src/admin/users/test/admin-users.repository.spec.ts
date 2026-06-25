import { Test, type TestingModule } from '@nestjs/testing';
import { DocumentType } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AdminUsersRepository } from '../repository/admin-users.repository';

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

describe('AdminUsersRepository', () => {
  let repo: AdminUsersRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminUsersRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repo = module.get<AdminUsersRepository>(AdminUsersRepository);
  });

  describe('findAll', () => {
    it('filters inactive users by default', async () => {
      mockPrisma.user.findMany.mockResolvedValue([baseRow]);

      await repo.findAll('t1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true, deletedAt: null }),
        }),
      );
    });

    it('includes inactive when flag is true', async () => {
      mockPrisma.user.findMany.mockResolvedValue([baseRow]);

      await repo.findAll('t1', true);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ isActive: true }),
        }),
      );
    });
  });

  describe('deactivate', () => {
    it('sets isActive=false and deletedAt', async () => {
      mockPrisma.user.update.mockResolvedValue(baseRow);

      await repo.deactivate('t1', 'u1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: expect.objectContaining({ isActive: false, deletedAt: expect.any(Date) }),
      });
    });
  });

  describe('setUserPermissionOverrides', () => {
    it('runs deleteMany + createMany in transaction', async () => {
      mockPrisma.$transaction.mockResolvedValue([]);

      await repo.setUserPermissionOverrides('u1', []);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findEmployeeProvisioningContext', () => {
    it('returns null when user has no employee details', async () => {
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

    it('returns provisioning context when employee details exist', async () => {
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

  describe('completeEmployeeUserProvisioning', () => {
    it('updates user, employee, operational profile and location in transaction', async () => {
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
      mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

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

    it('updates existing operational profile when already present', async () => {
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
      mockPrisma.$transaction.mockImplementation(async (callback) => callback(tx));

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
