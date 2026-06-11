import { Module } from '@nestjs/common';

import { AdminRolesModule } from './roles/admin-roles.module';
import { AdminUsersModule } from './users/admin-users.module';

@Module({
  imports: [AdminUsersModule, AdminRolesModule],
})
export class AdminModule {}
