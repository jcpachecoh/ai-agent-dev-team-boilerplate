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
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  rolePermission: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn().mockImplementation((arg: unknown) => {
    if (Array.isArray(arg)) return Promise.resolve([]);
    if (typeof arg === 'function') return (arg as (tx: unknown) => Promise<unknown>)(mockPrisma);
    return Promise.resolve();
  }),
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

    mockPrisma.$transaction.mockImplementation((arg: unknown) => {
      if (Array.isArray(arg)) return Promise.resolve([]);
      if (typeof arg === 'function') return (arg as (tx: unknown) => Promise<unknown>)(mockPrisma);
      return Promise.resolve();
    });

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

  describe('findAll (includeInactive branch)', () => {
    it('omits isActive filter when includeInactive = true', async () => {
      // Arrange
      mockPrisma.role.findMany.mockResolvedValue([baseRow]);

      // Act
      await repo.findAll('t1', true);

      // Assert — where should NOT include isActive
      expect(mockPrisma.role.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't1' } }),
      );
    });
  });

  describe('findById', () => {
    it('returns AdminRoleDetail with permissions when row exists', async () => {
      // Arrange
      const rowWithPerms = {
        ...baseRow,
        rolePermissions: [
          {
            permission: {
              id: 'p1',
              code: 'x.read',
              name: 'Read X',
              module: 'x',
              resource: null,
              action: null,
            },
          },
        ],
      };
      mockPrisma.role.findFirst.mockResolvedValue(rowWithPerms);

      // Act
      const result = await repo.findById('t1', 'r1');

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe('r1');
      expect(result?.permissions).toHaveLength(1);
    });

    it('returns null when role does not exist', async () => {
      // Arrange
      mockPrisma.role.findFirst.mockResolvedValue(null);

      // Act
      const result = await repo.findById('t1', 'nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('passes all defined optional fields when all are provided', async () => {
      // Arrange
      mockPrisma.role.update.mockResolvedValue(baseRow);

      // Act
      await repo.update('t1', 'r1', { name: 'New', description: 'Desc', isActive: false });

      // Assert
      expect(mockPrisma.role.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'New', description: 'Desc', isActive: false } }),
      );
    });

    it('passes empty data when no optional fields are provided', async () => {
      // Arrange
      mockPrisma.role.update.mockResolvedValue(baseRow);

      // Act
      await repo.update('t1', 'r1', {});

      // Assert
      expect(mockPrisma.role.update).toHaveBeenCalledWith(expect.objectContaining({ data: {} }));
    });
  });

  describe('duplicateRole', () => {
    it('copies permissions via createMany when source has permissions', async () => {
      // Arrange
      mockPrisma.rolePermission.findMany.mockResolvedValue([
        { permissionId: 'p1' },
        { permissionId: 'p2' },
      ]);
      const newRow = { ...baseRow, id: 'r2', code: 'MGR_COPY', name: 'Manager Copy' };
      mockPrisma.role.create.mockResolvedValue(newRow);

      // Act
      const result = await repo.duplicateRole('t1', 'r1', {
        code: 'MGR_COPY',
        name: 'Manager Copy',
      });

      // Assert
      expect(mockPrisma.rolePermission.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { roleId: 'r2', permissionId: 'p1' },
            { roleId: 'r2', permissionId: 'p2' },
          ],
        }),
      );
      expect(result.permissionCount).toBe(2);
      expect(result.userCount).toBe(0);
    });

    it('skips createMany when source role has no permissions', async () => {
      // Arrange
      mockPrisma.rolePermission.findMany.mockResolvedValue([]);
      const newRow = { ...baseRow, id: 'r3', code: 'EMPTY', name: 'Empty' };
      mockPrisma.role.create.mockResolvedValue(newRow);

      // Act
      const result = await repo.duplicateRole('t1', 'r1', { code: 'EMPTY', name: 'Empty' });

      // Assert
      expect(mockPrisma.rolePermission.createMany).not.toHaveBeenCalled();
      expect(result.permissionCount).toBe(0);
    });
  });

  describe('findAllPermissions', () => {
    it('filters active permissions by default', async () => {
      // Arrange
      mockPrisma.permission.findMany.mockResolvedValue([]);

      // Act
      await repo.findAllPermissions();

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });

    it('returns all permissions when includeInactive = true', async () => {
      // Arrange
      mockPrisma.permission.findMany.mockResolvedValue([]);

      // Act
      await repo.findAllPermissions(true);

      // Assert
      expect(mockPrisma.permission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('isPermissionInUse', () => {
    it('returns true when count > 0', async () => {
      // Arrange
      mockPrisma.rolePermission.count.mockResolvedValue(2);

      // Act & Assert
      expect(await repo.isPermissionInUse('p1')).toBe(true);
    });

    it('returns false when count === 0', async () => {
      // Arrange
      mockPrisma.rolePermission.count.mockResolvedValue(0);

      // Act & Assert
      expect(await repo.isPermissionInUse('p1')).toBe(false);
    });
  });

  describe('updatePermission', () => {
    it('passes all defined optional fields when all are provided', async () => {
      // Arrange
      const permRow = {
        id: 'p1',
        code: 'x',
        name: 'X',
        description: null,
        module: null,
        resource: null,
        action: null,
        isActive: true,
      };
      mockPrisma.permission.update.mockResolvedValue(permRow);

      // Act
      await repo.updatePermission('p1', {
        name: 'New',
        description: 'Desc',
        module: 'mod',
        resource: 'res',
        action: 'act',
        isActive: false,
      });

      // Assert
      expect(mockPrisma.permission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: 'New',
            description: 'Desc',
            module: 'mod',
            resource: 'res',
            action: 'act',
            isActive: false,
          },
        }),
      );
    });

    it('passes empty data when no optional fields are provided', async () => {
      // Arrange
      const permRow = {
        id: 'p1',
        code: 'x',
        name: 'X',
        description: null,
        module: null,
        resource: null,
        action: null,
        isActive: true,
      };
      mockPrisma.permission.update.mockResolvedValue(permRow);

      // Act
      await repo.updatePermission('p1', {});

      // Assert
      expect(mockPrisma.permission.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: {} }),
      );
    });
  });
});
