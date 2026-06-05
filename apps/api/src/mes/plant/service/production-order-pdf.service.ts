import { Injectable } from '@nestjs/common';
import { ProductionQualityCheckType, StockUnit } from '@prisma/client';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import type { OrderDetailResponse } from '../interfaces/plant.interfaces';
import { PlantService } from './plant.service';

const BOGOTA_TZ = 'America/Bogota';
const MARGIN = 36;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const QUALITY_CHECK_LABELS: Record<ProductionQualityCheckType, string> = {
  [ProductionQualityCheckType.LIBERACION_MP]: 'LIBERACION MP',
  [ProductionQualityCheckType.CORRECCION]: 'CORRECCION',
  [ProductionQualityCheckType.ACCION_CORRECTIVA]: 'ACCION CORRECTIVA',
  [ProductionQualityCheckType.ENTREGA]: 'ENTREGA',
  [ProductionQualityCheckType.RECIBE]: 'RECIBE',
};

const QUALITY_CHECK_ORDER: ProductionQualityCheckType[] = [
  ProductionQualityCheckType.LIBERACION_MP,
  ProductionQualityCheckType.CORRECCION,
  ProductionQualityCheckType.ACCION_CORRECTIVA,
  ProductionQualityCheckType.ENTREGA,
  ProductionQualityCheckType.RECIBE,
];

const UNIT_LABELS: Record<StockUnit, string> = {
  [StockUnit.UNIT]: 'UND',
  [StockUnit.GRAMS]: 'GR',
  [StockUnit.KILOGRAMS]: 'KG',
  [StockUnit.ML]: 'ML',
  [StockUnit.LITERS]: 'LT',
  [StockUnit.BOX]: 'CAJ',
};

interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

@Injectable()
export class ProductionOrderPdfService {
  constructor(private readonly plantService: PlantService) {}

  async buildPdf(tenantId: string, orderId: string): Promise<{ buffer: Buffer; number: string }> {
    const order = await this.plantService.findOrderById(tenantId, orderId);
    const buffer = await this.renderPdf(order);
    return { buffer, number: order.number };
  }

