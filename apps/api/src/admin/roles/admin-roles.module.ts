import { Module } from '@nestjs/common';

import { AdminRolesController } from './controller/admin-roles.controller';
import { AdminRolesRepository } from './repository/admin-roles.repository';
import { AdminRolesResolver } from './resolver/admin-roles.resolver';
import { AdminRolesService } from './service/admin-roles.service';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminRolesController],
  providers: [AdminRolesRepository, AdminRolesService, AdminRolesResolver],
  exports: [AdminRolesService],
})
export class AdminRolesModule {}
