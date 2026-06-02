import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthRepository } from './repository/auth.repository';
import { AuthService } from './service/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GqlAuthGuard } from './guards/gql-auth.guard';
import { AuthResolver } from './resolver/auth.resolver';
import { env } from '../config/env';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: env.JWT_SECRET,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signOptions: { expiresIn: env.JWT_EXPIRES_IN as any },
    }),
  ],
  providers: [AuthRepository, AuthService, JwtStrategy, GqlAuthGuard, AuthResolver],
  exports: [AuthService, GqlAuthGuard],
})
export class AuthModule {}
