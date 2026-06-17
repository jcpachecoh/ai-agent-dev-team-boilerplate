import { Module } from '@nestjs/common';

import { AdminRolesModule } from './roles/admin-roles.module';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminController } from './controller/admin.controller';
import { AdminRepository } from './repository/admin.repository';
import { AdminService } from './service/admin.service';

@Module({
  controllers: [AdminController],
  imports: [AdminUsersModule, AdminRolesModule],
  providers: [AdminRepository, AdminService],
})
export class AdminModule {}
