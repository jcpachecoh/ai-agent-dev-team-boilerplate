import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { OperationalRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { MesJwtPayload } from '../interfaces/mes-auth.interfaces';
import { MesAuthRedisService } from '../service/mes-auth-redis.service';

/** Union of MES and global JWT payload shapes that this strategy accepts. */
export type MesOrGlobalJwtPayload = (MesJwtPayload | GlobalJwtPayload) & { jti?: string };

interface GlobalJwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roleId: string;
  roleCode: string;
}

/** Normalises a raw JWT payload (MES or global) into the shape MES guards expect. */
export function normaliseMesPayload(raw: MesOrGlobalJwtPayload): MesJwtPayload & { jti?: string } {
  if ('role' in raw) {
    return raw as MesJwtPayload & { jti?: string };
  }

  const global = raw as GlobalJwtPayload & { jti?: string };
  const role = Object.values(OperationalRole).includes(global.roleCode as OperationalRole)
    ? (global.roleCode as OperationalRole)
    : null;

  return {
    sub: global.sub,
    tenantId: global.tenantId,
    cedulaHash: '',
    role: role as OperationalRole,
    locationId: null,
    jti: global.jti,
  };
}

@Injectable()
export class MesJwtStrategy extends PassportStrategy(Strategy, 'mes-jwt') {
  constructor(private readonly mesAuthRedisService: MesAuthRedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.MES_JWT_SECRET ??
        process.env.JWT_SECRET ??
        'mes-dev-secret-change-in-production',
    });
  }

  async validate(payload: MesOrGlobalJwtPayload): Promise<MesJwtPayload & { jti?: string }> {
    if (payload.jti) {
      const blacklisted = await this.mesAuthRedisService.isTokenBlacklisted(payload.jti);
      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    return normaliseMesPayload(payload);
  }
}
