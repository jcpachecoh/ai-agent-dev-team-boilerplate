import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsController } from './controller/permissions.controller';
import { PermissionsRepository } from './repository/permissions.repository';
import { PermissionsService } from './service/permissions.service';

@Module({
  imports: [PrismaModule],
  controllers: [PermissionsController],
  providers: [PermissionsRepository, PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
