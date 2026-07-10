import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LocationsModule } from '../locations/locations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollModule } from '../payroll/payroll.module';
import { VacationsModule } from '../vacations/vacations.module';
import { MedicalLeavesModule } from '../medical-leaves/medical-leaves.module';
import { PayrollNovedadesModule } from '../payroll-novedades/payroll-novedades.module';
import { LaborLegalParametersModule } from '../labor-legal-parameters/labor-legal-parameters.module';
import { ReportsController } from './controller/reports.controller';
import { ReportsService } from './service/reports.service';
import { ReportsRepository } from './repository/reports.repository';
import { ReportPdfService } from './service/report-pdf.service';
import { ReportExcelService } from './service/report-excel.service';

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
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, ReportPdfService, ReportExcelService],
})
export class ReportsModule {}
