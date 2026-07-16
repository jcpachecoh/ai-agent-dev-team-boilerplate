import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PayrollReportResponseDto } from '../controller/dto/payroll-report-response.dto';
import { EmployeeListReportResponseDto } from '../controller/dto/employee-list-report-response.dto';
import { AttendanceReportResponseDto } from '../controller/dto/attendance-report-response.dto';
import { EmployeeListReportType } from '../controller/dto/employee-list-export-query.dto';

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DARK_BLUE = { argb: 'FF1A3A5C' };
const WHITE = { argb: 'FFFFFFFF' };
const ALT_ROW = { argb: 'FFF5F6F8' };
const TOTALS_ROW = { argb: 'FFDCE3EC' };

const SOLID = (fgColor: { argb: string }): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: fgColor as ExcelJS.Color,
});

const MONEY_FMT = '#,##0';

// Column definitions: [header label, width, isMoneyColumn]
const COLUMNS: [string, number, boolean][] = [
  ['Empleado', 32, false],
  ['Cédula', 15, false],
  ['Sede', 18, false],
  ['Sal. Base', 16, true],
  ['Aux. Transp.', 16, true],
  ['HH. Extra', 14, true],
  ['Deducciones', 16, true],
  ['Neto', 16, true],
  ['Aportes Emp.', 16, true],
  ['Costo Total', 16, true],
];

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class ReportExcelService {
  async generatePayrollXlsx(
    report: PayrollReportResponseDto,
    filtersSummary?: string[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestOpsIQ';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Nómina', {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    // ── Column widths ────────────────────────────────────────────────────────
    sheet.columns = COLUMNS.map(([, width]) => ({ width }));

    // ── Metadata rows (1-4) ──────────────────────────────────────────────────
    const { period, tenantId, employees, tenantTotals } = report;
    const monthName = MONTH_NAMES_ES[period.month - 1] ?? String(period.month);

    const titleRow = sheet.addRow([`REPORTE DE NÓMINA — ${monthName} ${period.year}`]);
    titleRow.font = { bold: true, size: 13 };
    sheet.mergeCells(`A1:J1`);

    sheet.addRow([`Tenant: ${tenantId}`]);
    if (filtersSummary?.length) {
      for (const line of filtersSummary) {
        sheet.addRow([line]);
      }
    }
    const genDate = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    sheet.addRow([`Generado: ${genDate}`]);

    sheet.addRow([]); // separator before header

    // ── Header row ───────────────────────────────────────────────────────────
    const headerRow = sheet.addRow(COLUMNS.map(([label]) => label));
    headerRow.font = { bold: true, color: WHITE };
    headerRow.fill = SOLID(DARK_BLUE);
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    // ── Data rows ────────────────────────────────────────────────────────────
    for (const [i, emp] of employees.entries()) {
      const dataRow = sheet.addRow([
        emp.employeeName,
        emp.cedula,
        emp.locationName,
        emp.salaryBase,
        emp.transportSubsidy,
        emp.overtimePay,
        emp.totalDeductions,
        emp.netPay,
        emp.totalEmployerContributions,
        emp.totalPayrollCost,
      ]);

      if (i % 2 === 0) {
        dataRow.fill = SOLID(ALT_ROW);
      }

      // Apply money format to numeric columns
      this.applyMoneyFormat(dataRow);
    }

    // ── Totals row ───────────────────────────────────────────────────────────
    const empSalarySum = employees.reduce((s, r) => s + r.salaryBase, 0);
    const empTransportSum = employees.reduce((s, r) => s + r.transportSubsidy, 0);
    const empOtSum = employees.reduce((s, r) => s + r.overtimePay, 0);

    const totalsRow = sheet.addRow([
      `Total (${tenantTotals.employeeCount} empleados)`,
      '',
      '',
      empSalarySum,
      empTransportSum,
      empOtSum,
      tenantTotals.totalDeductions,
      tenantTotals.totalNetPay,
      tenantTotals.totalEmployerContributions,
      tenantTotals.totalPayrollCost,
    ]);
    totalsRow.font = { bold: true };
    totalsRow.fill = SOLID(TOTALS_ROW);
    this.applyMoneyFormat(totalsRow);

    // ── Return buffer ────────────────────────────────────────────────────────
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }

  async generateEmployeeListXlsx(
    report: EmployeeListReportResponseDto,
    reportType: EmployeeListReportType = EmployeeListReportType.EMPLOYEES,
  ): Promise<Buffer> {
    const columns =
      reportType === EmployeeListReportType.CONTRACTS
        ? ['Nombre', 'Contrato', 'Ingreso', 'Inicio', 'Fin', 'Sede', 'Estado']
        : ['Nombre', 'Cédula', 'Cargo', 'Área', 'Depto', 'Contrato', 'Sede', 'Estado', 'Salario'];

    const rows = report.employees.map((employee) =>
      reportType === EmployeeListReportType.CONTRACTS
        ? [
            employee.name,
            employee.contractType,
            employee.hireDate,
            employee.contractStart ?? '',
            employee.contractEnd ?? '',
            employee.locationName,
            employee.isActive ? 'Activo' : 'Inactivo',
          ]
        : [
            employee.name,
            employee.cedula,
            employee.position,
            employee.area,
            employee.department,
            employee.contractType,
            employee.locationName,
            employee.isActive ? 'Activo' : 'Inactivo',
            employee.salaryAmount,
          ],
    );

    return this.generateSimpleWorkbook({
      sheetName: reportType === EmployeeListReportType.CONTRACTS ? 'Contratos' : 'Empleados',
      title:
        reportType === EmployeeListReportType.CONTRACTS
          ? 'REPORTE DE CONTRATOS'
          : 'REPORTE DE EMPLEADOS',
      tenantId: report.tenantId,
      filtersSummary: report.filtersSummary,
      columns,
      rows,
    });
  }

  async generateAttendanceXlsx(
    report: AttendanceReportResponseDto,
    filtersSummary: string[],
  ): Promise<Buffer> {
    return this.generateSimpleWorkbook({
      sheetName: 'Asistencia',
      title: 'REPORTE DE ASISTENCIA',
      tenantId: report.tenantId,
      filtersSummary,
      columns: [
        'Empleado',
        'Cédula',
        'Sede',
        'Min. trabajadas',
        'Min. ordinarias',
        'Min. extra',
        'Días activos',
        'Días ausentes',
        'Alerta legal',
      ],
      rows: report.employees.map((employee) => [
        employee.employeeName,
        employee.cedula,
        employee.locationName,
        employee.totalWorkedMinutes,
        employee.regularMinutes,
        employee.overtimeMinutes,
        employee.activeDays,
        employee.absentDays,
        employee.exceededLegalOvertimeLimit ? 'Sí' : 'No',
      ]),
    });
  }

  private async generateSimpleWorkbook(options: {
    sheetName: string;
    title: string;
    tenantId: string;
    filtersSummary: string[];
    columns: string[];
    rows: Array<Array<string | number>>;
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestOpsIQ';
    const sheet = workbook.addWorksheet(options.sheetName);
    sheet.addRow([options.title]).font = { bold: true, size: 13 };
    sheet.addRow([`Tenant: ${options.tenantId}`]);
    for (const line of options.filtersSummary) {
      sheet.addRow([line]);
    }
    sheet.addRow([]);
    const headerRow = sheet.addRow(options.columns);
    headerRow.font = { bold: true };
    for (const row of options.rows) {
      sheet.addRow(row);
    }
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }

  private applyMoneyFormat(row: ExcelJS.Row): void {
    COLUMNS.forEach(([, , isMoney], idx) => {
      if (isMoney) {
        row.getCell(idx + 1).numFmt = MONEY_FMT;
      }
    });
  }
}
