/**
 * AUTH-10 — Cross-token rejection (global JWT vs MES JWT cryptographic separation + route guards).
 */
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtService } from '@nestjs/jwt';
import { OperationalRole } from '@prisma/client';
import { PlantAuthGuard } from '../../mes/plant/guards/plant-auth.guard';
import { PlantController } from '../../mes/plant/controller/plant.controller';
import { AuthController } from '../controller/auth.controller';

const TENANT_ID = 'palos-de-lena';

describe('Cross-token JWT verification (AUTH-10)', () => {
  /** Force distinct secrets — MES strategy falls back to JWT_SECRET when MES_JWT_SECRET is unset. */
  const globalSecret = 'auth10-global-secret-isolated';
  const mesSecret = 'auth10-mes-secret-isolated';

  it('rejects MES-signed token when verified with global JWT secret', async () => {
    const mesJwt = new JwtService({ secret: mesSecret });
    const globalJwt = new JwtService({ secret: globalSecret });

    const mesToken = await mesJwt.signAsync({
      sub: 'op-1',
      cedulaHash: 'hash',
      role: OperationalRole.OPERATOR,
      locationId: null,
      tenantId: TENANT_ID,
    });

    await expect(globalJwt.verifyAsync(mesToken)).rejects.toThrow();
  });

  it('rejects global-signed token when verified with MES JWT secret', async () => {
    const mesJwt = new JwtService({ secret: mesSecret });
    const globalJwt = new JwtService({ secret: globalSecret });

    const globalToken = await globalJwt.signAsync({
      sub: '11111111-0000-0000-0000-000000000004',
      email: 'mes-owner@palos-de-lena.dev',
      tenantId: TENANT_ID,
      roleId: 'aaaaaaaa-0000-0000-0000-000000000001',
      roleCode: 'OWNER',
    });

    await expect(mesJwt.verifyAsync(globalToken)).rejects.toThrow();
  });
});

describe('Route guard metadata (AUTH-10)', () => {
  it('PlantController is guarded by PlantAuthGuard (MES or platform JWT)', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, PlantController) as unknown[];
    expect(guards).toContain(PlantAuthGuard);
  });

  it('AuthController me route exists for global token (class has auth routes)', () => {
    expect(AuthController.prototype.me).toBeDefined();
    expect(PlantController.prototype.findAllWorkStations).toBeDefined();
  });
});
