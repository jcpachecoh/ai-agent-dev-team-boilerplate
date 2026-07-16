import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { KioskMarkingSession } from '@prisma/client';
import { AuthService } from '../../../auth/service/auth.service';
import { LOCATION_SCOPED_ROLES, SYSTEM_ADMIN_ROLES } from '../../../common/config/rbac.config';
import { UserLocationsService } from '../../../locations/service/user-locations.service';
import { PermissionsService } from '../../../permissions/service/permissions.service';
import type {
  ActivarModoMarcacionKioskoInput,
  IKioskMarkingSessionService,
  KioskTokenContext,
  ModoMarcacionKioskoSessionResult,
  SalirModoMarcacionKioskoInput,
} from '../interfaces/kiosk-marking.interfaces';
import { KIOSK_ACTIVATE_PERMISSION } from '../interfaces/kiosk-marking.interfaces';
import { KioskMarkingRepository } from '../repository/kiosk-marking.repository';
import { KioskMarkingSessionRepository } from '../repository/kiosk-marking-session.repository';

const KIOSK_SESSION_TTL_MS = 20 * 60 * 1000;

@Injectable()
export class KioskMarkingSessionService implements IKioskMarkingSessionService {
  constructor(
    private readonly sessionRepository: KioskMarkingSessionRepository,
    private readonly kioskRepository: KioskMarkingRepository,
    private readonly authService: AuthService,
    private readonly userLocationsService: UserLocationsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async activar(
    input: ActivarModoMarcacionKioskoInput,
    actor: { sub: string; tenantId: string; roleCode: string },
  ): Promise<ModoMarcacionKioskoSessionResult> {
    const locationId = input.locationId.trim();
    const location = await this.kioskRepository.findLocationById(locationId, actor.tenantId);
    if (!location) {
      throw new NotFoundException(`Sede ${locationId} no encontrada`);
    }

    await this.assertCanActivate(actor, locationId);

    const expiresAt = new Date(Date.now() + KIOSK_SESSION_TTL_MS);
    const session = await this.sessionRepository.create({
      tenantId: actor.tenantId,
      locationId,
      activatedByUserId: actor.sub,
      expiresAt,
    });

    const token = await this.authService.issueKioskMarkingToken(
      actor.sub,
      actor.tenantId,
      locationId,
      session.id,
    );

    return {
      accessToken: token.accessToken,
      expiresAt: token.expiresAt,
      locationId,
      sessionId: session.id,
    };
  }

  async salir(input: SalirModoMarcacionKioskoInput, token: KioskTokenContext): Promise<boolean> {
    const passwordOk = await this.authService.verifyUserPassword(token.sub, input.adminPassword);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales de administrador inválidas');
    }

    const revoked = await this.sessionRepository.revokeIfOwned(
      token.sessionId,
      token.tenantId,
      token.sub,
    );
    if (!revoked) {
      throw new NotFoundException('Sesión de modo marcación no encontrada');
    }
    return true;
  }

  getActiveSession(sessionId: string, tenantId: string): Promise<KioskMarkingSession | null> {
    return this.sessionRepository.findById(sessionId, tenantId);
  }

  private async assertCanActivate(
    actor: { sub: string; tenantId: string; roleCode: string },
    locationId: string,
  ): Promise<void> {
    const isSystemAdmin = (SYSTEM_ADMIN_ROLES as readonly string[]).includes(actor.roleCode);
    const hasPermission = await this.permissionsService.hasPermission(
      actor.sub,
      actor.tenantId,
      KIOSK_ACTIVATE_PERMISSION,
    );

    if (!isSystemAdmin && !hasPermission) {
      throw new ForbiddenException('No tiene permiso para activar el modo marcación kiosko');
    }

    const allowedLocationIds = await this.userLocationsService.resolveAllowedLocationIds(
      actor.tenantId,
      { userId: actor.sub, roleCode: actor.roleCode },
    );
    this.userLocationsService.assertLocationAllowed(allowedLocationIds, locationId);

    // LOCATION_SCOPED_ROLES already enforced via resolveAllowedLocationIds; keep reference for clarity
    void LOCATION_SCOPED_ROLES;
  }
}
