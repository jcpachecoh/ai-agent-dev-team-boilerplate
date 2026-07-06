import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from '../controller/reports.controller';
import { ReportsService } from '../service/reports.service';
import { ReportPdfService } from '../service/report-pdf.service';
import { ReportExcelService } from '../service/report-excel.service';
import { AttendanceQueryDto, PeriodQueryDto } from '../controller/dto/report-query.dto';
import { ExportFormat, ExportPayrollReportDto } from '../controller/dto/export-payroll-report.dto';
import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';

const TENANT_ID = 'tenant-1';
const MOCK_REPORTS_ACTOR = { userId: 'user-1', roleCode: 'OWNER' };

function makeJwtUser(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: 'user-1',
    email: 'user@test.dev',
    tenantId: TENANT_ID,
    roleId: 'role-1',
    roleCode: 'OWNER',
    ...overrides,
  };
}

const mockUser = makeJwtUser();
const mockActor = MOCK_REPORTS_ACTOR;
const mockActorEmpty = { userId: '', roleCode: '' };

const mockPayrollReport: any = {
  tenantId: TENANT_ID,
  period: { year: 2025, month: 6 },
  employees: [],
  tenantTotals: {
    employeeCount: 0,
    totalGrossPay: 0,
    totalDeductions: 0,
    totalNetPay: 0,
    totalEmployerContributions: 0,
    totalPayrollCost: 0,
  },
  locationTotals: [],
};

const mockAttendanceReport: any = {
  tenantId: TENANT_ID,
  from: '2025-06-01',
  to: '2025-06-30',
  employees: [],
};

