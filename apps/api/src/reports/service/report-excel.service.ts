import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PayrollReportResponseDto } from '../controller/dto/payroll-report-response.dto';

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
const GAP_GRAY = { argb: 'FF888888' };

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
  async generatePayrollXlsx(report: PayrollReportResponseDto): Promise<Buffer> {
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
    const genDate = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    sheet.addRow([`Generado: ${genDate}`]);

    // GAP notice
    const gapRow = sheet.addRow([
      'GAP pendiente (Task04-F): retención en la fuente siempre 0 (Ley 2277/2022 / rangos UVT no implementados).',
    ]);
    gapRow.font = { italic: true, size: 8, color: GAP_GRAY };
    sheet.mergeCells(`A4:J4`);

    sheet.addRow([]); // row 5 — separator

    // ── Header row (row 6) ───────────────────────────────────────────────────
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

  private applyMoneyFormat(row: ExcelJS.Row): void {
    COLUMNS.forEach(([, , isMoney], idx) => {
      if (isMoney) {
        row.getCell(idx + 1).numFmt = MONEY_FMT;
      }
    });
  }
}
