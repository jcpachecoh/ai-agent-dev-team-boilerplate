import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeSocialProfileModule } from '../employee-social-profile/employee-social-profile.module';
import { LaborLegalParametersModule } from '../labor-legal-parameters/labor-legal-parameters.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { VacationsModule } from '../vacations/vacations.module';
import { CesantiasController } from './controller/cesantias.controller';
import { DotacionesController } from './controller/dotaciones.controller';
import { EmployeeAssetsController } from './controller/employee-assets.controller';
import { EmployeeCatalogController } from './controller/employee-catalog.controller';
import { EmployeeDocumentsController } from './controller/employee-documents.controller';
import { EmployeePositionsController } from './controller/employee-positions.controller';
import { EmployeeSelfController } from './controller/employee-self.controller';
import { FinalSettlementController } from './controller/final-settlement.controller';
import { LegalFormulaValidationController } from './controller/legal-formula-validation.controller';
import { PayrollController } from './controller/payroll.controller';
import { CesantiasRepository } from './repository/cesantias.repository';
import { DotacionesRepository } from './repository/dotaciones.repository';
import { EmployeeAssetsRepository } from './repository/employee-assets.repository';
import { EmployeeCatalogRepository } from './repository/employee-catalog.repository';
import { EmployeeContractRepository } from './repository/employee-contract.repository';
import { EmployeeDocumentsRepository } from './repository/employee-documents.repository';
import { EmployeeHistoryRepository } from './repository/employee-history.repository';
import { EmployeePositionsRepository } from './repository/employee-positions.repository';
import { FinalSettlementRepository } from './repository/final-settlement.repository';
import { LegalFormulaValidationRepository } from './repository/legal-formula-validation.repository';
import { PayrollRepository } from './repository/payroll.repository';
import { PendingSalaryReconciliationRepository } from './repository/pending-salary-reconciliation.repository';
import { PrimaRepository } from './repository/prima.repository';
import { TenantPilaConfigRepository } from './repository/tenant-pila-config.repository';
import { DotacionesResolver } from './resolver/dotaciones.resolver';
import { EmployeeAssetsResolver } from './resolver/employee-assets.resolver';
import { EmployeePositionsResolver } from './resolver/employee-positions.resolver';
import { EmployeesResolver } from './resolver/employees.resolver';
import { CesantiasCalculationService } from './service/cesantias-calculation.service';
import { CesantiasExportService } from './service/cesantias-export.service';
import { CesantiasService } from './service/cesantias.service';
import { DotacionesService } from './service/dotaciones.service';
import { EmployeeAssetsService } from './service/employee-assets.service';
import { EmployeeCatalogService } from './service/employee-catalog.service';
import { EmployeeContractService } from './service/employee-contract.service';
import { EmployeeDeactivationGuardService } from './service/employee-deactivation-guard.service';
import { EmployeeDocumentsService } from './service/employee-documents.service';
import { EmployeeHistoryService } from './service/employee-history.service';
import { EmployeePositionsService } from './service/employee-positions.service';
import { FinalSettlementAggregatorService } from './service/final-settlement-aggregator.service';
import { FinalSettlementReceiptPdfService } from './service/final-settlement-receipt-pdf.service';
import { FinalSettlementService } from './service/final-settlement.service';
import { IndemnificationCalculationService } from './service/indemnification-calculation.service';
import { LegalFormulaValidationService } from './service/legal-formula-validation.service';
import { PayrollCalculationService } from './service/payroll-calculation.service';
import { PayrollService } from './service/payroll.service';
import { PendingSalaryReconciliationService } from './service/pending-salary-reconciliation.service';
import { PendingSalaryService } from './service/pending-salary.service';
import { PrimaCalculationService } from './service/prima-calculation.service';
import { PrimaService } from './service/prima.service';
import { SenaQuotaService } from './service/sena-quota.service';
import { TenantPilaConfigService } from './service/tenant-pila-config.service';
import { VariableAverageService } from './service/variable-average.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    EmployeeSocialProfileModule,
    LocationsModule,
    LaborLegalParametersModule,
    VacationsModule,
    StorageModule,
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
    FinalSettlementController,
    LegalFormulaValidationController,
  ],
  providers: [
    PayrollService,
    PayrollRepository,
    EmployeeCatalogService,
    EmployeeCatalogRepository,
    TenantPilaConfigService,
    TenantPilaConfigRepository,
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
    CesantiasExportService,
    EmployeeContractRepository,
    EmployeeContractService,
    PrimaRepository,
    PrimaCalculationService,
    PrimaService,
    FinalSettlementRepository,
    IndemnificationCalculationService,
    VariableAverageService,
    PendingSalaryService,
    FinalSettlementAggregatorService,
    FinalSettlementService,
    FinalSettlementReceiptPdfService,
    LegalFormulaValidationRepository,
    LegalFormulaValidationService,
    PendingSalaryReconciliationRepository,
    PendingSalaryReconciliationService,
    EmployeeDeactivationGuardService,
    SenaQuotaService,
  ],
  exports: [
    PayrollService,
    PayrollRepository,
    PayrollCalculationService,
    EmployeeCatalogService,
    EmployeeCatalogRepository,
    TenantPilaConfigService,
    EmployeePositionsService,
    EmployeeAssetsService,
    EmployeeDocumentsService,
    DotacionesService,
    EmployeeHistoryRepository,
    EmployeeHistoryService,
    EmployeeContractRepository,
    EmployeeContractService,
    PrimaRepository,
    PrimaService,
    FinalSettlementRepository,
    IndemnificationCalculationService,
    FinalSettlementService,
    SenaQuotaService,
  ],
})
export class PayrollModule {}
