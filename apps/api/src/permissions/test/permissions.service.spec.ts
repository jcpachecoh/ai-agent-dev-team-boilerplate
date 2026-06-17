import { NotFoundException } from '@nestjs/common';
import { PermissionEffect } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsRepository } from '../repository/permissions.repository';
import { PermissionsService } from '../service/permissions.service';

const TENANT_ID = 'palos-de-lena';
const USER_ID = 'user-1';

const ROLE_OWNER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const ROLE_OPERATOR_ID = 'aaaaaaaa-0000-0000-0000-000000000004';

const OPERATOR_ROLE_PERMISSIONS = ['plant.orders.read', 'supply.items.read'] as const;

const OWNER_ROLE_PERMISSIONS = [
  'mes.users.create',
  'mes.users.role.read',
  'plant.workstations.manage',
  'plant.recipes.manage',
  'plant.orders.read',
  'plant.orders.create',
  'plant.orders.plan',
  'plant.orders.pause',
  'plant.orders.resume',
  'plant.orders.cancel',
  'plant.executions.qa_approve',
  'supply.items.read',
  'supply.items.manage',
] as const;

const activeUser = {
  id: USER_ID,
  tenantId: TENANT_ID,
  roleId: ROLE_OWNER_ID,
  isActive: true,
  deletedAt: null,
};

const repoMock = {
  findUserForPermissionResolution: jest.fn(),
  findPermissionCodesByRoleId: jest.fn(),
  findUserPermissionOverrides: jest.fn(),
};

describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService, { provide: PermissionsRepository, useValue: repoMock }],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  describe('resolveEffectivePermissions', () => {
    describe('role-only resolution', () => {
      it('returns OPERATOR role permissions when no user overrides exist', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue({
          ...activeUser,
          roleId: ROLE_OPERATOR_ID,
        });
        repoMock.findPermissionCodesByRoleId.mockResolvedValue([...OPERATOR_ROLE_PERMISSIONS]);
        repoMock.findUserPermissionOverrides.mockResolvedValue([]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set(OPERATOR_ROLE_PERMISSIONS));
        expect(result.size).toBe(2);
        expect(repoMock.findPermissionCodesByRoleId).toHaveBeenCalledWith(ROLE_OPERATOR_ID);
      });

      it('returns OWNER role permissions when no user overrides exist', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue([...OWNER_ROLE_PERMISSIONS]);
        repoMock.findUserPermissionOverrides.mockResolvedValue([]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set(OWNER_ROLE_PERMISSIONS));
        expect(result.size).toBe(13);
      });

      it('returns an empty set when role has no permissions and no overrides exist', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue([]);
        repoMock.findUserPermissionOverrides.mockResolvedValue([]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set());
        expect(result.size).toBe(0);
      });
    });

    describe('user overrides', () => {
      it('adds a permission granted by user ALLOW override', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue(['plant.orders.read']);
        repoMock.findUserPermissionOverrides.mockResolvedValue([
          { code: 'supply.items.manage', effect: PermissionEffect.ALLOW },
        ]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set(['plant.orders.read', 'supply.items.manage']));
      });

      it('removes a role permission when user DENY override is present', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue([
          'plant.orders.read',
          'supply.items.read',
        ]);
        repoMock.findUserPermissionOverrides.mockResolvedValue([
          { code: 'supply.items.read', effect: PermissionEffect.DENY },
        ]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set(['plant.orders.read']));
      });

      it('applies DENY over user ALLOW for the same permission code', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue([]);
        repoMock.findUserPermissionOverrides.mockResolvedValue([
          { code: 'plant.orders.read', effect: PermissionEffect.ALLOW },
          { code: 'plant.orders.read', effect: PermissionEffect.DENY },
        ]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set());
      });

      it('applies DENY over role grant and user ALLOW for the same permission code', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue(['plant.orders.read']);
        repoMock.findUserPermissionOverrides.mockResolvedValue([
          { code: 'plant.orders.read', effect: PermissionEffect.ALLOW },
          { code: 'plant.orders.read', effect: PermissionEffect.DENY },
        ]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set());
      });
    });

    describe('inactive permissions', () => {
      it('excludes inactive role permissions because repository filters them out', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue(['plant.orders.read']);
        repoMock.findUserPermissionOverrides.mockResolvedValue([]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set(['plant.orders.read']));
        expect(result.has('inactive.permission')).toBe(false);
      });

      it('excludes inactive user ALLOW overrides because repository filters them out', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue(['plant.orders.read']);
        repoMock.findUserPermissionOverrides.mockResolvedValue([]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result.has('supply.items.manage')).toBe(false);
      });
    });

    describe('deduplication', () => {
      it('does not duplicate permission codes when role list contains duplicates', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue([
          'plant.orders.read',
          'plant.orders.read',
          'supply.items.read',
        ]);
        repoMock.findUserPermissionOverrides.mockResolvedValue([]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set(['plant.orders.read', 'supply.items.read']));
        expect(result.size).toBe(2);
      });

      it('does not duplicate permission codes when role and ALLOW override overlap', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
        repoMock.findPermissionCodesByRoleId.mockResolvedValue(['plant.orders.read']);
        repoMock.findUserPermissionOverrides.mockResolvedValue([
          { code: 'plant.orders.read', effect: PermissionEffect.ALLOW },
        ]);

        const result = await service.resolveEffectivePermissions(USER_ID, TENANT_ID);

        expect(result).toEqual(new Set(['plant.orders.read']));
        expect(result.size).toBe(1);
      });
    });

    describe('user validation', () => {
      it('throws NotFoundException when user does not exist', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue(null);

        await expect(service.resolveEffectivePermissions(USER_ID, TENANT_ID)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('throws NotFoundException when user is inactive', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue({
          ...activeUser,
          isActive: false,
        });

        await expect(service.resolveEffectivePermissions(USER_ID, TENANT_ID)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('throws NotFoundException when user is soft-deleted', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue({
          ...activeUser,
          deletedAt: new Date(),
        });

        await expect(service.resolveEffectivePermissions(USER_ID, TENANT_ID)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('throws NotFoundException when tenant does not match user', async () => {
        repoMock.findUserForPermissionResolution.mockResolvedValue({
          ...activeUser,
          tenantId: 'other-tenant',
        });

        await expect(service.resolveEffectivePermissions(USER_ID, TENANT_ID)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.resolveEffectivePermissions(USER_ID, TENANT_ID)).rejects.toThrow(
          'User not found',
        );
      });
    });
  });

  describe('hasPermission', () => {
    it('returns true when permission is in the effective set', async () => {
      repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
      repoMock.findPermissionCodesByRoleId.mockResolvedValue(['plant.orders.read']);
      repoMock.findUserPermissionOverrides.mockResolvedValue([]);

      await expect(service.hasPermission(USER_ID, TENANT_ID, 'plant.orders.read')).resolves.toBe(
        true,
      );
    });

    it('returns false for an unlisted permission code (fail closed)', async () => {
      repoMock.findUserForPermissionResolution.mockResolvedValue(activeUser);
      repoMock.findPermissionCodesByRoleId.mockResolvedValue(['plant.orders.read']);
      repoMock.findUserPermissionOverrides.mockResolvedValue([]);

      await expect(service.hasPermission(USER_ID, TENANT_ID, 'supply.items.manage')).resolves.toBe(
        false,
      );
    });

    it('returns false when user is not found', async () => {
      repoMock.findUserForPermissionResolution.mockResolvedValue(null);

      await expect(service.hasPermission(USER_ID, TENANT_ID, 'plant.orders.read')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
