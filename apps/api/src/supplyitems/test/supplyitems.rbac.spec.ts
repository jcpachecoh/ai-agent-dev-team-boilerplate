import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import {
  REQUIRED_PERMISSIONS_KEY,
  RequirePermission,
} from '../../common/decorators/require-permission.decorator';
import {
  PERMISSION_DENIED_CODE,
  PERMISSION_DENIED_MESSAGE,
} from '../../common/exceptions/permission-denied.exception';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionsService } from '../../permissions/service/permissions.service';
import { SupplyItemsResolver } from '../resolver/supplyitems.resolver';

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

function mockGqlContext(req: {
  user?: JwtPayload;
  headers?: Record<string, string | string[] | undefined>;
}): ExecutionContext {
  const gqlContext = { req };
  const context = {
    getType: () => 'graphql',
    getHandler: () => SupplyItemsResolver.prototype.supplyItems,
    getClass: () => SupplyItemsResolver,
    gqlContext,
  } as unknown as ExecutionContext;

  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => gqlContext,
  } as ReturnType<typeof GqlExecutionContext.create>);

  return context;
}

describe('SupplyItemsResolver RBAC metadata', () => {
  it('supplyItems requires supply.items.read', () => {
    const permissions = Reflect.getMetadata(
      REQUIRED_PERMISSIONS_KEY,
      SupplyItemsResolver.prototype.supplyItems,
    );
    expect(permissions).toEqual([READ_PERMISSION]);
  });

  it('RequirePermission documents manage code for future mutations', () => {
    @RequirePermission(MANAGE_PERMISSION)
    class FutureMutationHost {}

    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, FutureMutationHost)).toEqual([
      MANAGE_PERMISSION,
    ]);
  });
});

describe('SupplyItems GraphQL PermissionsGuard', () => {
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
    const context = mockGqlContext({
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
    const context = mockGqlContext({
      user: operatorJwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies OPERATOR for supply.items.manage with PERMISSION_DENIED', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === REQUIRED_PERMISSIONS_KEY) return [MANAGE_PERMISSION];
      return undefined;
    });
    permissionsServiceMock.hasPermission.mockImplementation(
      async (_userId: string, _tenantId: string, code: string) => code === READ_PERMISSION,
    );
    const context = mockGqlContext({
      user: operatorJwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      message: PERMISSION_DENIED_MESSAGE,
      extensions: { code: PERMISSION_DENIED_CODE },
    });
  });

  it('returns UNAUTHENTICATED when Authorization is missing', async () => {
    const context = mockGqlContext({ headers: { 'x-tenant-id': TENANT_ID } });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
    expect(permissionsServiceMock.hasPermission).not.toHaveBeenCalled();
  });

  it('denies when x-tenant-id mismatches JWT tenantId', async () => {
    permissionsServiceMock.hasPermission.mockResolvedValue(true);
    const context = mockGqlContext({
      user: ownerJwtUser,
      headers: { 'x-tenant-id': 'other-tenant' },
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      extensions: { code: PERMISSION_DENIED_CODE },
    });
    expect(permissionsServiceMock.hasPermission).not.toHaveBeenCalled();
  });

  it('does not leak permission code in denial message', async () => {
    permissionsServiceMock.hasPermission.mockResolvedValue(false);
    const context = mockGqlContext({ user: ownerJwtUser });

    try {
      await guard.canActivate(context);
      fail('expected permission denial');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      const gqlError = error as GraphQLError;
      expect(gqlError.message).not.toContain(READ_PERMISSION);
      expect(JSON.stringify(gqlError.extensions)).not.toContain(READ_PERMISSION);
    }
  });
});

describe('SupplyItems global JWT vs MES token', () => {
  it('rejects MES-signed token when verified with global JWT secret', async () => {
    const mesSecret = process.env.MES_JWT_SECRET ?? 'mes-dev-secret-change-in-production';
    const globalSecret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';

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