  private renderPdf(order: OrderDetailResponse): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: MARGIN, autoFirstPage: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawPage(doc, order);
      doc.end();
    });
  }

  private drawPage(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    this.drawHeader(doc);
    this.drawOrderInfo(doc, order);
    this.drawMaterialsTable(doc, order);
    this.drawProductionSpecs(doc, order);
    this.drawProcessRoutesTable(doc, order);
    this.drawQualityTable(doc, order);
    this.drawByproductsTable(doc, order);
    this.drawObservations(doc, order);
  }

  private drawHeader(doc: PDFKit.PDFDocument): void {
    const top = MARGIN;
    const logoPath = this.resolveLogoPath();
    if (logoPath) {
      doc.image(logoPath, MARGIN, top, { width: 95, height: 40, fit: [95, 40] });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('ORDEN DE PRODUCCIÓN', MARGIN, top + 10, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    const boxWidth = 145;
    const boxX = MARGIN + CONTENT_WIDTH - boxWidth;
    doc.rect(boxX, top, boxWidth, 48).stroke();
    doc
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text('COPIA CONTROLADA', boxX, top + 4, { width: boxWidth, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .text('CÓDIGO: XXXXX', boxX + 4, top + 16, { width: boxWidth - 8 })
      .text('VERSIÓN: XXXXX', boxX + 4, top + 26, { width: boxWidth - 8 })
      .text('EMISIÓN: XXXXX', boxX + 4, top + 36, { width: boxWidth - 8 });

    doc.y = top + 56;
  }

  private drawOrderInfo(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    const y = doc.y;
    const rowHeight = 18;
    const leftWidth = CONTENT_WIDTH * 0.55;
    const rightWidth = CONTENT_WIDTH - leftWidth;

    this.drawBorderedRow(doc, MARGIN, y, CONTENT_WIDTH, rowHeight * 2);
    this.drawCellDivider(doc, MARGIN + leftWidth, y, rowHeight * 2);

    doc.font('Helvetica-Bold').fontSize(8);
    doc.text(`ITEM: ${order.recipeName}`, MARGIN + 4, y + 5, { width: leftWidth - 8 });
    doc.text(
      `FECHA DE GENERACIÓN OP: ${this.formatDate(order.createdAt)}`,
      MARGIN + leftWidth + 4,
      y + 5,
      { width: rightWidth - 8 },
    );
    doc.text(`OP. N°: ${order.number}`, MARGIN + 4, y + rowHeight + 5, { width: leftWidth - 8 });
    if (order.lotNumber) {
      doc.text(`LOTE PT: ${order.lotNumber}`, MARGIN + leftWidth + 4, y + rowHeight + 5, {
        width: rightWidth - 8,
      });
    }

    doc.y = y + rowHeight * 2 + 6;
  }

  private drawMaterialsTable(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    const columns: TableColumn[] = [
      { header: 'MATERIALES', width: 175 },
      { header: 'LOTE', width: 68 },
      { header: 'CANT. REQUERIDA', width: 88 },
      { header: 'CANT. CONSUMIDA', width: 88 },
      { header: 'UNIDAD', width: 104 },
    ];

    const rows =
      (order.materials ?? []).length > 0
        ? (order.materials ?? []).map((material) => [
            material.materialName,
            material.lotNumber ?? '',
            this.formatDecimal(material.requiredQuantity),
            material.consumedQuantity ? this.formatDecimal(material.consumedQuantity) : '',
            this.formatUnit(material.unit),
          ])
        : [];

    this.drawTable(doc, columns, rows, { minRows: 4, headerFontSize: 7, bodyFontSize: 7 });
    doc.moveDown(0.4);
  }

  private drawProductionSpecs(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    const y = doc.y;
    const colWidth = CONTENT_WIDTH / 2;
    const rowHeight = 16;

    const leftRows: Array<[string, string]> = [
      ['FECHA DE PRODUCCIÓN', order.productionDate ? this.formatDate(order.productionDate) : ''],
      [
        'FECHA DE ENTREGA DE PRODUCCIÓN',
        order.deliveryDate ? this.formatDate(order.deliveryDate) : '',
      ],
      ['PRODUCCIÓN ESPERADA KG', this.formatDecimal(order.plannedQuantity)],
      [
        'PRODUCCIÓN OBTENIDA (KGS)',
        order.producedQuantity ? this.formatDecimal(order.producedQuantity) : '',
      ],
    ];

    const rightRows: Array<[string, string]> = [
      ['CANTIDAD DE BATCHES A PRODUCIR', String(order.batchCount)],
      [
        'PESO APROXIMADO POR PAQUETE',
        order.packageWeight ? this.formatDecimal(order.packageWeight) : '',
      ],
      ['PESO TOTAL DEL BATCHE', order.batchWeight ? this.formatDecimal(order.batchWeight) : ''],
      ['', ''],
    ];

    const totalHeight = rowHeight * leftRows.length;
    this.drawBorderedRow(doc, MARGIN, y, CONTENT_WIDTH, totalHeight);
    this.drawCellDivider(doc, MARGIN + colWidth, y, totalHeight);

    for (let index = 0; index < leftRows.length; index++) {
      const rowY = y + index * rowHeight;
      if (index > 0) {
        doc
          .moveTo(MARGIN, rowY)
          .lineTo(MARGIN + CONTENT_WIDTH, rowY)
          .stroke();
      }

      const [leftLabel, leftValue] = leftRows[index];
      const [rightLabel, rightValue] = rightRows[index];

      doc.font('Helvetica-Bold').fontSize(6.5);
      doc.text(`${leftLabel}:`, MARGIN + 4, rowY + 4, { width: colWidth * 0.62, lineBreak: false });
      doc.font('Helvetica').text(leftValue, MARGIN + colWidth * 0.62, rowY + 4, {
        width: colWidth * 0.36,
        lineBreak: false,
        align: 'right',
      });

      if (rightLabel) {
        doc.font('Helvetica-Bold').text(`${rightLabel}:`, MARGIN + colWidth + 4, rowY + 4, {
          width: colWidth * 0.62,
          lineBreak: false,
        });
        doc.font('Helvetica').text(rightValue, MARGIN + colWidth + colWidth * 0.62, rowY + 4, {
          width: colWidth * 0.36,
          lineBreak: false,
          align: 'right',
        });
      }
    }

    doc.y = y + totalHeight + 6;
  }

  private drawProcessRoutesTable(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    doc.font('Helvetica-Bold').fontSize(8).text('RUTAS DE PROCESO', MARGIN, doc.y);
    doc.y += 12;

    const columns: TableColumn[] = [
      { header: 'OPERACIÓN', width: 118 },
      { header: 'HORA INICIAL', width: 62 },
      { header: 'HORA FINAL', width: 62 },
      { header: 'N° OPER.', width: 48 },
      { header: 'CANT. ENTREGADA', width: 88 },
      { header: 'RESPONSABLE', width: 145 },
    ];

    const rows =
      order.executions.length > 0
        ? order.executions.map((execution) => [
            execution.phaseName,
            execution.startedAt ? this.formatTime(execution.startedAt) : '',
            execution.completedAt ? this.formatTime(execution.completedAt) : '',
            execution.operatorCount != null ? String(execution.operatorCount) : '',
            execution.deliveredQuantity ? this.formatDecimal(execution.deliveredQuantity) : '',
            execution.responsibleName ?? '',
          ])
        : [];

    this.drawTable(doc, columns, rows, { minRows: 3, headerFontSize: 6.5, bodyFontSize: 7 });
    doc.moveDown(0.4);
  }

  private drawQualityTable(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    doc.font('Helvetica-Bold').fontSize(8).text('LIBERACION MP', MARGIN, doc.y);
    doc.y += 12;

    const columns: TableColumn[] = [
      { header: '', width: 103 },
      { header: 'TEMPERATURA', width: 105 },
      { header: 'COLOR', width: 105 },
      { header: 'OLOR', width: 105 },
      { header: 'TEXTURA', width: 105 },
    ];

    const checkByType = new Map(
      (order.qualityChecks ?? []).map((check) => [check.checkType, check]),
    );
    const rows = QUALITY_CHECK_ORDER.map((checkType) => {
      const check = checkByType.get(checkType);
      return [
        QUALITY_CHECK_LABELS[checkType],
        check?.temperature ?? '',
        check?.color ?? '',
        check?.smell ?? '',
        check?.texture ?? '',
      ];
    });

    this.drawTable(doc, columns, rows, { headerFontSize: 6.5, bodyFontSize: 7 });
    doc.moveDown(0.4);
  }

  private drawByproductsTable(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    doc.font('Helvetica-Bold').fontSize(8).text('COPRODUCTOS', MARGIN, doc.y);
    doc.y += 12;

    const columns: TableColumn[] = [
      { header: 'ITEM', width: 143 },
      { header: 'UM', width: 48 },
      { header: 'CANTIDAD REAL', width: 98 },
      { header: 'LOTE', width: 98 },
      { header: 'VENCE', width: 136 },
    ];

    const rows =
      (order.byproducts ?? []).length > 0
        ? (order.byproducts ?? []).map((byproduct) => [
            byproduct.itemName,
            this.formatUnit(byproduct.unit),
            byproduct.actualQuantity ? this.formatDecimal(byproduct.actualQuantity) : '',
            byproduct.lotNumber ?? '',
            byproduct.expirationDate ? this.formatDate(byproduct.expirationDate) : '',
          ])
        : [];

    this.drawTable(doc, columns, rows, { minRows: 2, headerFontSize: 6.5, bodyFontSize: 7 });
    doc.moveDown(0.4);
  }

  private drawObservations(doc: PDFKit.PDFDocument, order: OrderDetailResponse): void {
    doc.font('Helvetica-Bold').fontSize(8).text('OBSERVACIONES:', MARGIN, doc.y);
    const boxY = doc.y + 10;
    doc.rect(MARGIN, boxY, CONTENT_WIDTH, 52).stroke();
    doc
      .font('Helvetica')
      .fontSize(7)
      .text(order.notes ?? '', MARGIN + 4, boxY + 4, { width: CONTENT_WIDTH - 8, height: 44 });
    doc.y = boxY + 56;
  }

  private drawTable(
    doc: PDFKit.PDFDocument,
    columns: TableColumn[],
    rows: string[][],
    options: {
      minRows?: number;
      headerFontSize?: number;
      bodyFontSize?: number;
      headerHeight?: number;
      rowHeight?: number;
    } = {},
  ): void {
    const headerHeight = options.headerHeight ?? 15;
    const rowHeight = options.rowHeight ?? 14;
    const headerFontSize = options.headerFontSize ?? 7;
    const bodyFontSize = options.bodyFontSize ?? 7;
    const minRows = options.minRows ?? 0;
    const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
    const paddedRows = [...rows];
    while (paddedRows.length < minRows) {
      paddedRows.push(columns.map(() => ''));
    }

    let y = doc.y;
    this.drawBorderedRow(doc, MARGIN, y, tableWidth, headerHeight);
    this.drawColumnDividers(doc, MARGIN, y, headerHeight, columns);

    let x = MARGIN;
    doc.font('Helvetica-Bold').fontSize(headerFontSize);
    for (const column of columns) {
      doc.text(column.header, x + 2, y + 4, {
        width: column.width - 4,
        align: column.align ?? 'center',
        lineBreak: false,
      });
      x += column.width;
    }

    y += headerHeight;

    doc.font('Helvetica').fontSize(bodyFontSize);
    for (const row of paddedRows) {
      this.drawBorderedRow(doc, MARGIN, y, tableWidth, rowHeight);
      this.drawColumnDividers(doc, MARGIN, y, rowHeight, columns);

      x = MARGIN;
      for (let index = 0; index < columns.length; index++) {
        const column = columns[index];
        const value = row[index] ?? '';
        doc.text(value, x + 2, y + 3, {
          width: column.width - 4,
          align: index === 0 ? 'left' : (column.align ?? 'center'),
          lineBreak: false,
        });
        x += column.width;
      }

      y += rowHeight;
    }

    doc.y = y;
  }

  private drawBorderedRow(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    doc.rect(x, y, width, height).stroke();
  }

  private drawCellDivider(doc: PDFKit.PDFDocument, x: number, y: number, height: number): void {
    doc
      .moveTo(x, y)
      .lineTo(x, y + height)
      .stroke();
  }

  private drawColumnDividers(
    doc: PDFKit.PDFDocument,
    startX: number,
    y: number,
    height: number,
    columns: TableColumn[],
  ): void {
    let x = startX;
    for (let index = 0; index < columns.length - 1; index++) {
      x += columns[index].width;
      this.drawCellDivider(doc, x, y, height);
    }
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    }).format(value);
  }

  private formatTime(value: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      timeZone: BOGOTA_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(value);
  }

  private formatDecimal(value: string): string {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) {
      return value;
    }
    return parsed.toFixed(3);
  }

  private formatUnit(unit: StockUnit | string): string {
    if (unit in UNIT_LABELS) {
      return UNIT_LABELS[unit as StockUnit];
    }
    return unit;
  }

  private resolveLogoPath(): string | null {
    const candidates = [
      path.join(process.cwd(), 'assets/branding/palos-de-lena-logo.png'),
      path.join(__dirname, '../../../../assets/branding/palos-de-lena-logo.png'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}
