import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../prisma/prisma.service';
import { AdminRolesRepository } from '../repository/admin-roles.repository';

const mockPrisma = {
  role: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  permission: {
    findMany: jest.fn(),
  },
  rolePermission: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const baseRow = {
  id: 'r1',
  tenantId: 't1',
  code: 'OWNER',
  name: 'Owner',
  description: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { users: 2, rolePermissions: 5 },
};

describe('AdminRolesRepository', () => {
  let repo: AdminRolesRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRolesRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repo = module.get<AdminRolesRepository>(AdminRolesRepository);
  });

  describe('findAll', () => {
    it('filters inactive roles by default', async () => {
      mockPrisma.role.findMany.mockResolvedValue([baseRow]);

      await repo.findAll('t1');

      expect(mockPrisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('maps _count to userCount and permissionCount', async () => {
      mockPrisma.role.findMany.mockResolvedValue([baseRow]);

      const result = await repo.findAll('t1');

      expect(result[0].userCount).toBe(2);
      expect(result[0].permissionCount).toBe(5);
    });
  });

  describe('hasActiveUsers', () => {
    it('returns true when count > 0', async () => {
      mockPrisma.user.count.mockResolvedValue(3);
      expect(await repo.hasActiveUsers('r1')).toBe(true);
    });

    it('returns false when count is 0', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      expect(await repo.hasActiveUsers('r1')).toBe(false);
    });
  });

  describe('setRolePermissions', () => {
    it('runs deleteMany + createMany in transaction', async () => {
      mockPrisma.$transaction.mockResolvedValue([]);

      await repo.setRolePermissions('r1', ['p1', 'p2']);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('sets isActive=false', async () => {
      mockPrisma.role.update.mockResolvedValue(baseRow);

      await repo.deactivate('t1', 'r1');

      expect(mockPrisma.role.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { isActive: false },
      });
    });
  });
});
