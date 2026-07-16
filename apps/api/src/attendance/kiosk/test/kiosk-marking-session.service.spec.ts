import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { KioskMarkingSessionService } from '../service/kiosk-marking-session.service';

describe('KioskMarkingSessionService', () => {
  const sessionRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    revokeIfOwned: jest.fn(),
  };
  const kioskRepository = {
    findLocationById: jest.fn(),
  };
  const authService = {
    issueKioskMarkingToken: jest.fn(),
    verifyUserPassword: jest.fn(),
  };
  const userLocationsService = {
    resolveAllowedLocationIds: jest.fn(),
    assertLocationAllowed: jest.fn(),
  };
  const permissionsService = {
    hasPermission: jest.fn(),
  };

  let service: KioskMarkingSessionService;

  const actor = { sub: 'admin-1', tenantId: 't1', roleCode: 'SUPERVISOR' };
  const token = {
    sub: 'admin-1',
    tenantId: 't1',
    locationId: 'loc-1',
    sessionId: 'sess-1',
    roleCode: 'SUPERVISOR',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new KioskMarkingSessionService(
      sessionRepository as never,
      kioskRepository as never,
      authService as never,
      userLocationsService as never,
      permissionsService as never,
    );
    kioskRepository.findLocationById.mockResolvedValue({ id: 'loc-1' });
    permissionsService.hasPermission.mockResolvedValue(true);
    userLocationsService.resolveAllowedLocationIds.mockResolvedValue(['loc-1']);
    sessionRepository.create.mockResolvedValue({
      id: 'sess-1',
      tenantId: 't1',
      locationId: 'loc-1',
      activatedByUserId: 'admin-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    authService.issueKioskMarkingToken.mockResolvedValue({
      accessToken: 'kiosk-token',
      expiresAt: new Date(Date.now() + 60_000),
    });
  });

  describe('activar', () => {
    it('crea sesión y emite token scoped', async () => {
      const result = await service.activar({ locationId: '  loc-1  ' }, actor);

      expect(result).toEqual(
        expect.objectContaining({
          accessToken: 'kiosk-token',
          locationId: 'loc-1',
          sessionId: 'sess-1',
        }),
      );
      expect(authService.issueKioskMarkingToken).toHaveBeenCalledWith(
        'admin-1',
        't1',
        'loc-1',
        'sess-1',
      );
      expect(userLocationsService.assertLocationAllowed).toHaveBeenCalledWith(['loc-1'], 'loc-1');
    });

    it('404 si la sede no existe', async () => {
      kioskRepository.findLocationById.mockResolvedValue(null);
      await expect(service.activar({ locationId: 'loc-x' }, actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('403 sin permiso ni rol system admin', async () => {
      permissionsService.hasPermission.mockResolvedValue(false);
      await expect(
        service.activar({ locationId: 'loc-1' }, { ...actor, roleCode: 'OPERATOR' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite OWNER aunque hasPermission sea false', async () => {
      permissionsService.hasPermission.mockResolvedValue(false);
      userLocationsService.resolveAllowedLocationIds.mockResolvedValue(null);

      await expect(
        service.activar({ locationId: 'loc-1' }, { ...actor, roleCode: 'OWNER' }),
      ).resolves.toEqual(expect.objectContaining({ sessionId: 'sess-1' }));
    });
  });

  describe('salir', () => {
    it('revoca sesión con password correcto', async () => {
      authService.verifyUserPassword.mockResolvedValue(true);
      sessionRepository.revokeIfOwned.mockResolvedValue({ id: 'sess-1', revokedAt: new Date() });

      await expect(service.salir({ adminPassword: 'secret' }, token)).resolves.toBe(true);
      expect(sessionRepository.revokeIfOwned).toHaveBeenCalledWith('sess-1', 't1', 'admin-1');
    });

    it('401 con password incorrecto', async () => {
      authService.verifyUserPassword.mockResolvedValue(false);
      await expect(service.salir({ adminPassword: 'bad' }, token)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessionRepository.revokeIfOwned).not.toHaveBeenCalled();
    });

    it('404 si la sesión no existe o no es del activador', async () => {
      authService.verifyUserPassword.mockResolvedValue(true);
      sessionRepository.revokeIfOwned.mockResolvedValue(null);
      await expect(service.salir({ adminPassword: 'secret' }, token)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  it('getActiveSession delega al repository', async () => {
    sessionRepository.findById.mockResolvedValue({ id: 'sess-1' });
    await expect(service.getActiveSession('sess-1', 't1')).resolves.toEqual({ id: 'sess-1' });
  });
});
