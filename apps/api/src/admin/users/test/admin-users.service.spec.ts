import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { DocumentType, PermissionEffect } from '@prisma/client';
import { EmailService } from '@restopsiq/email';

import type { AdminUserDetail, AdminUserListItem } from '../interfaces/admin-users.interfaces';
import { AdminUsersRepository } from '../repository/admin-users.repository';
import { AdminUsersService } from '../service/admin-users.service';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByCedula: jest.fn(),
  findRoleCode: jest.fn(),
  create: jest.fn(),
  createWithEmployeeDetails: jest.fn(),
  update: jest.fn(),
  deactivate: jest.fn(),
  setUserPermissionOverrides: jest.fn(),
};

const mockEmailService = {
  send: jest.fn().mockResolvedValue({ jobId: 'test-job' }),
};

const baseUser: AdminUserListItem = {
  id: 'user-1',
  tenantId: 'tenant-1',
  cedula: '12345678',
  documentType: DocumentType.CC,
  email: 'test@test.com',
  role: { id: 'role-1', code: 'OPERATOR', name: 'Operator' },
  isActive: true,
  emailVerified: false,
  lastLoginAt: null,
  createdAt: new Date(),
};

const baseUserDetail: AdminUserDetail = {
  ...baseUser,
  loginAttempts: 0,
  lockedUntil: null,
  passwordChangedAt: null,
  createdBy: null,
};

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: AdminUsersRepository, useValue: mockRepo },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  describe('createUser', () => {
    it('creates user with employee details and returns list item', async () => {
      process.env.OPERATOR_TEMP_PASSWORD = '1234';
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.findByCedula.mockResolvedValue(null);
      mockRepo.findRoleCode.mockResolvedValue('OPERATOR');
      mockRepo.createWithEmployeeDetails.mockResolvedValue(baseUser);

      const result = await service.createUser(
        'tenant-1',
        {
          name: 'Juan Pérez',
          cedula: '12345678',
          documentType: DocumentType.CC,
          email: 'test@test.com',
          roleId: 'role-1',
        },
        'requester-1',
      );

      expect(result).toEqual(baseUser);
      expect(mockRepo.createWithEmployeeDetails).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          name: 'Juan Pérez',
          cedula: '12345678',
          email: 'test@test.com',
          roleId: 'role-1',
          createdBy: 'requester-1',
        }),
      );
    });

    it('throws ConflictException on duplicate email', async () => {
      mockRepo.findByEmail.mockResolvedValue({ id: 'existing' });
      mockRepo.findByCedula.mockResolvedValue(null);

      await expect(
        service.createUser(
          'tenant-1',
          {
            name: 'Test',
            cedula: '99',
            documentType: DocumentType.CC,
            email: 'dup@test.com',
            roleId: 'r1',
          },
          'req',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on duplicate cedula', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.findByCedula.mockResolvedValue({ id: 'existing' });

      await expect(
        service.createUser(
          'tenant-1',
          {
            name: 'Test',
            cedula: '99',
            documentType: DocumentType.CC,
            email: 'new@test.com',
            roleId: 'r1',
          },
          'req',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateUser', () => {
    it('deactivates user', async () => {
      mockRepo.findById.mockResolvedValue(baseUserDetail);
      mockRepo.deactivate.mockResolvedValue(undefined);

      await service.deactivateUser('tenant-1', 'user-1', 'requester-1');

      expect(mockRepo.deactivate).toHaveBeenCalledWith('tenant-1', 'user-1');
    });

    it('throws ForbiddenException when deactivating own account', async () => {
      await expect(service.deactivateUser('tenant-1', 'self-id', 'self-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws NotFoundException when user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deactivateUser('tenant-1', 'ghost', 'requester')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('throws ForbiddenException when changing own role', async () => {
      await expect(
        service.updateUser('tenant-1', 'self', { roleId: 'new-role' }, 'self'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('updates user successfully', async () => {
      const updated = { ...baseUser, email: 'new@test.com' };
      mockRepo.findById.mockResolvedValue(baseUserDetail);
      mockRepo.update.mockResolvedValue(updated);

      const result = await service.updateUser(
        'tenant-1',
        'user-1',
        { email: 'new@test.com' },
        'other',
      );
      expect(result.email).toBe('new@test.com');
    });
  });

  describe('assignUserPermissions', () => {
    it('calls setUserPermissionOverrides with replace-all semantics', async () => {
      mockRepo.findById.mockResolvedValue(baseUserDetail);
      mockRepo.setUserPermissionOverrides.mockResolvedValue(undefined);

      const overrides = [{ permissionId: 'p1', effect: PermissionEffect.ALLOW }];
      await service.assignUserPermissions('tenant-1', 'user-1', overrides);

      expect(mockRepo.setUserPermissionOverrides).toHaveBeenCalledWith('user-1', overrides);
    });

    it('throws NotFoundException if user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.assignUserPermissions('tenant-1', 'ghost', [])).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
