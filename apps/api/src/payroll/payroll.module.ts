import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeeSocialProfileModule } from '../employee-social-profile/employee-social-profile.module';
import { LocationsModule } from '../locations/locations.module';
import { LaborLegalParametersModule } from '../labor-legal-parameters/labor-legal-parameters.module';
import { EmployeeSelfController } from './controller/employee-self.controller';
import { PayrollController } from './controller/payroll.controller';
import { EmployeeCatalogController } from './controller/employee-catalog.controller';
import { EmployeePositionsController } from './controller/employee-positions.controller';
import { EmployeeAssetsController } from './controller/employee-assets.controller';
import { EmployeeDocumentsController } from './controller/employee-documents.controller';
import { DotacionesController } from './controller/dotaciones.controller';
import { PayrollService } from './service/payroll.service';
import { EmployeeCatalogService } from './service/employee-catalog.service';
import { EmployeePositionsService } from './service/employee-positions.service';
import { EmployeeAssetsService } from './service/employee-assets.service';
import { EmployeeDocumentsService } from './service/employee-documents.service';
import { DotacionesService } from './service/dotaciones.service';
import { PayrollRepository } from './repository/payroll.repository';
import { EmployeeCatalogRepository } from './repository/employee-catalog.repository';
import { EmployeePositionsRepository } from './repository/employee-positions.repository';
import { EmployeeAssetsRepository } from './repository/employee-assets.repository';
import { EmployeeDocumentsRepository } from './repository/employee-documents.repository';
import { DotacionesRepository } from './repository/dotaciones.repository';
import { EmployeesResolver } from './resolver/employees.resolver';
import { EmployeePositionsResolver } from './resolver/employee-positions.resolver';
import { EmployeeAssetsResolver } from './resolver/employee-assets.resolver';
import { DotacionesResolver } from './resolver/dotaciones.resolver';
import { PayrollCalculationService } from './service/payroll-calculation.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    EmployeeSocialProfileModule,
    LocationsModule,
    LaborLegalParametersModule,
  ],
  controllers: [
    EmployeeSelfController,
    PayrollController,
    EmployeeCatalogController,
    EmployeePositionsController,
    EmployeeAssetsController,
    EmployeeDocumentsController,
    DotacionesController,
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
    DotacionesService,
    DotacionesRepository,
    DotacionesResolver,
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
    DotacionesService,
  ],
})
export class PayrollModule {}
