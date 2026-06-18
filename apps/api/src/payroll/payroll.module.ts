import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollController } from './controller/payroll.controller';
import { EmployeeCatalogController } from './controller/employee-catalog.controller';
import { PayrollService } from './service/payroll.service';
import { EmployeeCatalogService } from './service/employee-catalog.service';
import { PayrollRepository } from './repository/payroll.repository';
import { EmployeeCatalogRepository } from './repository/employee-catalog.repository';
import { EmployeesResolver } from './resolver/employees.resolver';
import { PayrollCalculationService } from './service/payroll-calculation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PayrollController, EmployeeCatalogController],
  providers: [
    PayrollService,
    PayrollRepository,
    EmployeeCatalogService,
    EmployeeCatalogRepository,
    EmployeesResolver,
    PayrollCalculationService,
  ],
  exports: [PayrollService, PayrollCalculationService, EmployeeCatalogService],
})
export class PayrollModule {}
