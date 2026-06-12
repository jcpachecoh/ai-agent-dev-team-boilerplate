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
  setRolePermissions: jest.fn(),
  findAllPermissions: jest.fn(),
  findPermissionsByIds: jest.fn(),
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
    it('returns only active permissions', async () => {
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
    });
  });
});
