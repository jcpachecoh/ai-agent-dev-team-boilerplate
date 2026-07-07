import { Module } from '@nestjs/common';

import { AdminUsersController } from './controller/admin-users.controller';
import { AdminUsersRepository } from './repository/admin-users.repository';
import { AdminUsersResolver } from './resolver/admin-users.resolver';
import { AdminUsersService } from './service/admin-users.service';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersRepository, AdminUsersService, AdminUsersResolver],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
