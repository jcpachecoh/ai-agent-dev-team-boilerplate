import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import {
  REQUIRED_PERMISSIONS_KEY,
  RequirePermission,
} from '../../common/decorators/require-permission.decorator';
import {
  PERMISSION_DENIED_MESSAGE,
  PermissionDeniedException,
} from '../../common/exceptions/permission-denied.exception';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionsService } from '../../permissions/service/permissions.service';
import { SupplyItemsController } from '../controller/supplyitems.controller';

const TENANT_ID = 'palos-de-lena';
const READ_PERMISSION = 'supply.items.read';
const MANAGE_PERMISSION = 'supply.items.manage';

const ownerJwtUser: JwtPayload = {
  sub: '11111111-0000-0000-0000-000000000004',
  email: 'mes-owner@palos-de-lena.dev',
  tenantId: TENANT_ID,
  roleId: 'aaaaaaaa-0000-0000-0000-000000000001',
  roleCode: 'OWNER',
};

const operatorJwtUser: JwtPayload = {
  sub: '11111111-0000-0000-0000-000000000005',
  email: 'mes-operator@palos-de-lena.dev',
  tenantId: TENANT_ID,
  roleId: 'aaaaaaaa-0000-0000-0000-000000000004',
  roleCode: 'OPERATOR',
};

const permissionsServiceMock = {
  hasPermission: jest.fn(),
};

function mockHttpContext(
  handler: object,
  req: {
    user?: JwtPayload;
    headers?: Record<string, string | string[] | undefined>;
  },
): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => handler,
    getClass: () => SupplyItemsController,
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe('SupplyItemsController REST RBAC metadata', () => {
  it('applies PermissionsGuard at controller level', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, SupplyItemsController) as unknown[];
    expect(guards).toContain(PermissionsGuard);
  });

  it('findAll and findOne require supply.items.read', () => {
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, SupplyItemsController.prototype.findAll),
    ).toEqual([READ_PERMISSION]);
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, SupplyItemsController.prototype.findOne),
    ).toEqual([READ_PERMISSION]);
  });

  it('write REST routes do not declare @RequirePermission yet', () => {
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, SupplyItemsController.prototype.create),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, SupplyItemsController.prototype.update),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, SupplyItemsController.prototype.remove),
    ).toBeUndefined();
  });

  it('RequirePermission documents manage code for future write routes', () => {
    class FutureWriteHost {
      @RequirePermission(MANAGE_PERMISSION)
      create() {}
    }

    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, FutureWriteHost.prototype.create)).toEqual(
      [MANAGE_PERMISSION],
    );
  });
});

describe('SupplyItems REST PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        Reflector,
        { provide: PermissionsService, useValue: permissionsServiceMock },
      ],
    }).compile();

    guard = module.get(PermissionsGuard);
    reflector = module.get(Reflector);
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === REQUIRED_PERMISSIONS_KEY) return [READ_PERMISSION];
      return undefined;
    });
  });

  it('allows OWNER when hasPermission returns true for supply.items.read', async () => {
    permissionsServiceMock.hasPermission.mockResolvedValue(true);
    const context = mockHttpContext(SupplyItemsController.prototype.findOne, {
      user: ownerJwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(permissionsServiceMock.hasPermission).toHaveBeenCalledWith(
      ownerJwtUser.sub,
      TENANT_ID,
      READ_PERMISSION,
    );
  });

  it('allows OPERATOR when seeded matrix grants supply.items.read only', async () => {
    permissionsServiceMock.hasPermission.mockImplementation(
      async (_userId: string, _tenantId: string, code: string) => code === READ_PERMISSION,
    );
    const context = mockHttpContext(SupplyItemsController.prototype.findAll, {
      user: operatorJwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies OPERATOR for supply.items.manage with PermissionDeniedException', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === REQUIRED_PERMISSIONS_KEY) return [MANAGE_PERMISSION];
      return undefined;
    });
    permissionsServiceMock.hasPermission.mockImplementation(
      async (_userId: string, _tenantId: string, code: string) => code === READ_PERMISSION,
    );
    const context = mockHttpContext(SupplyItemsController.prototype.findOne, {
      user: operatorJwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      message: PERMISSION_DENIED_MESSAGE,
    });
  });

  it('allows OWNER for supply.items.manage when matrix grants manage', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === REQUIRED_PERMISSIONS_KEY) return [MANAGE_PERMISSION];
      return undefined;
    });
    permissionsServiceMock.hasPermission.mockResolvedValue(true);
    const context = mockHttpContext(SupplyItemsController.prototype.findOne, {
      user: ownerJwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(permissionsServiceMock.hasPermission).toHaveBeenCalledWith(
      ownerJwtUser.sub,
      TENANT_ID,
      MANAGE_PERMISSION,
    );
  });

  it('throws UnauthorizedException when user is missing', async () => {
    const context = mockHttpContext(SupplyItemsController.prototype.findOne, {
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(permissionsServiceMock.hasPermission).not.toHaveBeenCalled();
  });

  it('denies when x-tenant-id mismatches JWT tenantId', async () => {
    permissionsServiceMock.hasPermission.mockResolvedValue(true);
    const context = mockHttpContext(SupplyItemsController.prototype.findOne, {
      user: ownerJwtUser,
      headers: { 'x-tenant-id': 'other-tenant' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(PermissionDeniedException);
    expect(permissionsServiceMock.hasPermission).not.toHaveBeenCalled();
  });

  it('does not leak permission code in HTTP denial message', async () => {
    permissionsServiceMock.hasPermission.mockResolvedValue(false);
    const context = mockHttpContext(SupplyItemsController.prototype.findOne, {
      user: ownerJwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    try {
      await guard.canActivate(context);
      throw new Error('expected permission denial');
    } catch (error) {
      expect(error).toBeInstanceOf(PermissionDeniedException);
      expect((error as PermissionDeniedException).message).not.toContain(READ_PERMISSION);
    }
  });
});

describe('SupplyItems REST global JWT vs MES token', () => {
  it('rejects MES-signed token when verified with global JWT secret', async () => {
    const mesSecret = 'auth10-mes-secret-isolated';
    const globalSecret = 'auth10-global-secret-isolated';

    const mesJwt = new JwtService({ secret: mesSecret });
    const globalJwt = new JwtService({ secret: globalSecret });

    const mesToken = await mesJwt.signAsync({
      sub: 'eeeeeeee-0000-0000-0000-000000000005',
      cedulaHash: 'hash',
      role: 'OPERATOR',
      sedeId: null,
      tenantId: TENANT_ID,
    });

    await expect(globalJwt.verifyAsync(mesToken)).rejects.toThrow();
  });
});
