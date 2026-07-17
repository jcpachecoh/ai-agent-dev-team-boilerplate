import { BadRequestException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import type { JwtPayload } from '../../auth/interfaces/auth.interfaces';
import { PAYROLL_MODULE_ROLES } from '../../common/config/rbac.config';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { SenaQuotaResult } from '../../payroll/interfaces/sena-quota.interfaces';
import { PayrollConceptsUsageService } from '../../payroll/service/payroll-concepts-usage.service';
import { SenaQuotaService } from '../../payroll/service/sena-quota.service';
import { ExportFormat, ExportPayrollReportDto } from '../controller/dto/export-payroll-report.dto';
import { AttendanceQueryDto, PeriodQueryDto } from '../controller/dto/report-query.dto';
import { SenaQuotaQueryDto } from '../controller/dto/sena-quota-query.dto';
import { ReportsController } from '../controller/reports.controller';
import { ReportExcelService } from '../service/report-excel.service';
import { ReportPdfService } from '../service/report-pdf.service';
import { ReportsService } from '../service/reports.service';

const TENANT_ID = 'tenant-1';
const TENANT_B = 'tenant-b';
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
  let senaQuotaService: { calculateForTenant: jest.Mock };
  let payrollConceptsUsageService: { getUsageReport: jest.Mock };

  beforeEach(async () => {
    senaQuotaService = { calculateForTenant: jest.fn() };
    payrollConceptsUsageService = { getUsageReport: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            getPayrollReport: jest.fn(),
            getAttendanceReport: jest.fn(),
            getSocialSecurityReport: jest.fn(),
            getEmployeeListReport: jest.fn(),
            getAttendanceReportForExport: jest.fn(),
          },
        },
        {
          provide: ReportPdfService,
          useValue: {
            generatePayrollPdf: jest.fn(),
            generateEmployeeListPdf: jest.fn(),
            generateAttendancePdf: jest.fn(),
          },
        },
        {
          provide: ReportExcelService,
          useValue: {
            generatePayrollXlsx: jest.fn(),
            generateEmployeeListXlsx: jest.fn(),
            generateAttendanceXlsx: jest.fn(),
          },
        },
        {
          provide: SenaQuotaService,
          useValue: senaQuotaService,
        },
        {
          provide: PayrollConceptsUsageService,
          useValue: payrollConceptsUsageService,
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

  describe('getPayrollConceptsUsage (OS-612)', () => {
    it('delega al usage service con tenant del JWT', async () => {
      const report = {
        tenantId: TENANT_ID,
        generatedAt: '2026-07-16T00:00:00.000Z',
        settlementLineUsages: [],
        summary: {
          distinctPairs: 0,
          cataloged: 0,
          uncataloged: 0,
          inactive: 0,
          nameMismatch: 0,
        },
        os380FieldCoverage: {
          note: 'static',
          fields: [],
          mappedFieldCount: 15,
        },
      };
      payrollConceptsUsageService.getUsageReport.mockResolvedValue(report);

      const result = await controller.getPayrollConceptsUsage(mockUser, '');

      expect(payrollConceptsUsageService.getUsageReport).toHaveBeenCalledWith(TENANT_ID);
      expect(result).toEqual(report);
    });
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

  // ── getSenaQuota (OS-599) ──────────────────────────────────────────────────

  describe('getSenaQuota', () => {
    const query: SenaQuotaQueryDto = { period: '2026-07' };

    const baseResult: SenaQuotaResult = {
      period: '2026-07',
      eligibleWorkers: 15,
      requiredApprentices: 1,
      activeApprentices: 0,
      missingApprentices: 1,
      smlv: 1_750_905,
      monetizationRegime: 'LEY_2466_2025',
      estimatedMonetizationAmount: Math.round(1_750_905 * 1.5),
      status: 'PENDING',
      estimated: true,
    };

    it('respuesta exitosa: propaga resultado del service', async () => {
      senaQuotaService.calculateForTenant.mockResolvedValue(baseResult);

      const result = await controller.getSenaQuota(mockUser, '', query);

      expect(result).toEqual(baseResult);
      expect(result).not.toHaveProperty('monetizationFactor');
      expect(senaQuotaService.calculateForTenant).toHaveBeenCalledWith(TENANT_ID, '2026-07');
    });

    it('usa tenantId del JWT autenticado (no del query)', async () => {
      senaQuotaService.calculateForTenant.mockResolvedValue(baseResult);

      await controller.getSenaQuota(makeJwtUser({ tenantId: TENANT_B }), 'ignored-header', query);

      expect(senaQuotaService.calculateForTenant).toHaveBeenCalledWith(TENANT_B, '2026-07');
      expect(senaQuotaService.calculateForTenant).not.toHaveBeenCalledWith(
        TENANT_ID,
        expect.anything(),
      );
    });

    it('fallback x-tenant-id solo si JWT no trae tenantId', async () => {
      senaQuotaService.calculateForTenant.mockResolvedValue(baseResult);

      await controller.getSenaQuota({} as unknown as JwtPayload, TENANT_ID, query);

      expect(senaQuotaService.calculateForTenant).toHaveBeenCalledWith(TENANT_ID, '2026-07');
    });

    it('rechaza cuando no hay tenant en contexto', async () => {
      await expect(controller.getSenaQuota({} as unknown as JwtPayload, '', query)).rejects.toThrow(
        BadRequestException,
      );
      expect(senaQuotaService.calculateForTenant).not.toHaveBeenCalled();
    });

    it('propaga error del service (período inválido en motor)', async () => {
      senaQuotaService.calculateForTenant.mockRejectedValue(
        new BadRequestException('Invalid period "2026/07". Expected YYYY-MM.'),
      );

      await expect(controller.getSenaQuota(mockUser, '', query)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('estado EXEMPT', async () => {
      const exempt: SenaQuotaResult = {
        ...baseResult,
        eligibleWorkers: 10,
        requiredApprentices: 0,
        missingApprentices: 0,
        estimatedMonetizationAmount: 0,
        status: 'EXEMPT',
      };
      senaQuotaService.calculateForTenant.mockResolvedValue(exempt);

      const result = await controller.getSenaQuota(mockUser, '', query);
      expect(result.status).toBe('EXEMPT');
    });

    it('estado COMPLIANT', async () => {
      const compliant: SenaQuotaResult = {
        ...baseResult,
        activeApprentices: 1,
        missingApprentices: 0,
        estimatedMonetizationAmount: 0,
        status: 'COMPLIANT',
      };
      senaQuotaService.calculateForTenant.mockResolvedValue(compliant);

      const result = await controller.getSenaQuota(mockUser, '', query);
      expect(result.status).toBe('COMPLIANT');
    });

    it('estado PENDING', async () => {
      senaQuotaService.calculateForTenant.mockResolvedValue(baseResult);

      const result = await controller.getSenaQuota(mockUser, '', query);
      expect(result.status).toBe('PENDING');
    });

    it('régimen histórico LEY_789_2002', async () => {
      const historical: SenaQuotaResult = {
        ...baseResult,
        period: '2025-05',
        monetizationRegime: 'LEY_789_2002',
        estimatedMonetizationAmount: Math.round(0.05 * 15 * 1_423_500),
        smlv: 1_423_500,
      };
      senaQuotaService.calculateForTenant.mockResolvedValue(historical);

      const result = await controller.getSenaQuota(mockUser, '', { period: '2025-05' });
      expect(result.monetizationRegime).toBe('LEY_789_2002');
      expect(senaQuotaService.calculateForTenant).toHaveBeenCalledWith(TENANT_ID, '2025-05');
    });

    it('régimen vigente LEY_2466_2025', async () => {
      senaQuotaService.calculateForTenant.mockResolvedValue(baseResult);

      const result = await controller.getSenaQuota(mockUser, '', query);
      expect(result.monetizationRegime).toBe('LEY_2466_2025');
    });

    it('guards JwtAuthGuard + RolesGuard y roles PAYROLL_MODULE_ROLES (sin permiso nuevo)', () => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, ReportsController) as unknown[];
      expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));

      const roles = Reflect.getMetadata(ROLES_KEY, ReportsController) as string[];
      expect(roles).toEqual([...PAYROLL_MODULE_ROLES]);
    });
  });

  describe('SenaQuotaQueryDto validation', () => {
    async function errorsFor(plain: object): Promise<string[]> {
      const dto = plainToInstance(SenaQuotaQueryDto, plain);
      const errors = await validate(dto);
      return errors.flatMap((e) => Object.values(e.constraints ?? {}));
    }

    it('rechaza período faltante', async () => {
      const messages = await errorsFor({});
      expect(messages.length).toBeGreaterThan(0);
    });

    it('rechaza período inválido', async () => {
      const messages = await errorsFor({ period: '2026/07' });
      expect(messages.some((m) => m.includes('YYYY-MM'))).toBe(true);
    });

    it('acepta YYYY-MM válido', async () => {
      const messages = await errorsFor({ period: '2026-07' });
      expect(messages).toEqual([]);
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
      expect(pdfService.generatePayrollPdf).toHaveBeenCalledWith(
        mockPayrollReport,
        expect.arrayContaining(['Periodo: 2025-06']),
      );
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
      expect(excelService.generatePayrollXlsx).toHaveBeenCalledWith(
        mockPayrollReport,
        expect.arrayContaining(['Periodo: 2025-06']),
      );
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

  describe('exportEmployeeList', () => {
    const mockRes = { setHeader: jest.fn(), send: jest.fn() };
    const mockEmployeeReport = {
      tenantId: TENANT_ID,
      filtersSummary: ['Sin filtros adicionales'],
      employees: [],
    };

    beforeEach(() => {
      mockRes.setHeader.mockClear();
      mockRes.send.mockClear();
    });

    it('exports employee list as PDF', async () => {
      service.getEmployeeListReport.mockResolvedValue(mockEmployeeReport);
      pdfService.generateEmployeeListPdf.mockResolvedValue(Buffer.from('%PDF'));

      await controller.exportEmployeeList(
        mockUser,
        '',
        { format: ExportFormat.PDF },
        mockRes as any,
      );

      expect(service.getEmployeeListReport).toHaveBeenCalled();
      expect(pdfService.generateEmployeeListPdf).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    });
  });

  describe('exportAttendanceReport', () => {
    const mockRes = { setHeader: jest.fn(), send: jest.fn() };

    beforeEach(() => {
      mockRes.setHeader.mockClear();
      mockRes.send.mockClear();
    });

    it('exports attendance report as XLSX', async () => {
      service.getAttendanceReportForExport.mockResolvedValue(mockAttendanceReport);
      excelService.generateAttendanceXlsx.mockResolvedValue(Buffer.from('PK\x03\x04'));

      await controller.exportAttendanceReport(
        mockUser,
        '',
        { format: ExportFormat.XLSX, from: '2025-06-01', to: '2025-06-30' },
        mockRes as any,
      );

      expect(service.getAttendanceReportForExport).toHaveBeenCalled();
      expect(excelService.generateAttendanceXlsx).toHaveBeenCalled();
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    });
  });
});
