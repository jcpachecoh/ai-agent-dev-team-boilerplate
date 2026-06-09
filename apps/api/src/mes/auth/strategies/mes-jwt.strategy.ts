import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { MesJwtPayload } from '../interfaces/mes-auth.interfaces';
import { MesAuthRedisService } from '../service/mes-auth-redis.service';

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

  async validate(
    payload: MesJwtPayload & { jti?: string },
  ): Promise<MesJwtPayload & { jti?: string }> {
    if (payload.jti) {
      const blacklisted = await this.mesAuthRedisService.isTokenBlacklisted(payload.jti);
      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }
    return payload;
  }
}