const mockSocialSecurityReport: any = {
  tenantId: TENANT_ID,
  period: { year: 2025, month: 6 },
  employees: [],
  totalPILAContribution: 0,
};

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReportsService>;
  let pdfService: jest.Mocked<ReportPdfService>;
  let excelService: jest.Mocked<ReportExcelService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            getPayrollReport: jest.fn(),
            getAttendanceReport: jest.fn(),
            getSocialSecurityReport: jest.fn(),
          },
        },
        {
          provide: ReportPdfService,
          useValue: {
            generatePayrollPdf: jest.fn(),
          },
        },
        {
          provide: ReportExcelService,
          useValue: {
            generatePayrollXlsx: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get(ReportsService);
    pdfService = module.get(ReportPdfService);
    excelService = module.get(ReportExcelService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── getPayrollReport ───────────────────────────────────────────────────────

  describe('getPayrollReport', () => {
    const query: PeriodQueryDto = { period: '2025-06' };

    it('delegates to service with resolved tenantId from JWT', async () => {
      service.getPayrollReport.mockResolvedValue(mockPayrollReport);

      const result = await controller.getPayrollReport(mockUser, '', query);

      expect(service.getPayrollReport).toHaveBeenCalledWith(TENANT_ID, query, mockActor);
      expect(result).toBe(mockPayrollReport);
    });

    it('uses header tenantId when JWT tenantId is absent', async () => {
      service.getPayrollReport.mockResolvedValue(mockPayrollReport);

      await controller.getPayrollReport({} as unknown as JwtPayload, TENANT_ID, query);

      expect(service.getPayrollReport).toHaveBeenCalledWith(TENANT_ID, query, mockActorEmpty);
    });

    it('throws BadRequestException when both JWT and header tenantId are absent', async () => {
      await expect(
        controller.getPayrollReport({} as unknown as JwtPayload, '', query),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates service errors', async () => {
      service.getPayrollReport.mockRejectedValue(new BadRequestException('bad period'));

      await expect(controller.getPayrollReport(mockUser, '', query)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── getAttendanceReport ────────────────────────────────────────────────────

  describe('getAttendanceReport', () => {
    const query: AttendanceQueryDto = { from: '2025-06-01', to: '2025-06-30' };

    it('delegates to service with resolved tenantId', async () => {
      service.getAttendanceReport.mockResolvedValue(mockAttendanceReport);

      const result = await controller.getAttendanceReport(mockUser, '', query);

      expect(service.getAttendanceReport).toHaveBeenCalledWith(TENANT_ID, query, mockActor);
      expect(result).toBe(mockAttendanceReport);
    });

    it('uses header tenantId when JWT tenantId is absent', async () => {
      service.getAttendanceReport.mockResolvedValue(mockAttendanceReport);

      await controller.getAttendanceReport({} as unknown as JwtPayload, TENANT_ID, query);

      expect(service.getAttendanceReport).toHaveBeenCalledWith(TENANT_ID, query, mockActorEmpty);
    });

    it('throws BadRequestException when both tenantId sources are absent', async () => {
      await expect(
        controller.getAttendanceReport({} as unknown as JwtPayload, '', query),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getSocialSecurityReport ────────────────────────────────────────────────

  describe('getSocialSecurityReport', () => {
    const query: PeriodQueryDto = { period: '2025-06' };

    it('delegates to service with resolved tenantId', async () => {
      service.getSocialSecurityReport.mockResolvedValue(mockSocialSecurityReport);

      const result = await controller.getSocialSecurityReport(mockUser, '', query);

      expect(service.getSocialSecurityReport).toHaveBeenCalledWith(TENANT_ID, query, mockActor);
      expect(result).toBe(mockSocialSecurityReport);
    });

    it('uses header tenantId when JWT tenantId is absent', async () => {
      service.getSocialSecurityReport.mockResolvedValue(mockSocialSecurityReport);

      await controller.getSocialSecurityReport({} as unknown as JwtPayload, TENANT_ID, query);

      expect(service.getSocialSecurityReport).toHaveBeenCalledWith(
        TENANT_ID,
        query,
        mockActorEmpty,
      );
    });

    it('throws BadRequestException when both tenantId sources are absent', async () => {
      await expect(
        controller.getSocialSecurityReport({} as unknown as JwtPayload, '', query),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── exportPayrollReport ────────────────────────────────────────────────────

  describe('exportPayrollReport', () => {
    const pdfBody: ExportPayrollReportDto = { period: '2025-06', format: ExportFormat.PDF };
    const xlsxBody: ExportPayrollReportDto = { period: '2025-06', format: ExportFormat.XLSX };
    const mockPdfBuffer = Buffer.from('%PDF-1.3');
    const mockXlsxBuffer = Buffer.from('PK\x03\x04'); // XLSX ZIP magic bytes
    const mockRes = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    beforeEach(() => {
      mockRes.setHeader.mockClear();
      mockRes.send.mockClear();
    });

    it('format PDF → generates PDF and sets correct response headers', async () => {
      // Arrange
      service.getPayrollReport.mockResolvedValue(mockPayrollReport);
      pdfService.generatePayrollPdf.mockResolvedValue(mockPdfBuffer);

      // Act
      await controller.exportPayrollReport(mockUser, '', pdfBody, mockRes as any);

      // Assert
      expect(service.getPayrollReport).toHaveBeenCalledWith(TENANT_ID, pdfBody, mockActor);
      expect(pdfService.generatePayrollPdf).toHaveBeenCalledWith(mockPayrollReport);
      expect(excelService.generatePayrollXlsx).not.toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="payroll-report-2025-06.pdf"',
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('format XLSX → generates Excel workbook and sets correct response headers', async () => {
      // Arrange
      service.getPayrollReport.mockResolvedValue(mockPayrollReport);
      excelService.generatePayrollXlsx.mockResolvedValue(mockXlsxBuffer);

      // Act
      await controller.exportPayrollReport(mockUser, '', xlsxBody, mockRes as any);

      // Assert
      expect(service.getPayrollReport).toHaveBeenCalledWith(TENANT_ID, xlsxBody, mockActor);
      expect(excelService.generatePayrollXlsx).toHaveBeenCalledWith(mockPayrollReport);
      expect(pdfService.generatePayrollPdf).not.toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="payroll-report-2025-06.xlsx"',
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockXlsxBuffer);
    });

    it('uses header tenantId when JWT tenantId is absent (PDF)', async () => {
      // Arrange
      service.getPayrollReport.mockResolvedValue(mockPayrollReport);
      pdfService.generatePayrollPdf.mockResolvedValue(mockPdfBuffer);

      // Act
      await controller.exportPayrollReport(
        {} as unknown as JwtPayload,
        TENANT_ID,
        pdfBody,
        mockRes as any,
      );

      // Assert
      expect(service.getPayrollReport).toHaveBeenCalledWith(TENANT_ID, pdfBody, mockActorEmpty);
    });

    it('uses header tenantId when JWT tenantId is absent (XLSX)', async () => {
      // Arrange
      service.getPayrollReport.mockResolvedValue(mockPayrollReport);
      excelService.generatePayrollXlsx.mockResolvedValue(mockXlsxBuffer);

      // Act
      await controller.exportPayrollReport(
        {} as unknown as JwtPayload,
        TENANT_ID,
        xlsxBody,
        mockRes as any,
      );

      // Assert
      expect(service.getPayrollReport).toHaveBeenCalledWith(TENANT_ID, xlsxBody, mockActorEmpty);
    });

    it('throws BadRequestException when both tenantId sources are absent', async () => {
      await expect(
        controller.exportPayrollReport({} as unknown as JwtPayload, '', pdfBody, mockRes as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
