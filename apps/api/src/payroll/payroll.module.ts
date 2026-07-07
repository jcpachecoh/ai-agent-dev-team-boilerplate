import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollController } from './controller/payroll.controller';
import { EmployeeCatalogController } from './controller/employee-catalog.controller';
import { EmployeePositionsController } from './controller/employee-positions.controller';
import { PayrollService } from './service/payroll.service';
import { EmployeeCatalogService } from './service/employee-catalog.service';
import { EmployeePositionsService } from './service/employee-positions.service';
import { PayrollRepository } from './repository/payroll.repository';
import { EmployeeCatalogRepository } from './repository/employee-catalog.repository';
import { EmployeePositionsRepository } from './repository/employee-positions.repository';
import { EmployeesResolver } from './resolver/employees.resolver';
import { EmployeePositionsResolver } from './resolver/employee-positions.resolver';
import { PayrollCalculationService } from './service/payroll-calculation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PayrollController, EmployeeCatalogController, EmployeePositionsController],
  providers: [
    PayrollService,
    PayrollRepository,
    EmployeeCatalogService,
    EmployeeCatalogRepository,
    EmployeePositionsService,
    EmployeePositionsRepository,
    EmployeesResolver,
    EmployeePositionsResolver,
    PayrollCalculationService,
  ],
  exports: [
    PayrollService,
    PayrollCalculationService,
    EmployeeCatalogService,
    EmployeePositionsService,
  ],
})
export class PayrollModule {}
