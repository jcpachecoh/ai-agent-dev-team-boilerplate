import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import { PayrollReportResponseDto } from '../controller/dto/payroll-report-response.dto';

// ── Constants ──────────────────────────────────────────────────────────────────

const MARGIN = 30;
const PAGE_WIDTH = 841.89; // A4 landscape
const PAGE_HEIGHT = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const HEADER_ROW_HEIGHT = 20;
const BODY_ROW_HEIGHT = 16;
const FOOTER_BUFFER = 60; // reserved space at page bottom before adding new page

const DARK_BLUE = '#1a3a5c';
const ALT_ROW = '#f5f6f8';
const TOTALS_ROW = '#dce3ec';
const BORDER = '#c8d0da';
const GAP_COLOR = '#888888';

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

interface ColDef {
  header: string;
  width: number;
  align: 'left' | 'center' | 'right';
  key: string;
}

const COLUMNS: ColDef[] = [
  { header: 'Nombre', width: 132, align: 'left', key: 'name' },
  { header: 'Cédula', width: 68, align: 'center', key: 'cedula' },
  { header: 'Sede', width: 72, align: 'left', key: 'location' },
  { header: 'Sal. Base', width: 64, align: 'right', key: 'salary' },
  { header: 'Aux. Transp.', width: 58, align: 'right', key: 'transport' },
  { header: 'HH. Extra', width: 58, align: 'right', key: 'overtime' },
  { header: 'Deducciones', width: 66, align: 'right', key: 'deductions' },
  { header: 'Neto', width: 68, align: 'right', key: 'net' },
  { header: 'Aportes Emp.', width: 68, align: 'right', key: 'contributions' },
  { header: 'Costo Total', width: 68, align: 'right', key: 'cost' },
];

