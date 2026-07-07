import { ReportPdfService } from '../service/report-pdf.service';
import { PayrollReportResponseDto } from '../controller/dto/payroll-report-response.dto';
import { EmployeeContractType, SalaryType } from '@prisma/client';

const PDF_MAGIC = Buffer.from('%PDF');

function makeEmployee(
  overrides: Partial<PayrollReportResponseDto['employees'][0]> = {},
): PayrollReportResponseDto['employees'][0] {
  return {
    employeeId: 'emp-1',
    employeeName: 'Ana García López',
    cedula: '1000100001',
    locationId: 'loc-1',
    locationName: 'Sede Centro',
    contractType: EmployeeContractType.INDEFINIDO,
    salaryType: SalaryType.ORDINARIO,
    salaryAmount: 1800000,
    workedDays: 30,
    calendarDays: 30,
    salaryBase: 1800000,
    transportSubsidy: 162000,
    overtimePay: 0,
    overtimeBreakdown: [],
    grossPay: 1962000,
    healthDeduction: 72000,
    pensionDeduction: 72000,
    incomeTaxWithholding: 0,
    totalDeductions: 144000,
    netPay: 1818000,
    employerHealthContribution: 153000,
    employerPensionContribution: 216000,
    employerArlContribution: 9399,
    employerSenaContribution: 36000,
    employerIcbfContribution: 54000,
    employerCajaContribution: 72000,
    totalEmployerContributions: 540399,
    totalPayrollCost: 2358399,
    ...overrides,
  };
}

function makeReport(
  employees: PayrollReportResponseDto['employees'] = [],
): PayrollReportResponseDto {
  const totalNetPay = employees.reduce((s, r) => s + r.netPay, 0);
  const totalEmployerContributions = employees.reduce(
    (s, r) => s + r.totalEmployerContributions,
    0,
  );
  const totalDeductions = employees.reduce((s, r) => s + r.totalDeductions, 0);
  const totalGrossPay = employees.reduce((s, r) => s + r.grossPay, 0);
  const totalPayrollCost = employees.reduce((s, r) => s + r.totalPayrollCost, 0);
  return {
    tenantId: 'tenant-test',
    period: { year: 2025, month: 6 },
    employees,
    tenantTotals: {
      employeeCount: employees.length,
      totalGrossPay,
      totalDeductions,
      totalNetPay,
      totalEmployerContributions,
      totalPayrollCost,
    },
    locationTotals: [],
  };
}

describe('ReportPdfService', () => {
  let service: ReportPdfService;

  beforeEach(() => {
    service = new ReportPdfService();
  });

  describe('generatePayrollPdf', () => {
    it('returns a Buffer', async () => {
      // Arrange
      const report = makeReport();

      // Act
      const result = await service.generatePayrollPdf(report);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
    });

    it('starts with PDF magic bytes %PDF', async () => {
      // Arrange
      const report = makeReport([makeEmployee()]);

      // Act
      const buffer = await service.generatePayrollPdf(report);

      // Assert
      expect(buffer.slice(0, 4)).toEqual(PDF_MAGIC);
    });

    it('generates non-empty buffer for empty employee list', async () => {
      // Arrange
      const report = makeReport([]);

      // Act
      const buffer = await service.generatePayrollPdf(report);

      // Assert
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.slice(0, 4)).toEqual(PDF_MAGIC);
    });

    it('generates a larger buffer when employees are present', async () => {
      // Arrange
      const emptyReport = makeReport([]);
      const oneEmpReport = makeReport([makeEmployee()]);

      // Act
      const emptyBuffer = await service.generatePayrollPdf(emptyReport);
      const oneEmpBuffer = await service.generatePayrollPdf(oneEmpReport);

      // Assert — more content = larger (or equal) buffer
      expect(oneEmpBuffer.length).toBeGreaterThanOrEqual(emptyBuffer.length);
    });

    it('handles employee with overtime pay', async () => {
      // Arrange
      const emp = makeEmployee({
        overtimePay: 90000,
        overtimeBreakdown: [
          {
            type: 'DIURNO',
            minutes: 120,
            hourlyRate: 11250,
            surchargeRate: 0.25,
            amount: 56250,
          },
          {
            type: 'NOCTURNO',
            minutes: 90,
            hourlyRate: 11250,
            surchargeRate: 0.75,
            amount: 33750,
          },
        ],
      });
      const report = makeReport([emp]);

      // Act
      const buffer = await service.generatePayrollPdf(report);

      // Assert — should complete without error
      expect(buffer.slice(0, 4)).toEqual(PDF_MAGIC);
    });

    it('handles employee names longer than 24 characters (truncation)', async () => {
      // Arrange
      const emp = makeEmployee({ employeeName: 'María Fernanda Rodríguez Bustamante' });
      const report = makeReport([emp]);

      // Act & Assert — must not throw
      await expect(service.generatePayrollPdf(report)).resolves.toBeInstanceOf(Buffer);
    });

    it('handles multiple employees triggering page layout', async () => {
      // Arrange
      const employees = Array.from({ length: 30 }, (_, i) =>
        makeEmployee({ employeeId: `emp-${i}`, employeeName: `Empleado Prueba ${i + 1}` }),
      );
      const report = makeReport(employees);

      // Act
      const buffer = await service.generatePayrollPdf(report);

      // Assert
      expect(buffer.slice(0, 4)).toEqual(PDF_MAGIC);
    });

    it('produces a buffer larger than the empty-report baseline', async () => {
      // Arrange
      const emptyBuffer = await service.generatePayrollPdf(makeReport([]));
      const report = makeReport([makeEmployee()]);

      // Act
      const buffer = await service.generatePayrollPdf(report);

      // Assert — one employee adds content → buffer should be strictly larger
      expect(buffer.length).toBeGreaterThan(emptyBuffer.length);
    });
  });
});
