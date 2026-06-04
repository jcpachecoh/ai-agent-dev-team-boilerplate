import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthController } from './controller/auth.controller';
import { AuthResolver } from './resolver/auth.resolver';
import { AuthService } from './service/auth.service';
import { AuthEmailService } from './service/auth-email.service';
import { AuthRepository } from './repository/auth.repository';
import { AuthEmailRepository } from './repository/auth-email.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GqlJwtRefreshGuard } from './guards/gql-jwt-refresh.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    PermissionsModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthEmailRepository,
    AuthService,
    AuthEmailService,
    AuthResolver,
    GqlJwtRefreshGuard,
    JwtStrategy,
    JwtRefreshStrategy,
    PermissionsGuard,
  ],
  exports: [AuthService, PermissionsGuard, PermissionsModule],
})
export class AuthModule {}
