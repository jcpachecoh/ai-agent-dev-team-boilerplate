import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DataConsentModule } from '../data-consent/data-consent.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeePersonalDataController } from './controller/employee-personal-data.controller';
import { EmployeePersonalDataRepository } from './repository/employee-personal-data.repository';
import { EmployeePersonalDataService } from './service/employee-personal-data.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, DataConsentModule],
  controllers: [EmployeePersonalDataController],
  providers: [EmployeePersonalDataService, EmployeePersonalDataRepository],
  exports: [EmployeePersonalDataService],
})
export class EmployeePersonalDataModule {}
