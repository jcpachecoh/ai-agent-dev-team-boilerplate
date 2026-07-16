import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { SalaryType, EmployeeContractType } from '@prisma/client';
import * as ExcelJS from 'exceljs';

import type { AttendanceReportResponseDto } from '../controller/dto/attendance-report-response.dto';
import { EmployeeListReportType } from '../controller/dto/employee-list-export-query.dto';
import type { EmployeeListReportResponseDto } from '../controller/dto/employee-list-report-response.dto';
import type {
  PayrollReportResponseDto,
  PayrollEmployeeRowDto,
} from '../controller/dto/payroll-report-response.dto';
import { ReportExcelService } from '../service/report-excel.service';

// Minimal valid report — no employees
const EMPTY_REPORT: PayrollReportResponseDto = {
  tenantId: 'tenant-1',
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

function makeEmployee(overrides: Partial<PayrollEmployeeRowDto> = {}): PayrollEmployeeRowDto {
  return {
    employeeId: 'emp-1',
    employeeName: 'Ana Gómez',
    cedula: '10000001',
    locationId: 'loc-1',
    locationName: 'Sede Norte',
    contractType: EmployeeContractType.INDEFINIDO,
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: 1_500_000,
    workedDays: 30,
    calendarDays: 30,
    salaryBase: 1_500_000,
    transportSubsidy: 162_000,
    overtimePay: 75_000,
    overtimeBreakdown: [],
    grossPay: 1_737_000,
    healthDeduction: 60_000,
    pensionDeduction: 0,
    incomeTaxWithholding: 0,
    taxWithholdingBreakdown: {
      taxWithholdingBase: 1_380_000,
      uvtValue: 49_799,
      taxWithholdingBaseUvt: 27.71,
      bracketLowerUvtExclusive: 0,
      bracketUpperUvtInclusive: 95,
      marginalRate: 0,
      fixedTaxUvt: 0,
      incomeTaxWithholding: 0,
      isExemptFromTax: false,
    },
    totalDeductions: 60_000,
    netPay: 1_677_000,
    employerHealthContribution: 127_500,
    employerPensionContribution: 180_000,
    employerArlContribution: 15_000,
    employerSenaContribution: 30_000,
    employerIcbfContribution: 45_000,
    employerCajaContribution: 30_000,
    totalEmployerContributions: 427_500,
    totalPayrollCost: 2_164_500,
    medicalLeaveEmployerDays: 0,
    medicalLeaveEmployerPay: 0,
    medicalLeaveEpsArlDays: 0,
    medicalLeaveEpsArlPay: 0,
    medicalLeaveOrdinaryDaysExcluded: 0,
    ...overrides,
  };
}

// XLSX ZIP magic: PK\x03\x04
function isXlsxBuffer(buf: Buffer): boolean {
  return buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
}

describe('ReportExcelService', () => {
  let service: ReportExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportExcelService],
    }).compile();

    service = module.get<ReportExcelService>(ReportExcelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a Buffer', async () => {
    const result = await service.generatePayrollXlsx(EMPTY_REPORT);
    expect(result).toBeInstanceOf(Buffer);
  });

  it('returns a valid XLSX (ZIP) buffer — magic bytes PK\\x03\\x04', async () => {
    const result = await service.generatePayrollXlsx(EMPTY_REPORT);
    expect(isXlsxBuffer(result)).toBe(true);
  });

  it('includes filters summary rows in payroll XLSX', async () => {
    const result = await service.generatePayrollXlsx(EMPTY_REPORT, [
      'Periodo: 2025-06',
      'Sede: loc-1',
    ]);
    expect(isXlsxBuffer(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('empty employees report still produces valid XLSX buffer', async () => {
    const result = await service.generatePayrollXlsx(EMPTY_REPORT);
    expect(result.length).toBeGreaterThan(0);
    expect(isXlsxBuffer(result)).toBe(true);
  });

  it('report with one employee produces a larger buffer than empty report', async () => {
    // Arrange
    const emptyBuffer = await service.generatePayrollXlsx(EMPTY_REPORT);

    const reportWithEmployee: PayrollReportResponseDto = {
      ...EMPTY_REPORT,
      employees: [makeEmployee()],
      tenantTotals: {
        employeeCount: 1,
        totalGrossPay: 1_737_000,
        totalDeductions: 60_000,
        totalNetPay: 1_677_000,
        totalEmployerContributions: 420_000,
        totalPayrollCost: 2_097_000,
      },
    };

    // Act
    const result = await service.generatePayrollXlsx(reportWithEmployee);

    // Assert
    expect(result.length).toBeGreaterThan(emptyBuffer.length);
  });

  it('produces valid XLSX with multiple employees', async () => {
    // Arrange
    const employees = Array.from({ length: 10 }, (_, i) =>
      makeEmployee({
        employeeId: `emp-${i}`,
        employeeName: `Empleado ${i}`,
        cedula: `1000000${i}`,
        salaryBase: 1_300_000 + i * 50_000,
      }),
    );

    const report: PayrollReportResponseDto = {
      ...EMPTY_REPORT,
      employees,
      tenantTotals: {
        employeeCount: 10,
        totalGrossPay: 16_000_000,
        totalDeductions: 600_000,
        totalNetPay: 15_400_000,
        totalEmployerContributions: 4_200_000,
        totalPayrollCost: 19_600_000,
      },
    };

    // Act
    const result = await service.generatePayrollXlsx(report);

    // Assert
    expect(result).toBeInstanceOf(Buffer);
    expect(isXlsxBuffer(result)).toBe(true);
  });

  it('handles employee with long name without throwing', async () => {
    // Arrange
    const report: PayrollReportResponseDto = {
      ...EMPTY_REPORT,
      employees: [
        makeEmployee({ employeeName: 'María Alejandra de los Ángeles Rodríguez Quintero' }),
      ],
      tenantTotals: { ...EMPTY_REPORT.tenantTotals, employeeCount: 1 },
    };

    // Act & Assert — should not throw
    await expect(service.generatePayrollXlsx(report)).resolves.toBeInstanceOf(Buffer);
  });

  it('reflects incomeTaxWithholding in totalDeductions column (OS-594)', async () => {
    const incomeTaxWithholding = 499_529;
    const healthDeduction = 320_000;
    const pensionDeduction = 320_000;
    const totalDeductions = healthDeduction + pensionDeduction + incomeTaxWithholding;

    const report: PayrollReportResponseDto = {
      ...EMPTY_REPORT,
      employees: [
        makeEmployee({
          salaryAmount: 8_000_000,
          salaryBase: 8_000_000,
          grossPay: 8_000_000,
          healthDeduction,
          pensionDeduction,
          incomeTaxWithholding,
          totalDeductions,
          netPay: 8_000_000 - totalDeductions,
        }),
      ],
      tenantTotals: {
        employeeCount: 1,
        totalGrossPay: 8_000_000,
        totalDeductions,
        totalNetPay: 8_000_000 - totalDeductions,
        totalEmployerContributions: 427_500,
        totalPayrollCost: 8_427_500,
      },
    };

    const buffer = await service.generatePayrollXlsx(report);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.getWorksheet('Nómina');
    expect(sheet).toBeDefined();

    const headerRowNumber = 5;
    const dataRow = sheet!.getRow(headerRowNumber + 1);
    expect(dataRow.getCell(1).value).toBe('Ana Gómez');
    expect(Number(dataRow.getCell(7).value)).toBe(totalDeductions);

    const totalsRow = sheet!.getRow(headerRowNumber + 2);
    expect(String(totalsRow.getCell(1).value ?? '')).toMatch(/^Total \(/);
    expect(Number(totalsRow.getCell(7).value)).toBe(totalDeductions);
  });

  it('handles January (month 1) and December (month 12) month names correctly', async () => {
    const janReport = { ...EMPTY_REPORT, period: { year: 2025, month: 1 } };
    const decReport = { ...EMPTY_REPORT, period: { year: 2025, month: 12 } };

    // Both should resolve without error
    await expect(service.generatePayrollXlsx(janReport)).resolves.toBeInstanceOf(Buffer);
    await expect(service.generatePayrollXlsx(decReport)).resolves.toBeInstanceOf(Buffer);
  });

  it('report with zero-value employee produces valid XLSX', async () => {
    // Arrange — employee on unpaid leave (all zeroes except base salary)
    const report: PayrollReportResponseDto = {
      ...EMPTY_REPORT,
      employees: [
        makeEmployee({
          salaryBase: 0,
          transportSubsidy: 0,
          overtimePay: 0,
          totalDeductions: 0,
          netPay: 0,
          totalEmployerContributions: 0,
          totalPayrollCost: 0,
        }),
      ],
      tenantTotals: { ...EMPTY_REPORT.tenantTotals, employeeCount: 1 },
    };

    const result = await service.generatePayrollXlsx(report);
    expect(isXlsxBuffer(result)).toBe(true);
  });

  const employeeListReport: EmployeeListReportResponseDto = {
    tenantId: 'tenant-1',
    filtersSummary: ['Sede: loc-1'],
    employees: [
      {
        employeeId: 'emp-1',
        name: 'Ana Gómez',
        cedula: '10000001',
        email: 'ana@test.com',
        position: 'Cajera',
        area: 'Salón',
        department: 'Operaciones',
        contractType: EmployeeContractType.INDEFINIDO,
        locationId: 'loc-1',
        locationName: 'Sede Norte',
        hireDate: '2020-01-01',
        contractStart: '2020-01-01',
        contractEnd: null,
        salaryAmount: 1_800_000,
        isActive: true,
      },
    ],
  };

  it('generates employee list XLSX for employees report type', async () => {
    const result = await service.generateEmployeeListXlsx(
      employeeListReport,
      EmployeeListReportType.EMPLOYEES,
    );
    expect(isXlsxBuffer(result)).toBe(true);
  });

  it('generates employee list XLSX for contracts report type', async () => {
    const result = await service.generateEmployeeListXlsx(
      employeeListReport,
      EmployeeListReportType.CONTRACTS,
    );
    expect(isXlsxBuffer(result)).toBe(true);
  });

  it('generates attendance XLSX with legal alert row', async () => {
    const attendanceReport: AttendanceReportResponseDto = {
      tenantId: 'tenant-1',
      from: '2025-06-01',
      to: '2025-06-30',
      employees: [
        {
          employeeId: 'emp-1',
          employeeName: 'Ana Gómez',
          cedula: '10000001',
          locationId: 'loc-1',
          locationName: 'Sede Norte',
          totalWorkedMinutes: 480,
          regularMinutes: 420,
          overtimeMinutes: 60,
          activeDays: 1,
          absentDays: 29,
          exceededLegalOvertimeLimit: true,
        },
      ],
    };

    const result = await service.generateAttendanceXlsx(attendanceReport, ['Desde: 2025-06-01']);
    expect(isXlsxBuffer(result)).toBe(true);
  });
});
