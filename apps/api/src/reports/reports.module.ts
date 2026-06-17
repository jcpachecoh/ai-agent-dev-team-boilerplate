import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PayrollModule } from '../payroll/payroll.module';
import { ReportsController } from './controller/reports.controller';
import { ReportsService } from './service/reports.service';
import { ReportsRepository } from './repository/reports.repository';
import { ReportPdfService } from './service/report-pdf.service';
import { ReportExcelService } from './service/report-excel.service';

@Module({
  imports: [PrismaModule, PayrollModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository, ReportPdfService, ReportExcelService],
})
export class ReportsModule {}
