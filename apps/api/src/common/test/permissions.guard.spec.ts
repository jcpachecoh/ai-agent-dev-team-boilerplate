import { ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLError } from 'graphql';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  REQUIRED_PERMISSIONS_KEY,
  RequirePermission,
  RequirePermissions,
} from '../decorators/require-permission.decorator';
import {
  PERMISSION_DENIED_CODE,
  PERMISSION_DENIED_MESSAGE,
  PermissionDeniedException,
} from '../exceptions/permission-denied.exception';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PermissionsService } from '../../permissions/service/permissions.service';

const TENANT_ID = 'palos-de-lena';

const jwtUser: JwtPayload = {
  sub: 'user-1',
  email: 'user@example.com',
  tenantId: TENANT_ID,
  roleId: 'role-1',
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
    getHandler: () => ({}),
    getClass: () => ({}),
    gqlContext,
  } as ExecutionContext & { gqlContext: typeof gqlContext };

  jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
    getContext: () => gqlContext,
  } as ReturnType<typeof GqlExecutionContext.create>);

  return context;
}

function mockHttpContext(req: {
  user?: JwtPayload;
  headers?: Record<string, string | string[] | undefined>;
}): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('RequirePermission decorators', () => {
  it('RequirePermission sets a single code in metadata', () => {
    @RequirePermission('supply.items.read')
    class Host {}

    const permissions = Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, Host);
    expect(permissions).toEqual(['supply.items.read']);
  });

  it('RequirePermissions sets multiple codes with AND semantics', () => {
    @RequirePermissions('supply.items.read', 'supply.items.manage')
    class Host {}

    const permissions = Reflect.getMetadata(REQUIRED_PERMISSIONS_KEY, Host);
    expect(permissions).toEqual(['supply.items.read', 'supply.items.manage']);
  });
});

describe('PermissionsGuard', () => {
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
  });

  const stubPermissions = (permissions: string[] | undefined, isPublic = false) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return isPublic;
      if (key === REQUIRED_PERMISSIONS_KEY) return permissions;
      return undefined;
    });
  };

  it('allows when no permissions metadata is set', async () => {
    stubPermissions(undefined);
    const context = mockGqlContext({ user: jwtUser });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(permissionsServiceMock.hasPermission).not.toHaveBeenCalled();
  });

  it('skips enforcement for @Public() routes', async () => {
    stubPermissions(['supply.items.read'], true);
    const context = mockGqlContext({ user: jwtUser });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(permissionsServiceMock.hasPermission).not.toHaveBeenCalled();
  });

  it('allows when user has the required permission', async () => {
    stubPermissions(['supply.items.read']);
    permissionsServiceMock.hasPermission.mockResolvedValue(true);
    const context = mockGqlContext({
      user: jwtUser,
      headers: { 'x-tenant-id': TENANT_ID },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(permissionsServiceMock.hasPermission).toHaveBeenCalledWith(
      jwtUser.sub,
      TENANT_ID,
      'supply.items.read',
    );
  });

  it('denies with PERMISSION_DENIED when user lacks permission', async () => {
    stubPermissions(['supply.items.manage']);
    permissionsServiceMock.hasPermission.mockResolvedValue(false);
    const context = mockGqlContext({ user: jwtUser });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      message: PERMISSION_DENIED_MESSAGE,
      extensions: { code: PERMISSION_DENIED_CODE },
    });
    expect(permissionsServiceMock.hasPermission).toHaveBeenCalled();
  });

  it('does not leak permission code in GraphQL denial message', async () => {
    stubPermissions(['supply.items.manage']);
    permissionsServiceMock.hasPermission.mockResolvedValue(false);
    const context = mockGqlContext({ user: jwtUser });

    try {
      await guard.canActivate(context);
      fail('expected permission denial');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      const gqlError = error as GraphQLError;
      expect(gqlError.message).toBe(PERMISSION_DENIED_MESSAGE);
      expect(gqlError.message).not.toContain('supply.items.manage');
      expect(JSON.stringify(gqlError.extensions)).not.toContain('supply.items.manage');
    }
  });

  it('denies when unauthenticated on GraphQL', async () => {
    stubPermissions(['supply.items.read']);
    const context = mockGqlContext({ headers: { 'x-tenant-id': TENANT_ID } });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('denies when unauthenticated on HTTP', async () => {
    stubPermissions(['supply.items.read']);
    const context = mockHttpContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('denies when JWT tenantId is missing', async () => {
    stubPermissions(['supply.items.read']);
    const context = mockGqlContext({
      user: { ...jwtUser, tenantId: '' },
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('denies when x-tenant-id mismatches JWT tenantId', async () => {
    stubPermissions(['supply.items.read']);
    permissionsServiceMock.hasPermission.mockResolvedValue(true);
    const context = mockGqlContext({
      user: jwtUser,
      headers: { 'x-tenant-id': 'other-tenant' },
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      message: PERMISSION_DENIED_MESSAGE,
      extensions: { code: PERMISSION_DENIED_CODE },
    });
    expect(permissionsServiceMock.hasPermission).not.toHaveBeenCalled();
  });

  it('requires all permissions when multiple are declared (AND)', async () => {
    stubPermissions(['supply.items.read', 'supply.items.manage']);
    permissionsServiceMock.hasPermission.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const context = mockGqlContext({ user: jwtUser });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      extensions: { code: PERMISSION_DENIED_CODE },
    });
    expect(permissionsServiceMock.hasPermission).toHaveBeenCalledTimes(2);
  });

  it('maps PermissionsService NotFoundException to permission denied', async () => {
    stubPermissions(['supply.items.read']);
    permissionsServiceMock.hasPermission.mockRejectedValue(new NotFoundException('User not found'));
    const context = mockGqlContext({ user: jwtUser });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      extensions: { code: PERMISSION_DENIED_CODE },
    });
  });

  it('rethrows unexpected errors from PermissionsService', async () => {
    stubPermissions(['supply.items.read']);
    permissionsServiceMock.hasPermission.mockRejectedValue(new Error('database down'));
    const context = mockGqlContext({ user: jwtUser });

    await expect(guard.canActivate(context)).rejects.toThrow('database down');
  });

  it('throws PermissionDeniedException on HTTP when permission is missing', async () => {
    stubPermissions(['supply.items.read']);
    permissionsServiceMock.hasPermission.mockResolvedValue(false);
    const context = mockHttpContext({ user: jwtUser });

    await expect(guard.canActivate(context)).rejects.toThrow(PermissionDeniedException);
  });
});
