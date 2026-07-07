import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import type { AdminRoleDetail, AdminRoleListItem } from '../interfaces/admin-roles.interfaces';
import { AdminRolesRepository } from '../repository/admin-roles.repository';
import { AdminRolesService } from '../service/admin-roles.service';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  hasActiveUsers: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  duplicateRole: jest.fn(),
  setRolePermissions: jest.fn(),
  findAllPermissions: jest.fn(),
  findPermissionsByIds: jest.fn(),
  findPermissionById: jest.fn(),
  findPermissionByCode: jest.fn(),
  isPermissionInUse: jest.fn(),
  createPermission: jest.fn(),
  updatePermission: jest.fn(),
  deactivatePermission: jest.fn(),
};

const baseRole: AdminRoleListItem = {
  id: 'role-1',
  tenantId: 'tenant-1',
  code: 'TEST_ROLE',
  name: 'Test Role',
  description: null,
  isActive: true,
  userCount: 0,
  permissionCount: 0,
  createdAt: new Date(),
};

const baseRoleDetail: AdminRoleDetail = { ...baseRole, permissions: [] };

describe('AdminRolesService', () => {
  let service: AdminRolesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminRolesService, { provide: AdminRolesRepository, useValue: mockRepo }],
    }).compile();

    service = module.get<AdminRolesService>(AdminRolesService);
  });

  describe('findAll', () => {
    it('delegates to repository with includeInactive=true', async () => {
      mockRepo.findAll.mockResolvedValue([baseRole]);

      const result = await service.findAll('tenant-1', true);

      expect(result).toEqual([baseRole]);
      expect(mockRepo.findAll).toHaveBeenCalledWith('tenant-1', true);
    });
  });

  describe('findById', () => {
    it('returns role detail when found', async () => {
      mockRepo.findById.mockResolvedValue(baseRoleDetail);

      const result = await service.findById('tenant-1', 'role-1');

      expect(result).toEqual(baseRoleDetail);
      expect(mockRepo.findById).toHaveBeenCalledWith('tenant-1', 'role-1');
    });

    it('throws NotFoundException when role does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createRole', () => {
    it('creates role with valid UPPER_SNAKE_CASE code', async () => {
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(baseRole);

      const result = await service.createRole('tenant-1', { code: 'NEW_ROLE', name: 'New Role' });
      expect(result).toEqual(baseRole);
      expect(mockRepo.create).toHaveBeenCalledWith('tenant-1', {
        code: 'NEW_ROLE',
        name: 'New Role',
      });
    });

    it('throws ConflictException for invalid code format', async () => {
      await expect(
        service.createRole('tenant-1', { code: 'invalid_code', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException for lowercase code', async () => {
      await expect(
        service.createRole('tenant-1', { code: 'myRole', name: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on duplicate code', async () => {
      mockRepo.findByCode.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createRole('tenant-1', { code: 'DUPLICATE', name: 'Dup' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateRole', () => {
    it('deactivates role with no active users', async () => {
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.hasActiveUsers.mockResolvedValue(false);
      mockRepo.deactivate.mockResolvedValue(undefined);

      await service.deactivateRole('tenant-1', 'role-1');
      expect(mockRepo.deactivate).toHaveBeenCalledWith('tenant-1', 'role-1');
    });

    it('throws ConflictException when role has active users', async () => {
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.hasActiveUsers.mockResolvedValue(true);

      await expect(service.deactivateRole('tenant-1', 'role-1')).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when role not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deactivateRole('tenant-1', 'ghost')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when trying to deactivate OWNER (protected role)', async () => {
      // Arrange
      const ownerRole: AdminRoleDetail = { ...baseRoleDetail, code: 'OWNER' };
      mockRepo.findById.mockResolvedValue(ownerRole);

      // Act & Assert
      await expect(service.deactivateRole('tenant-1', 'role-owner')).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepo.hasActiveUsers).not.toHaveBeenCalled();
      expect(mockRepo.deactivate).not.toHaveBeenCalled();
    });

    it('throws ConflictException when trying to deactivate SUPER_ADMIN (protected role)', async () => {
      // Arrange
      const superAdminRole: AdminRoleDetail = { ...baseRoleDetail, code: 'SUPER_ADMIN' };
      mockRepo.findById.mockResolvedValue(superAdminRole);

      // Act & Assert
      await expect(service.deactivateRole('tenant-1', 'role-super-admin')).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepo.hasActiveUsers).not.toHaveBeenCalled();
      expect(mockRepo.deactivate).not.toHaveBeenCalled();
    });

    it('deactivates non-protected role normally', async () => {
      // Arrange
      const supervisorRole: AdminRoleDetail = { ...baseRoleDetail, code: 'SUPERVISOR' };
      mockRepo.findById.mockResolvedValue(supervisorRole);
      mockRepo.hasActiveUsers.mockResolvedValue(false);
      mockRepo.deactivate.mockResolvedValue(undefined);

      // Act
      await service.deactivateRole('tenant-1', 'role-sup');

      // Assert
      expect(mockRepo.deactivate).toHaveBeenCalledWith('tenant-1', 'role-sup');
    });
  });

  describe('updateRole', () => {
    it('updates an existing role', async () => {
      const updated = { ...baseRole, name: 'Updated Role' };
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateRole('tenant-1', 'role-1', { name: 'Updated Role' });

      expect(result).toEqual(updated);
      expect(mockRepo.update).toHaveBeenCalledWith('tenant-1', 'role-1', {
        name: 'Updated Role',
      });
    });

    it('throws NotFoundException when updating a missing role', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateRole('tenant-1', 'missing', { description: 'n/a' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignRolePermissions', () => {
    it('assigns permissions with replace-all semantics', async () => {
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.findPermissionsByIds.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
      mockRepo.setRolePermissions.mockResolvedValue(undefined);

      await service.assignRolePermissions('tenant-1', 'role-1', ['p1', 'p2']);
      expect(mockRepo.setRolePermissions).toHaveBeenCalledWith('role-1', ['p1', 'p2']);
    });

    it('throws NotFoundException when a permissionId does not exist', async () => {
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.findPermissionsByIds.mockResolvedValue([{ id: 'p1' }]);

      await expect(
        service.assignRolePermissions('tenant-1', 'role-1', ['p1', 'missing']),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows empty permissionIds (clears all permissions)', async () => {
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.setRolePermissions.mockResolvedValue(undefined);

      await service.assignRolePermissions('tenant-1', 'role-1', []);
      expect(mockRepo.setRolePermissions).toHaveBeenCalledWith('role-1', []);
      expect(mockRepo.findPermissionsByIds).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when role not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.assignRolePermissions('tenant-1', 'ghost', ['p1'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPermissionCatalog', () => {
    it('returns only active permissions by default', async () => {
      const permissions = [
        {
          id: 'p1',
          code: 'admin.users.read',
          name: 'Read',
          description: null,
          module: 'admin',
          resource: 'users',
          action: 'read',
          isActive: true,
        },
      ];
      mockRepo.findAllPermissions.mockResolvedValue(permissions);

      const result = await service.getPermissionCatalog();
      expect(result).toEqual(permissions);
      expect(mockRepo.findAllPermissions).toHaveBeenCalledWith(false);
    });

    it('passes includeInactive flag to repository', async () => {
      mockRepo.findAllPermissions.mockResolvedValue([]);
      await service.getPermissionCatalog(true);
      expect(mockRepo.findAllPermissions).toHaveBeenCalledWith(true);
    });
  });

  describe('duplicateRole', () => {
    it('duplicates role and copies permissions', async () => {
      // Arrange
      const duplicated = {
        ...baseRole,
        id: 'role-2',
        code: 'COPY_ROLE',
        name: 'Copia',
        permissionCount: 3,
      };
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.duplicateRole.mockResolvedValue(duplicated);

      // Act
      const result = await service.duplicateRole('tenant-1', 'role-1', {
        code: 'COPY_ROLE',
        name: 'Copia',
      });

      // Assert
      expect(result).toEqual(duplicated);
      expect(mockRepo.duplicateRole).toHaveBeenCalledWith('tenant-1', 'role-1', {
        code: 'COPY_ROLE',
        name: 'Copia',
      });
    });

    it('throws NotFoundException when source role does not exist', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.duplicateRole('tenant-1', 'ghost', { code: 'NEW_ROLE', name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when new code already exists in tenant', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(baseRoleDetail);
      mockRepo.findByCode.mockResolvedValue({ id: 'existing-role' });

      // Act & Assert
      await expect(
        service.duplicateRole('tenant-1', 'role-1', { code: 'EXISTING', name: 'Dup' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException for invalid code format', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(baseRoleDetail);

      // Act & Assert
      await expect(
        service.duplicateRole('tenant-1', 'role-1', { code: 'invalid_code', name: 'Bad' }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns userCount=0 and does not copy users from source role', async () => {
      // Arrange — source role has 2 active users
      const sourceWithUsers: AdminRoleDetail = { ...baseRoleDetail, userCount: 2 };
      const duplicatedRole: AdminRoleListItem = {
        ...baseRole,
        id: 'role-dup',
        code: 'ROLE_COPY',
        name: 'Copia',
        userCount: 0,
        permissionCount: 3,
      };
      mockRepo.findById.mockResolvedValue(sourceWithUsers);
      mockRepo.findByCode.mockResolvedValue(null);
      mockRepo.duplicateRole.mockResolvedValue(duplicatedRole);

      // Act
      const result = await service.duplicateRole('tenant-1', 'role-1', {
        code: 'ROLE_COPY',
        name: 'Copia',
      });

      // Assert — new role has no users
      expect(result.userCount).toBe(0);
      // Assert — repository duplicateRole is called with role data, never with user-copying calls
      expect(mockRepo.duplicateRole).toHaveBeenCalledWith('tenant-1', 'role-1', {
        code: 'ROLE_COPY',
        name: 'Copia',
      });
      expect(mockRepo.duplicateRole).toHaveBeenCalledTimes(1);
    });
  });

  describe('createPermission', () => {
    const permData = {
      code: 'plant.orders.export',
      name: 'Exportar órdenes',
      module: 'plant',
      resource: 'orders',
      action: 'export',
    };
    const permResult = { ...permData, id: 'p-new', description: null, isActive: true };

    it('creates permission when code is unique', async () => {
      // Arrange
      mockRepo.findPermissionByCode.mockResolvedValue(null);
      mockRepo.createPermission.mockResolvedValue(permResult);

      // Act
      const result = await service.createPermission(permData);

      // Assert
      expect(result).toEqual(permResult);
      expect(mockRepo.createPermission).toHaveBeenCalledWith(permData);
    });

    it('throws ConflictException when code already exists', async () => {
      // Arrange
      mockRepo.findPermissionByCode.mockResolvedValue({ id: 'existing' });

      // Act & Assert
      await expect(service.createPermission(permData)).rejects.toThrow(ConflictException);
    });
  });

  describe('updatePermission', () => {
    const existingPerm = {
      id: 'p1',
      code: 'plant.orders.read',
      name: 'Leer',
      description: null,
      module: 'plant',
      resource: 'orders',
      action: 'read',
      isActive: true,
    };

    it('updates permission when it exists', async () => {
      // Arrange
      mockRepo.findPermissionById.mockResolvedValue(existingPerm);
      const updated = { ...existingPerm, name: 'Leer órdenes' };
      mockRepo.updatePermission.mockResolvedValue(updated);

      // Act
      const result = await service.updatePermission('p1', { name: 'Leer órdenes' });

      // Assert
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when permission does not exist', async () => {
      // Arrange
      mockRepo.findPermissionById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updatePermission('ghost', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivatePermission', () => {
    it('deactivates non-critical permission', async () => {
      // Arrange
      const perm = {
        id: 'p1',
        code: 'plant.orders.export',
        name: 'Export',
        description: null,
        module: 'plant',
        resource: 'orders',
        action: 'export',
        isActive: true,
      };
      mockRepo.findPermissionById.mockResolvedValue(perm);
      mockRepo.deactivatePermission.mockResolvedValue(undefined);

      // Act
      await service.deactivatePermission('p1');

      // Assert
      expect(mockRepo.deactivatePermission).toHaveBeenCalledWith('p1');
    });

    it('throws ConflictException when trying to deactivate admin.roles.manage', async () => {
      // Arrange
      const criticalPerm = {
        id: 'p-crit',
        code: 'admin.roles.manage',
        name: 'Manage Roles',
        description: null,
        module: 'admin',
        resource: 'roles',
        action: 'manage',
        isActive: true,
      };
      mockRepo.findPermissionById.mockResolvedValue(criticalPerm);

      // Act & Assert
      await expect(service.deactivatePermission('p-crit')).rejects.toThrow(ConflictException);
      expect(mockRepo.deactivatePermission).not.toHaveBeenCalled();
    });

    it('throws ConflictException when trying to deactivate admin.roles.read', async () => {
      // Arrange
      const readPerm = {
        id: 'p-read',
        code: 'admin.roles.read',
        name: 'Read Roles',
        description: null,
        module: 'admin',
        resource: 'roles',
        action: 'read',
        isActive: true,
      };
      mockRepo.findPermissionById.mockResolvedValue(readPerm);

      // Act & Assert
      await expect(service.deactivatePermission('p-read')).rejects.toThrow(ConflictException);
      expect(mockRepo.deactivatePermission).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when permission does not exist', async () => {
      // Arrange
      mockRepo.findPermissionById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deactivatePermission('ghost')).rejects.toThrow(NotFoundException);
    });
  });
});
