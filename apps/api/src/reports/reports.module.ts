import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { LaborLegalParametersModule } from '../labor-legal-parameters/labor-legal-parameters.module';
import { LocationsModule } from '../locations/locations.module';
import { MedicalLeavesModule } from '../medical-leaves/medical-leaves.module';
import { OvertimeModule } from '../overtime/overtime.module';
import { DailyCostCenterModule } from '../daily-cost-center/daily-cost-center.module';
import { PayrollModule } from '../payroll/payroll.module';
import { PayrollNovedadesModule } from '../payroll-novedades/payroll-novedades.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TaxWithholdingBracketsModule } from '../tax-withholding-brackets/tax-withholding-brackets.module';
import { VacationsModule } from '../vacations/vacations.module';
import { ReportsController } from './controller/reports.controller';
import { ReportsRepository } from './repository/reports.repository';
import { ReportExcelService } from './service/report-excel.service';
import { ReportPdfService } from './service/report-pdf.service';
import { ReportsService } from './service/reports.service';

@Module({
  imports: [
    PrismaModule,
    PayrollModule,
    AuthModule,
    LocationsModule,
    VacationsModule,
    MedicalLeavesModule,
    PayrollNovedadesModule,
    LaborLegalParametersModule,
    TaxWithholdingBracketsModule,
    OvertimeModule,
    DailyCostCenterModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, ReportPdfService, ReportExcelService],
})
export class ReportsModule {}
