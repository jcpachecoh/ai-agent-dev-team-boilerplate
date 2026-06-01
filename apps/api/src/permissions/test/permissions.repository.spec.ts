import { PermissionEffect } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionsRepository } from '../repository/permissions.repository';

const TENANT_ID = 'palos-de-lena';
const USER_ID = 'user-1';
const ROLE_ID = 'role-owner';

const prismaMock = {
  user: {
    findFirst: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
  },
  rolePermission: {
    findMany: jest.fn(),
  },
  userPermission: {
    findMany: jest.fn(),
  },
};

describe('PermissionsRepository', () => {
  let repository: PermissionsRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = module.get<PermissionsRepository>(PermissionsRepository);
  });

  describe('findUserForPermissionResolution', () => {
    it('scopes lookup by user id and tenant id', async () => {
      const user = {
        id: USER_ID,
        tenantId: TENANT_ID,
        roleId: ROLE_ID,
        isActive: true,
        deletedAt: null,
      };
      prismaMock.user.findFirst.mockResolvedValue(user);

      const result = await repository.findUserForPermissionResolution(USER_ID, TENANT_ID);

      expect(result).toEqual(user);
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: USER_ID, tenantId: TENANT_ID },
        select: {
          id: true,
          tenantId: true,
          roleId: true,
          isActive: true,
          deletedAt: true,
        },
      });
    });

    it('returns null when user is not found for tenant', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const result = await repository.findUserForPermissionResolution(USER_ID, 'other-tenant');

      expect(result).toBeNull();
    });
  });

  describe('findPermissionCodesByRoleId', () => {
    it('returns active permission codes for an active role', async () => {
      prismaMock.role.findUnique.mockResolvedValue({ isActive: true });
      prismaMock.rolePermission.findMany.mockResolvedValue([
        { permission: { code: 'plant.orders.read' } },
        { permission: { code: 'supply.items.read' } },
      ]);

      const result = await repository.findPermissionCodesByRoleId(ROLE_ID);

      expect(result).toEqual(['plant.orders.read', 'supply.items.read']);
      expect(prismaMock.rolePermission.findMany).toHaveBeenCalledWith({
        where: {
          roleId: ROLE_ID,
          permission: { isActive: true },
        },
        select: {
          permission: {
            select: { code: true },
          },
        },
      });
    });

    it('returns an empty list when role is inactive', async () => {
      prismaMock.role.findUnique.mockResolvedValue({ isActive: false });

      const result = await repository.findPermissionCodesByRoleId(ROLE_ID);

      expect(result).toEqual([]);
      expect(prismaMock.rolePermission.findMany).not.toHaveBeenCalled();
    });

    it('returns an empty list when role does not exist', async () => {
      prismaMock.role.findUnique.mockResolvedValue(null);

      const result = await repository.findPermissionCodesByRoleId(ROLE_ID);

      expect(result).toEqual([]);
      expect(prismaMock.rolePermission.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findUserPermissionOverrides', () => {
    it('returns active user permission overrides with effect', async () => {
      prismaMock.userPermission.findMany.mockResolvedValue([
        {
          effect: PermissionEffect.ALLOW,
          permission: { code: 'supply.items.manage' },
        },
        {
          effect: PermissionEffect.DENY,
          permission: { code: 'plant.orders.read' },
        },
      ]);

      const result = await repository.findUserPermissionOverrides(USER_ID);

      expect(result).toEqual([
        { code: 'supply.items.manage', effect: PermissionEffect.ALLOW },
        { code: 'plant.orders.read', effect: PermissionEffect.DENY },
      ]);
      expect(prismaMock.userPermission.findMany).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          permission: { isActive: true },
        },
        select: {
          effect: true,
          permission: {
            select: { code: true },
          },
        },
      });
    });
  });
});
