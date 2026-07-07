import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EncryptionService } from '../common/services/encryption.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployeeFinancialProfileController } from './controller/employee-financial-profile.controller';
import { EmployeeFinancialProfileRepository } from './repository/employee-financial-profile.repository';
import { EmployeeFinancialProfileResolver } from './resolver/employee-financial-profile.resolver';
import { EmployeeFinancialProfileService } from './service/employee-financial-profile.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [EmployeeFinancialProfileController],
  providers: [
    EmployeeFinancialProfileService,
    EmployeeFinancialProfileRepository,
    EmployeeFinancialProfileResolver,
    EncryptionService,
  ],
  exports: [EmployeeFinancialProfileService],
})
export class EmployeeFinancialProfileModule {}
