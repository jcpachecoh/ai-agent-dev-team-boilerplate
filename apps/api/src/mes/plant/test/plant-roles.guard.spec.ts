import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OperationalRole } from '@prisma/client';
import { MES_ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { PlantRolesGuard } from '../guards/plant-roles.guard';

const mockContext = (user?: { sub?: string; role?: OperationalRole }) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  }) as unknown as ExecutionContext;

describe('PlantRolesGuard', () => {
  let guard: PlantRolesGuard;
  let reflector: Reflector;
  const prismaMock = {
    user: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PlantRolesGuard(reflector, prismaMock as never);
    jest.spyOn(reflector, 'getAllAndOverride');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows when no roles metadata is defined', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    await expect(guard.canActivate(mockContext({ role: OperationalRole.OPERATOR }))).resolves.toBe(
      true,
    );
  });

  it('allows MES JWT user with required operational role', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OperationalRole.SUPERVISOR, OperationalRole.OWNER]);
    const context = mockContext({ sub: 'op-1', role: OperationalRole.SUPERVISOR });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it('allows platform JWT user when global role maps to OWNER', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    prismaMock.user.findFirst.mockResolvedValue({ role: { code: 'OWNER' } });

    const context = mockContext({ sub: 'global-user-1' });
    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'global-user-1', isActive: true, deletedAt: null },
      select: { role: { select: { code: true } } },
    });
  });

  it('denies platform JWT user with OPERATIONS_ADMIN on SUPERVISOR_ROLES endpoints', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OperationalRole.SUPERVISOR, OperationalRole.OWNER]);
    prismaMock.user.findFirst.mockResolvedValue({ role: { code: 'OPERATIONS_ADMIN' } });

    const context = mockContext({ sub: 'ops-admin-1' });
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('allows platform JWT user with OPERATIONS_ADMIN on OPERATIONAL_ROLES endpoints', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      OperationalRole.OWNER,
      OperationalRole.SUPERVISOR,
      OperationalRole.MANAGER,
      OperationalRole.OPERATOR,
    ]);
    prismaMock.user.findFirst.mockResolvedValue({ role: { code: 'OPERATIONS_ADMIN' } });

    const context = mockContext({ sub: 'ops-admin-1' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies when global user is not found', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(mockContext({ sub: 'missing' }))).resolves.toBe(false);
  });

  it('reads metadata from MES_ROLES_KEY', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await guard.canActivate(mockContext());

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(MES_ROLES_KEY, expect.any(Array));
  });

  it('denies when request has no user', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);

    await expect(guard.canActivate(mockContext(undefined))).resolves.toBe(false);
  });

  it('denies platform JWT without sub', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);

    await expect(guard.canActivate(mockContext({}))).resolves.toBe(false);
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it('denies MES JWT user without required role', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([OperationalRole.SUPERVISOR, OperationalRole.OWNER]);
    const context = mockContext({ sub: 'op-1', role: OperationalRole.OPERATOR });

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('denies platform JWT user with unmapped global role', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([OperationalRole.OWNER]);
    prismaMock.user.findFirst.mockResolvedValue({ role: { code: 'UNKNOWN_ROLE' } });

    await expect(guard.canActivate(mockContext({ sub: 'user-1' }))).resolves.toBe(false);
  });
});
