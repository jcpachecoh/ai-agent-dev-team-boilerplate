import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeSocialProfileModule } from '../employee-social-profile/employee-social-profile.module';
import { LaborLegalParametersModule } from '../labor-legal-parameters/labor-legal-parameters.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CesantiasController } from './controller/cesantias.controller';
import { DotacionesController } from './controller/dotaciones.controller';
import { EmployeeAssetsController } from './controller/employee-assets.controller';
import { EmployeeCatalogController } from './controller/employee-catalog.controller';
import { EmployeeDocumentsController } from './controller/employee-documents.controller';
import { EmployeePositionsController } from './controller/employee-positions.controller';
import { EmployeeSelfController } from './controller/employee-self.controller';
import { PayrollController } from './controller/payroll.controller';
import { CesantiasRepository } from './repository/cesantias.repository';
import { DotacionesRepository } from './repository/dotaciones.repository';
import { EmployeeAssetsRepository } from './repository/employee-assets.repository';
import { EmployeeCatalogRepository } from './repository/employee-catalog.repository';
import { EmployeeDocumentsRepository } from './repository/employee-documents.repository';
import { EmployeeHistoryRepository } from './repository/employee-history.repository';
import { EmployeePositionsRepository } from './repository/employee-positions.repository';
import { PayrollRepository } from './repository/payroll.repository';
import { DotacionesResolver } from './resolver/dotaciones.resolver';
import { EmployeeAssetsResolver } from './resolver/employee-assets.resolver';
import { EmployeePositionsResolver } from './resolver/employee-positions.resolver';
import { EmployeesResolver } from './resolver/employees.resolver';
import { CesantiasCalculationService } from './service/cesantias-calculation.service';
import { CesantiasService } from './service/cesantias.service';
import { DotacionesService } from './service/dotaciones.service';
import { EmployeeAssetsService } from './service/employee-assets.service';
import { EmployeeCatalogService } from './service/employee-catalog.service';
import { EmployeeDocumentsService } from './service/employee-documents.service';
import { EmployeeHistoryService } from './service/employee-history.service';
import { EmployeePositionsService } from './service/employee-positions.service';
import { PayrollCalculationService } from './service/payroll-calculation.service';
import { PayrollService } from './service/payroll.service';

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
    CesantiasController,
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
    EmployeeHistoryRepository,
    EmployeeHistoryService,
    CesantiasRepository,
    CesantiasCalculationService,
    CesantiasService,
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
    EmployeeHistoryRepository,
    EmployeeHistoryService,
  ],
})
export class PayrollModule {}
