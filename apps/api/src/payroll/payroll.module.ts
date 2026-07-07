import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeeSocialProfileModule } from '../employee-social-profile/employee-social-profile.module';
import { LocationsModule } from '../locations/locations.module';
import { PayrollController } from './controller/payroll.controller';
import { EmployeeCatalogController } from './controller/employee-catalog.controller';
import { EmployeePositionsController } from './controller/employee-positions.controller';
import { EmployeeAssetsController } from './controller/employee-assets.controller';
import { EmployeeDocumentsController } from './controller/employee-documents.controller';
import { PayrollService } from './service/payroll.service';
import { EmployeeCatalogService } from './service/employee-catalog.service';
import { EmployeePositionsService } from './service/employee-positions.service';
import { EmployeeAssetsService } from './service/employee-assets.service';
import { EmployeeDocumentsService } from './service/employee-documents.service';
import { PayrollRepository } from './repository/payroll.repository';
import { EmployeeCatalogRepository } from './repository/employee-catalog.repository';
import { EmployeePositionsRepository } from './repository/employee-positions.repository';
import { EmployeeAssetsRepository } from './repository/employee-assets.repository';
import { EmployeeDocumentsRepository } from './repository/employee-documents.repository';
import { EmployeesResolver } from './resolver/employees.resolver';
import { EmployeePositionsResolver } from './resolver/employee-positions.resolver';
import { EmployeeAssetsResolver } from './resolver/employee-assets.resolver';
import { PayrollCalculationService } from './service/payroll-calculation.service';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, EmployeeSocialProfileModule, LocationsModule],
  controllers: [
    PayrollController,
    EmployeeCatalogController,
    EmployeePositionsController,
    EmployeeAssetsController,
    EmployeeDocumentsController,
  ],
  providers: [
    PayrollService,
    PayrollRepository,
    EmployeeCatalogService,
    EmployeeCatalogRepository,
    EmployeePositionsService,
    EmployeePositionsRepository,
    EmployeeAssetsService,
    EmployeeAssetsRepository,
    EmployeeDocumentsService,
    EmployeeDocumentsRepository,
    EmployeesResolver,
    EmployeePositionsResolver,
    EmployeeAssetsResolver,
    PayrollCalculationService,
  ],
  exports: [
    PayrollService,
    PayrollRepository,
    PayrollCalculationService,
    EmployeeCatalogService,
    EmployeePositionsService,
    EmployeeAssetsService,
    EmployeeDocumentsService,
  ],
})
export class PayrollModule {}
