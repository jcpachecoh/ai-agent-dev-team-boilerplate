import { Test, type TestingModule } from '@nestjs/testing';
import { DocumentType } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { AdminUsersRepository } from '../repository/admin-users.repository';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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
});
