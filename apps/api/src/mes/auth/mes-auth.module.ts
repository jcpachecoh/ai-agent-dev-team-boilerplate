import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { MesAuthController } from './controller/mes-auth.controller';
import { MesJwtGuard } from './guards/mes-jwt.guard';
import { MesRolesGuard } from './guards/mes-roles.guard';
import { MesAuthRepository } from './repository/mes-auth.repository';
import { MesAuthRedisService } from './service/mes-auth-redis.service';
import { MesAuthService } from './service/mes-auth.service';
import { MesJwtStrategy } from './strategies/mes-jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret:
        process.env.MES_JWT_SECRET ??
        process.env.JWT_SECRET ??
        'mes-dev-secret-change-in-production',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [MesAuthController],
  providers: [
    MesAuthRepository,
    MesAuthRedisService,
    MesAuthService,
    MesJwtStrategy,
    MesJwtGuard,
    MesRolesGuard,
  ],
})
export class MesAuthModule {}
