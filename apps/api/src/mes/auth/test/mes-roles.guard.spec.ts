import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OperationalRole } from '@prisma/client';
import { MES_ROLES_KEY, Roles } from '../decorators/roles.decorator';
import { MesRolesGuard } from '../guards/mes-roles.guard';

class TestController {
  @Roles(OperationalRole.OWNER, OperationalRole.SUPERVISOR)
  restrictedEndpoint() {}

  openEndpoint() {}
}

const mockContext = (user?: { role?: OperationalRole; roleCode?: string }) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('Roles decorator', () => {
  const reflector = new Reflector();

  it('stores expected metadata key and roles on the handler', () => {
    const roles = reflector.get<OperationalRole[]>(
      MES_ROLES_KEY,
      TestController.prototype.restrictedEndpoint,
    );

    expect(roles).toEqual([OperationalRole.OWNER, OperationalRole.SUPERVISOR]);
  });

  it('does not set roles metadata when @Roles is not applied', () => {
    const roles = reflector.get<OperationalRole[]>(
      MES_ROLES_KEY,
      TestController.prototype.openEndpoint,
    );

    expect(roles).toBeUndefined();
  });
});

describe('MesRolesGuard', () => {
  let guard: MesRolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new MesRolesGuard(reflector);
    jest.spyOn(reflector, 'getAllAndOverride');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows when no roles metadata is defined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = mockContext({ role: OperationalRole.OPERATOR });

    expect(guard.canActivate(context)).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(MES_ROLES_KEY, expect.any(Array));
  });

  it('allows when user has a required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OperationalRole.SUPERVISOR, OperationalRole.MANAGER]);
    const context = mockContext({ role: OperationalRole.SUPERVISOR });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when user role is not in required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    const context = mockContext({ role: OperationalRole.OPERATOR });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies when request.user is missing', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    const context = mockContext();

    expect(guard.canActivate(context)).toBe(false);
  });

  it('denies when request.user has no role property', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    const context = mockContext({});

    expect(guard.canActivate(context)).toBe(false);
  });

  it('allows access using roleCode fallback when role is absent (global token path)', () => {
    // normaliseMesPayload maps roleCode→role for global tokens, but guard stays defensive
    // and accepts roleCode directly in case the payload arrives before normalisation.
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    const context = mockContext({ roleCode: 'OWNER' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('denies when roleCode fallback does not match required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    const context = mockContext({ roleCode: 'OPERATOR' });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('prefers role over roleCode when both are present', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OperationalRole.OWNER]);
    // role wins — roleCode is ignored
    const context = mockContext({ role: OperationalRole.OWNER, roleCode: 'OPERATOR' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
