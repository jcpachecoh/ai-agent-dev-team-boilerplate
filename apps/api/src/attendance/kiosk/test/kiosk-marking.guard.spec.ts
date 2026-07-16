import { ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../../../common/decorators/require-permission.decorator';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { PermissionDeniedException } from '../../../common/exceptions/permission-denied.exception';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { KioskMarkingGuard } from '../guard/kiosk-marking.guard';

describe('Kiosk marking token rejection', () => {
  const kioskUser = {
    sub: 'admin-1',
    email: 'a@b.com',
    tenantId: 't1',
    roleId: 'r1',
    roleCode: 'SUPERVISOR',
    locationId: 'loc-1',
    tokenType: 'KIOSK_MARKING' as const,
    sessionId: 'sess-1',
  };

  function mockHttpContext(user: unknown): ExecutionContext {
    return {
      getType: () => 'http',
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('PermissionsGuard rechaza token KIOSK_MARKING en endpoints con permiso', async () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === REQUIRED_PERMISSIONS_KEY) return ['attendance.overtime.read'];
        return undefined;
      }),
    };
    const permissionsService = { hasPermission: jest.fn() };
    const guard = new PermissionsGuard(reflector as never, permissionsService as never);

    await expect(guard.canActivate(mockHttpContext(kioskUser))).rejects.toBeInstanceOf(
      PermissionDeniedException,
    );
    expect(permissionsService.hasPermission).not.toHaveBeenCalled();
  });

  it('RolesGuard rechaza token KIOSK_MARKING', () => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === IS_PUBLIC_KEY) return false;
        if (key === ROLES_KEY) return ['SUPERVISOR'];
        return undefined;
      }),
    };
    const guard = new RolesGuard(reflector as never);

    expect(() => guard.canActivate(mockHttpContext(kioskUser))).toThrow(PermissionDeniedException);
  });

  it('KioskMarkingGuard exige sesión activa no revocada', async () => {
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'sess-1',
        tenantId: 't1',
        locationId: 'loc-1',
        activatedByUserId: 'admin-1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      }),
    };
    const guard = new KioskMarkingGuard(sessionRepository as never);

    await expect(guard.canActivate(mockHttpContext(kioskUser))).resolves.toBe(true);

    sessionRepository.findById.mockResolvedValue({
      id: 'sess-1',
      tenantId: 't1',
      locationId: 'loc-1',
      activatedByUserId: 'admin-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: new Date(),
    });

    await expect(guard.canActivate(mockHttpContext(kioskUser))).rejects.toThrow();
  });

  it('KioskMarkingGuard rechaza token de sesión normal', async () => {
    const guard = new KioskMarkingGuard({ findById: jest.fn() } as never);
    await expect(
      guard.canActivate(
        mockHttpContext({
          sub: 'admin-1',
          tenantId: 't1',
          roleCode: 'SUPERVISOR',
          roleId: 'r1',
          email: 'a@b.com',
        }),
      ),
    ).rejects.toThrow();
  });

  it('KioskMarkingGuard rechaza sesión expirada', async () => {
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'sess-1',
        tenantId: 't1',
        locationId: 'loc-1',
        activatedByUserId: 'admin-1',
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
      }),
    };
    const guard = new KioskMarkingGuard(sessionRepository as never);
    await expect(guard.canActivate(mockHttpContext(kioskUser))).rejects.toThrow();
  });

  it('KioskMarkingGuard rechaza sede distinta a la sesión', async () => {
    const sessionRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'sess-1',
        tenantId: 't1',
        locationId: 'other-loc',
        activatedByUserId: 'admin-1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      }),
    };
    const guard = new KioskMarkingGuard(sessionRepository as never);
    await expect(guard.canActivate(mockHttpContext(kioskUser))).rejects.toThrow();
  });
});