const TABLE_WIDTH = COLUMNS.reduce((s, c) => s + c.width, 0); // 782

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCOP(n: number): string {
  return (
    '$' +
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

function trunc(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): void {
  doc.rect(MARGIN, y, TABLE_WIDTH, HEADER_ROW_HEIGHT).fill(DARK_BLUE);

  let x = MARGIN;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
  for (const col of COLUMNS) {
    doc.text(col.header, x + 3, y + 6, {
      width: col.width - 6,
      align: col.align,
      lineBreak: false,
    });
    x += col.width;
  }
  doc.fillColor('#000000');
}

function drawBorderLines(doc: PDFKit.PDFDocument, y: number, rowHeight: number): void {
  // bottom border
  doc
    .moveTo(MARGIN, y + rowHeight)
    .lineTo(MARGIN + TABLE_WIDTH, y + rowHeight)
    .strokeColor(BORDER)
    .stroke();
  // column separators
  let x = MARGIN;
  for (const col of COLUMNS) {
    x += col.width;
    doc
      .moveTo(x, y)
      .lineTo(x, y + rowHeight)
      .strokeColor(BORDER)
      .stroke();
  }
  // left border
  doc
    .moveTo(MARGIN, y)
    .lineTo(MARGIN, y + rowHeight)
    .strokeColor(BORDER)
    .stroke();
  doc.strokeColor('#000000');
}

function drawDataRow(
  doc: PDFKit.PDFDocument,
  y: number,
  values: string[],
  isEven: boolean,
  isTotals = false,
): void {
  const bg = isTotals ? TOTALS_ROW : isEven ? ALT_ROW : '#ffffff';
  doc.rect(MARGIN, y, TABLE_WIDTH, BODY_ROW_HEIGHT).fill(bg);

  let x = MARGIN;
  doc
    .font(isTotals ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(8)
    .fillColor('#000000');
  for (let i = 0; i < COLUMNS.length; i++) {
    const col = COLUMNS[i];
    doc.text(values[i] ?? '', x + 3, y + 4, {
      width: col.width - 6,
      align: col.align,
      lineBreak: false,
    });
    x += col.width;
  }

  drawBorderLines(doc, y, BODY_ROW_HEIGHT);
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class ReportPdfService {
  generatePayrollPdf(report: PayrollReportResponseDto): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: MARGIN,
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawDocument(doc, report);
      doc.end();
    });
  }

  private drawDocument(doc: PDFKit.PDFDocument, report: PayrollReportResponseDto): void {
    const { tenantId, period, employees, tenantTotals } = report;
    const monthName = MONTH_NAMES_ES[period.month - 1] ?? String(period.month);

    // ── Page title block ──────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor('#000000')
      .text('REPORTE DE NÓMINA', MARGIN, MARGIN, { width: CONTENT_WIDTH, align: 'center' });

    doc.font('Helvetica').fontSize(9.5).moveDown(0.35);
    doc.text(`Tenant: ${tenantId}`, MARGIN, doc.y);
    doc.text(`Período: ${monthName} ${period.year}`);
    const genDate = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(`Generado: ${genDate}`);

    // GAP notice — festivos implemented in Task04A; retención en fuente pending Task04-F
    doc
      .moveDown(0.4)
      .font('Helvetica-Oblique')
      .fontSize(7.5)
      .fillColor(GAP_COLOR)
      .text(
        'GAP pendiente (Task04-F): retención en la fuente siempre 0 (Ley 2277/2022 / rangos UVT no implementados).',
        MARGIN,
        doc.y,
      )
      .fillColor('#000000');

    doc.moveDown(0.7);

    // ── Table ─────────────────────────────────────────────────────────────────
    let y = doc.y;
    drawTableHeader(doc, y);
    y += HEADER_ROW_HEIGHT;

    for (let i = 0; i < employees.length; i++) {
      if (y + BODY_ROW_HEIGHT > PAGE_HEIGHT - MARGIN - FOOTER_BUFFER) {
        doc.addPage();
        y = MARGIN;
        drawTableHeader(doc, y);
        y += HEADER_ROW_HEIGHT;
      }

      const emp = employees[i];
      drawDataRow(
        doc,
        y,
        [
          trunc(emp.employeeName, 24),
          emp.cedula,
          trunc(emp.locationName, 14),
          formatCOP(emp.salaryBase),
          formatCOP(emp.transportSubsidy),
          formatCOP(emp.overtimePay),
          formatCOP(emp.totalDeductions),
          formatCOP(emp.netPay),
          formatCOP(emp.totalEmployerContributions),
          formatCOP(emp.totalPayrollCost),
        ],
        i % 2 === 0,
      );

      y += BODY_ROW_HEIGHT;
    }

    // Totals row
    if (y + BODY_ROW_HEIGHT > PAGE_HEIGHT - MARGIN - FOOTER_BUFFER) {
      doc.addPage();
      y = MARGIN;
    }

    const empSalarySum = employees.reduce((s, r) => s + r.salaryBase, 0);
    const empTransportSum = employees.reduce((s, r) => s + r.transportSubsidy, 0);
    const empOtSum = employees.reduce((s, r) => s + r.overtimePay, 0);

    drawDataRow(
      doc,
      y,
      [
        `TOTAL (${tenantTotals.employeeCount} empleados)`,
        '',
        '',
        formatCOP(empSalarySum),
        formatCOP(empTransportSum),
        formatCOP(empOtSum),
        formatCOP(tenantTotals.totalDeductions),
        formatCOP(tenantTotals.totalNetPay),
        formatCOP(tenantTotals.totalEmployerContributions),
        formatCOP(tenantTotals.totalPayrollCost),
      ],
      false,
      true,
    );

    y += BODY_ROW_HEIGHT + 12;

    // outer border
    doc.rect(MARGIN, doc.y > y ? doc.y : y, TABLE_WIDTH, 0).stroke(BORDER);

    // ── Footer summary ────────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#444444')
      .text(
        `${tenantTotals.employeeCount} empleados  •  Neto total: ${formatCOP(tenantTotals.totalNetPay)}` +
          `  •  Aportes patronales: ${formatCOP(tenantTotals.totalEmployerContributions)}` +
          `  •  Costo total nómina: ${formatCOP(tenantTotals.totalPayrollCost)}`,
        MARGIN,
        y,
        { width: CONTENT_WIDTH, align: 'center' },
      );
  }
}
