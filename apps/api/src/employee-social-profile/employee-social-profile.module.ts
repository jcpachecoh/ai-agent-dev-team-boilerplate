import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeeSocialProfileController } from './controller/employee-social-profile.controller';
import { EmployeeSocialProfileRepository } from './repository/employee-social-profile.repository';
import { EmployeeSocialProfileResolver } from './resolver/employee-social-profile.resolver';
import { EmployeeSocialProfileService } from './service/employee-social-profile.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EmployeeSocialProfileController],
  providers: [
    EmployeeSocialProfileService,
    EmployeeSocialProfileRepository,
    EmployeeSocialProfileResolver,
  ],
  exports: [EmployeeSocialProfileService],
})
export class EmployeeSocialProfileModule {}
