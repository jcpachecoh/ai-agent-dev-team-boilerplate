import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import type { JwtPayload } from '../../../auth/interfaces/auth.interfaces';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { PAYROLL_MODULE_ROLES, INVENTORY_MODULE_ROLES, PRODUCCION_MODULE_ROLES } from '../../config/rbac.config';
import {
  PERMISSION_DENIED_CODE,
  PermissionDeniedException,
} from '../../exceptions/permission-denied.exception';
import { RolesGuard } from '../roles.guard';

const TENANT_ID = 'palos-de-lena';

const nominaUser: JwtPayload = {
  sub: 'nomina-user-id',
  email: 'nomina@palos-de-lena.dev',
  tenantId: TENANT_ID,
  roleId: 'role-nomina',
  roleCode: 'NOMINA',
};

const managerUser: JwtPayload = {
  sub: 'manager-user-id',
  email: 'manager@palos-de-lena.dev',
  tenantId: TENANT_ID,
  roleId: 'role-manager',
  roleCode: 'MANAGER',
};

const opsAdminUser: JwtPayload = {
  sub: 'ops-admin-user-id',
  email: 'operations.admin@palos-de-lena.dev',
  tenantId: TENANT_ID,
  roleId: 'role-ops-admin',
  roleCode: 'OPERATIONS_ADMIN',
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
    getClass: () => handler,
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

function mockReflectorRoles(roles: readonly string[]): Reflector {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
    if (key === IS_PUBLIC_KEY) return false;
    if (key === ROLES_KEY) return [...roles];
    return undefined;
  });
  return reflector;
}

describe('RolesGuard', () => {
  it('allows NOMINA on payroll module roles', () => {
    const guard = new RolesGuard(mockReflectorRoles(PAYROLL_MODULE_ROLES));
    const context = mockHttpContext({}, { user: nominaUser });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects NOMINA on inventory module roles', () => {
    const guard = new RolesGuard(mockReflectorRoles(INVENTORY_MODULE_ROLES));
    const context = mockHttpContext({}, { user: nominaUser });

    expect(() => guard.canActivate(context)).toThrow(PermissionDeniedException);
  });

  it('allows MANAGER on inventory module roles', () => {
    const guard = new RolesGuard(mockReflectorRoles(INVENTORY_MODULE_ROLES));
    const context = mockHttpContext({}, { user: managerUser });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows OPERATIONS_ADMIN on produccion module roles', () => {
    const guard = new RolesGuard(mockReflectorRoles(PRODUCCION_MODULE_ROLES));
    const context = mockHttpContext({}, { user: opsAdminUser });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects OPERATIONS_ADMIN on payroll module roles', () => {
    const guard = new RolesGuard(mockReflectorRoles(PAYROLL_MODULE_ROLES));
    const context = mockHttpContext({}, { user: opsAdminUser });

    expect(() => guard.canActivate(context)).toThrow(PermissionDeniedException);
  });

  it('rejects OPERATIONS_ADMIN on inventory module roles', () => {
    const guard = new RolesGuard(mockReflectorRoles(INVENTORY_MODULE_ROLES));
    const context = mockHttpContext({}, { user: opsAdminUser });

    expect(() => guard.canActivate(context)).toThrow(PermissionDeniedException);
  });

  it('rejects NOMINA on produccion module roles', () => {
    const guard = new RolesGuard(mockReflectorRoles(PRODUCCION_MODULE_ROLES));
    const context = mockHttpContext({}, { user: nominaUser });

    expect(() => guard.canActivate(context)).toThrow(PermissionDeniedException);
  });

  it('rejects when x-tenant-id header does not match JWT tenantId', () => {
    const guard = new RolesGuard(mockReflectorRoles(PAYROLL_MODULE_ROLES));
    const context = mockHttpContext(
      {},
      {
        user: nominaUser,
        headers: { 'x-tenant-id': 'other-tenant' },
      },
    );

    expect(() => guard.canActivate(context)).toThrow(PermissionDeniedException);
  });

  it('throws Unauthorized when user is missing', () => {
    const guard = new RolesGuard(mockReflectorRoles(PAYROLL_MODULE_ROLES));
    const context = mockHttpContext({}, {});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('returns GraphQL FORBIDDEN for NOMINA on inventory resolver', () => {
    const reflector = mockReflectorRoles(INVENTORY_MODULE_ROLES);
    const guard = new RolesGuard(reflector);

    const context = {
      getType: () => 'graphql',
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user: nominaUser } }),
    } as unknown as GqlExecutionContext);

    try {
      guard.canActivate(context);
      fail('expected GraphQLError');
    } catch (error) {
      expect(error).toBeInstanceOf(GraphQLError);
      expect((error as GraphQLError).extensions?.code).toBe(PERMISSION_DENIED_CODE);
    }
  });
});
