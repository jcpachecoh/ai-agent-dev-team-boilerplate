import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttendanceQueryDto, PeriodQueryDto } from './dto/report-query.dto';
import { PayrollReportResponseDto } from './dto/payroll-report-response.dto';
import { AttendanceReportResponseDto } from './dto/attendance-report-response.dto';
import { SocialSecurityReportResponseDto } from './dto/social-security-report-response.dto';
import { ExportPayrollReportDto, ExportFormat } from './dto/export-payroll-report.dto';
import { ReportsService } from '../service/reports.service';
import { ReportPdfService } from '../service/report-pdf.service';
import { ReportExcelService } from '../service/report-excel.service';

@ApiTags('reports')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Fallback tenant identifier' })
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly reportPdfService: ReportPdfService,
    private readonly reportExcelService: ReportExcelService,
  ) {}

  @ApiOperation({ summary: 'Monthly payroll report for the tenant' })
  @ApiOkResponse({ type: PayrollReportResponseDto })
  @Get('payroll')
  async getPayrollReport(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: PeriodQueryDto,
  ): Promise<PayrollReportResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.reportsService.getPayrollReport(tenantId, query);
  }

  @ApiOperation({ summary: 'Attendance summary report for the tenant' })
  @ApiOkResponse({ type: AttendanceReportResponseDto })
  @Get('attendance')
  async getAttendanceReport(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: AttendanceQueryDto,
  ): Promise<AttendanceReportResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.reportsService.getAttendanceReport(tenantId, query);
  }

  @ApiOperation({ summary: 'Social security (PILA) contributions report for the tenant' })
  @ApiOkResponse({ type: SocialSecurityReportResponseDto })
  @Get('social-security')
  async getSocialSecurityReport(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Query() query: PeriodQueryDto,
  ): Promise<SocialSecurityReportResponseDto> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    return this.reportsService.getSocialSecurityReport(tenantId, query);
  }

  @ApiOperation({ summary: 'Export monthly payroll report as PDF or XLSX' })
  @ApiConsumes('application/json')
  @ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Post('payroll/export')
  async exportPayrollReport(
    @CurrentUser() user: any,
    @Headers('x-tenant-id') headerTenantId: string,
    @Body() body: ExportPayrollReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = this.resolveTenantId(user, headerTenantId);
    const report = await this.reportsService.getPayrollReport(tenantId, body);

    if (body.format === ExportFormat.XLSX) {
      const buffer = await this.reportExcelService.generatePayrollXlsx(report);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="payroll-report-${body.period}.xlsx"`,
      );
      res.send(buffer);
    } else {
      const buffer = await this.reportPdfService.generatePayrollPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="payroll-report-${body.period}.pdf"`,
      );
      res.send(buffer);
    }
  }

  private resolveTenantId(user: any, headerTenantId: string): string {
    const tenantId = user?.tenantId || headerTenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required (JWT or x-tenant-id header)');
    }
    return tenantId;
  }
}
