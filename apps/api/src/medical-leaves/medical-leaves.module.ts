import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PayrollModule } from '../payroll/payroll.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { MedicalLeavesController } from './controller/medical-leaves.controller';
import { MedicalLeavesRepository } from './repository/medical-leaves.repository';
import { MedicalLeavesService } from './service/medical-leaves.service';

/** NOM-13 — incapacidades médicas. */
@Module({
  imports: [PrismaModule, AuthModule, PayrollModule, StorageModule],
  controllers: [MedicalLeavesController],
  providers: [MedicalLeavesRepository, MedicalLeavesService],
  exports: [MedicalLeavesRepository, MedicalLeavesService],
})
export class MedicalLeavesModule {}
