import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import type { CollaboratorExportRow } from '../interfaces/attendance-collaborators.interfaces';

const MARGIN = 30;
const PAGE_WIDTH = 841.89; // A4 landscape
const PAGE_HEIGHT = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const HEADER_ROW_HEIGHT = 18;
const BODY_ROW_HEIGHT = 15;
const FOOTER_BUFFER = 40;

const DARK_BLUE = '#1a3a5c';
const ALT_ROW = '#f5f6f8';
const BORDER = '#c8d0da';

interface ColDef {
  header: string;
  width: number;
  key: keyof CollaboratorExportRow;
}

const COLUMNS: ColDef[] = [
  { header: 'Documento', width: 78, key: 'cedula' },
  { header: 'Primer apellido', width: 90, key: 'primerApellido' },
  { header: 'Segundo apellido', width: 90, key: 'segundoApellido' },
  { header: 'Nombre', width: 120, key: 'name' },
  { header: 'Especialidad', width: 100, key: 'positionName' },
  { header: 'Área', width: 80, key: 'area' },
  { header: 'Supervisor', width: 120, key: 'supervisorsLabel' },
  { header: 'Contrato', width: 75, key: 'contractType' },
  { header: 'Turno', width: 95, key: 'turnoLabel' },
  { header: 'Portal trabajador', width: 90, key: 'portalLabel' },
];

const TABLE_WIDTH = COLUMNS.reduce((s, c) => s + c.width, 0);

export interface CollaboratorsExportMeta {
  generatedAt: string;
  filtersSummary?: string;
}

function trunc(value: string, maxLen: number): string {
  return value.length > maxLen ? `${value.slice(0, maxLen - 1)}…` : value;
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): void {
  doc.rect(MARGIN, y, TABLE_WIDTH, HEADER_ROW_HEIGHT).fill(DARK_BLUE);

  let x = MARGIN;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
  for (const col of COLUMNS) {
    doc.text(col.header, x + 3, y + 5, { width: col.width - 6, lineBreak: false });
    x += col.width;
  }
  doc.fillColor('#000000');
}

function drawDataRow(
  doc: PDFKit.PDFDocument,
  y: number,
  row: CollaboratorExportRow,
  isEven: boolean,
): void {
  doc.rect(MARGIN, y, TABLE_WIDTH, BODY_ROW_HEIGHT).fill(isEven ? ALT_ROW : '#ffffff');

  let x = MARGIN;
  doc.font('Helvetica').fontSize(7.5).fillColor('#000000');
  for (const col of COLUMNS) {
    doc.text(trunc(row[col.key] ?? '', 28), x + 3, y + 4, {
      width: col.width - 6,
      lineBreak: false,
    });
    x += col.width;
  }

  doc
    .moveTo(MARGIN, y + BODY_ROW_HEIGHT)
    .lineTo(MARGIN + TABLE_WIDTH, y + BODY_ROW_HEIGHT)
    .strokeColor(BORDER)
    .stroke();
  doc.strokeColor('#000000');
}

@Injectable()
export class AttendanceCollaboratorsPdfService {
  generatePdf(rows: CollaboratorExportRow[], meta: CollaboratorsExportMeta): Promise<Buffer> {
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

      this.drawDocument(doc, rows, meta);
      doc.end();
    });
  }

  private drawDocument(
    doc: PDFKit.PDFDocument,
    rows: CollaboratorExportRow[],
    meta: CollaboratorsExportMeta,
  ): void {
    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor('#000000')
      .text('LISTADO DE COLABORADORES', MARGIN, MARGIN, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    doc.font('Helvetica').fontSize(9).moveDown(0.35);
    doc.text(`Generado: ${meta.generatedAt}`, MARGIN, doc.y);
    doc.text(`Registros: ${rows.length}`);
    if (meta.filtersSummary) {
      doc.text(`Filtros aplicados: ${meta.filtersSummary}`);
    }

    doc.moveDown(0.6);

    let y = doc.y;
    drawTableHeader(doc, y);
    y += HEADER_ROW_HEIGHT;

    for (let i = 0; i < rows.length; i++) {
      if (y + BODY_ROW_HEIGHT > PAGE_HEIGHT - MARGIN - FOOTER_BUFFER) {
        doc.addPage();
        y = MARGIN;
        drawTableHeader(doc, y);
        y += HEADER_ROW_HEIGHT;
      }

      drawDataRow(doc, y, rows[i], i % 2 === 0);
      y += BODY_ROW_HEIGHT;
    }
  }
}
