import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ContractTerminationReason,
  FinalSettlementMode,
  FinalSettlementStatus,
  Prisma,
  SettlementLineType,
} from '@prisma/client';
import PDFDocument from 'pdfkit';
// `@types/pdfkit` no fusiona el valor exportado por defecto con un tipo utilizable
// (`PDFDocument` como identificador de tipo da TS2749) — el namespace `PDFKit` es la única
// forma de tipar `PDFKit.PDFDocument` en las firmas de los métodos de dibujo. Mismo patrón
// ya usado en `report-pdf.service.ts`/`vacation-letter.service.ts` (ambos con esta misma
// violación preexistente de `no-duplicate-imports` — falso positivo del linter para este
// caso de import de valor + import de tipo del mismo módulo por nombres distintos).
// eslint-disable-next-line no-duplicate-imports
import type PDFKit from 'pdfkit';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import {
  IFinalSettlementReceiptPdfService,
  type FinalSettlementReceiptResult,
} from '../interfaces/final-settlement-receipt.interfaces';
import type { IndemnificationFormulaValidationRecord } from '../interfaces/legal-formula-validation.interfaces';
import type { PendingSalaryReconciliationRecord } from '../interfaces/pending-salary-reconciliation.interfaces';
import { LegalFormulaValidationRepository } from '../repository/legal-formula-validation.repository';
import { PendingSalaryReconciliationRepository } from '../repository/pending-salary-reconciliation.repository';

// ── Constants ──────────────────────────────────────────────────────────────────

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_BUFFER = 70;
const BORDER = '#c8d0da';
const HEADER_BG = '#1a3a5c';
const ALT_ROW = '#f5f6f8';
const TOTALS_ROW = '#dce3ec';
const NEGATIVE_COLOR = '#a3241e';

/** Liquidaciones disponibles para comprobante — DRAFT no tiene snapshot completo y VOIDED
 * fue anulada (ver tasks/OS-591.md §15.9 punto 3: anular después de APPROVED no aplica, así
 * que APPROVED/PAID nunca conviven con VOIDED para la misma liquidación). */
const RECEIPT_AVAILABLE_STATUSES: readonly FinalSettlementStatus[] = [
  FinalSettlementStatus.CALCULATED,
  FinalSettlementStatus.APPROVED,
  FinalSettlementStatus.PAID,
];

const STATUS_LABELS: Record<FinalSettlementStatus, string> = {
  DRAFT: 'Borrador',
  CALCULATED: 'Calculada',
  APPROVED: 'Aprobada',
  PAID: 'Pagada',
  VOIDED: 'Anulada',
};

const MODE_LABELS: Record<FinalSettlementMode, string> = {
  AUTOMATIC: 'Automática',
  MANUAL: 'Manual',
};

const TERMINATION_REASON_LABELS: Record<ContractTerminationReason, string> = {
  RENUNCIA: 'Renuncia',
  JUSTA_CAUSA: 'Terminación con justa causa',
  SIN_JUSTA_CAUSA: 'Terminación sin justa causa',
  MUTUO_ACUERDO: 'Mutuo acuerdo',
  VENCIMIENTO_TERMINO: 'Vencimiento del término pactado',
  MUERTE_TRABAJADOR: 'Muerte del trabajador',
  OTRA: 'Otra',
};

const LINE_TYPE_LABELS: Record<SettlementLineType, string> = {
  DEVENGO: 'Devengos',
  DEDUCCION: 'Deducciones',
};

type SettlementWithRelations = Prisma.FinalSettlementGetPayload<{
  include: {
    lines: true;
    employee: { include: { user: true } };
  };
}>;

type ReceiptTenant = {
  legalName: string | null;
  tradeName: string | null;
  name: string;
  nit: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
};

type ReceiptContext = {
  settlement: SettlementWithRelations;
  tenant: ReceiptTenant;
  legalValidation: IndemnificationFormulaValidationRecord | null;
  reconciliation: PendingSalaryReconciliationRecord | null;
  logoBuffer: Buffer | null;
  generatedAt: Date;
};

function formatCOP(value: Prisma.Decimal | string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  const amount = typeof value === 'object' ? value.toNumber() : Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }
  return (
    '$' +
    Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  );
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('es-CO', { timeZone: 'UTC' });
}

/**
 * OS-591 (fase 5) — Comprobante PDF de liquidación definitiva, generado EXCLUSIVAMENTE a
 * partir del snapshot ya persistido en `FinalSettlement`/`SettlementLine` (nunca vuelve a
 * ejecutar el aggregator ni recalcula montos). No incluye texto de "paz y salvo" ni
 * declaraciones legales de liberación de responsabilidad — solo se listan hechos ya
 * registrados (líneas, totales, aprobador, pago, reconciliación, validación legal) tal cual
 * están en la base de datos.
 */
@Injectable()
export class FinalSettlementReceiptPdfService implements IFinalSettlementReceiptPdfService {
  private readonly logger = new Logger(FinalSettlementReceiptPdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly legalFormulaValidationRepository: LegalFormulaValidationRepository,
    private readonly pendingSalaryReconciliationRepository: PendingSalaryReconciliationRepository,
  ) {}

  async generateReceiptPdf(
    tenantId: string,
    id: string,
    generatedBy: string,
  ): Promise<FinalSettlementReceiptResult> {
    const settlement = await this.prisma.finalSettlement.findFirst({
      where: { tenantId, id },
      include: {
        lines: { orderBy: { sortOrder: 'asc' } },
        employee: { include: { user: true } },
      },
    });

    if (!settlement) {
      throw new NotFoundException(`Liquidación ${id} no encontrada`);
    }

    if (!RECEIPT_AVAILABLE_STATUSES.includes(settlement.status)) {
      throw new ConflictException(
        `El comprobante solo está disponible para liquidaciones CALCULATED, APPROVED o PAID ` +
          `(estado actual: ${settlement.status})`,
      );
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: {
        legalName: true,
        tradeName: true,
        name: true,
        nit: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        logoUrl: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const hasIndemnizacionLine = settlement.lines.some(
      (line): boolean => line.code === 'INDEMNIZACION',
    );
    const hasPendingSalaryLine = settlement.lines.some(
      (line): boolean => line.code === 'SAL_PENDIENTE',
    );

    const [legalValidation, reconciliation, logoBuffer] = await Promise.all([
      hasIndemnizacionLine && settlement.mode === FinalSettlementMode.AUTOMATIC
        ? this.legalFormulaValidationRepository.findActive(
            tenantId,
            settlement.snapshotFormulaVersion,
          )
        : Promise.resolve(null),
      hasPendingSalaryLine
        ? this.pendingSalaryReconciliationRepository.findBySettlement(tenantId, settlement.id)
        : Promise.resolve(null),
      this.tryLoadLogo(tenant.logoUrl),
    ]);

    const context: ReceiptContext = {
      settlement,
      tenant,
      legalValidation,
      reconciliation,
      logoBuffer,
      generatedAt: new Date(),
    };

    const buffer = await this.renderPdf(context);
    const filename = `liquidacion-definitiva-${settlement.id}.pdf`;

    await this.storageService.uploadFile({
      tenantId,
      uploadedBy: generatedBy,
      domain: StorageDomain.PAYROLL,
      entityType: 'FinalSettlement',
      entityId: settlement.id,
      visibility: StorageVisibility.PRIVATE,
      file: {
        buffer,
        mimetype: 'application/pdf',
        originalname: filename,
        size: buffer.byteLength,
      },
    });

    return { buffer, filename };
  }

  private async tryLoadLogo(logoUrl: string | null): Promise<Buffer | null> {
    if (!logoUrl?.trim()) {
      return null;
    }
    try {
      const response = await fetch(logoUrl);
      if (!response.ok) {
        this.logger.warn(`No se pudo cargar logo del tenant (${response.status}): ${logoUrl}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.warn(`Error cargando logo del tenant: ${String(error)}`);
      return null;
    }
  }

  private renderPdf(context: ReceiptContext): Promise<Buffer> {
    return new Promise((resolve, reject): void => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: MARGIN,
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer): number => chunks.push(chunk));
      doc.on('end', (): void => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawDocument(doc, context);
      doc.end();
    });
  }

  private drawDocument(doc: PDFKit.PDFDocument, context: ReceiptContext): void {
    let y = this.drawHeader(doc, context);
    y = this.drawEmployeeBlock(doc, y, context);
    y = this.drawStatusBlock(doc, y, context);
    y = this.drawLinesTable(doc, y, context);
    y = this.drawTotals(doc, y, context);

    if (context.settlement.mode === FinalSettlementMode.MANUAL) {
      y = this.drawManualSupportBlock(doc, y, context);
    }
    if (
      context.reconciliation ||
      context.settlement.lines.some((l): boolean => l.code === 'SAL_PENDIENTE')
    ) {
      y = this.drawReconciliationBlock(doc, y, context);
    }
    if (context.settlement.lines.some((l): boolean => l.code === 'INDEMNIZACION')) {
      y = this.drawLegalValidationBlock(doc, y, context);
    }
    if (context.settlement.approvedBy || context.settlement.approvedAt) {
      y = this.drawApprovalBlock(doc, y, context);
    }
    if (context.settlement.paidBy || context.settlement.paymentReference) {
      y = this.drawPaymentBlock(doc, y, context);
    }

    this.drawFooter(doc, y, context);
  }

  private ensureSpace(doc: PDFKit.PDFDocument, y: number, needed: number): number {
    if (y + needed > PAGE_HEIGHT - MARGIN - FOOTER_BUFFER) {
      doc.addPage();
      return MARGIN;
    }
    return y;
  }

  private drawSectionTitle(doc: PDFKit.PDFDocument, y: number, title: string): number {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(title, MARGIN, y, {
      width: CONTENT_WIDTH,
    });
    doc
      .moveTo(MARGIN, doc.y + 2)
      .lineTo(MARGIN + CONTENT_WIDTH, doc.y + 2)
      .strokeColor(BORDER)
      .lineWidth(0.5)
      .stroke();
    return doc.y + 10;
  }

  private drawHeader(doc: PDFKit.PDFDocument, context: ReceiptContext): number {
    const { tenant, logoBuffer } = context;
    const logoSize = 40;

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, MARGIN, MARGIN, { fit: [logoSize, logoSize] });
      } catch (error) {
        this.logger.warn(`No se pudo dibujar el logo del tenant: ${String(error)}`);
      }
    }

    const textLeft = MARGIN + logoSize + 12;
    const textWidth = CONTENT_WIDTH - logoSize - 12;
    let cursorY = MARGIN;

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#000000')
      .text(tenant.legalName ?? tenant.tradeName ?? tenant.name, textLeft, cursorY, {
        width: textWidth,
      });
    cursorY = doc.y + 2;

    doc.font('Helvetica').fontSize(8.5).fillColor('#444444');
    if (tenant.nit) {
      doc.text(`NIT ${tenant.nit}`, textLeft, cursorY, { width: textWidth });
      cursorY = doc.y + 1;
    }
    if (tenant.address || tenant.city) {
      doc.text([tenant.address, tenant.city].filter(Boolean).join(', '), textLeft, cursorY, {
        width: textWidth,
      });
      cursorY = doc.y + 1;
    }
    doc.fillColor('#000000');

    const titleY = Math.max(cursorY + 10, MARGIN + logoSize + 10);
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('COMPROBANTE DE LIQUIDACIÓN DEFINITIVA DE CONTRATO', MARGIN, titleY, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor('#444444')
      .text(`Liquidación ${context.settlement.id}`, MARGIN, doc.y + 4, {
        width: CONTENT_WIDTH,
        align: 'center',
      })
      .fillColor('#000000');

    return doc.y + 14;
  }

  private drawEmployeeBlock(doc: PDFKit.PDFDocument, y: number, context: ReceiptContext): number {
    const { settlement } = context;
    const employee = settlement.employee;
    const columnWidth = (CONTENT_WIDTH - 20) / 2;
    const leftX = MARGIN;
    const rightX = MARGIN + columnWidth + 20;

    let cursorY = this.drawSectionTitle(doc, y, 'EMPLEADO Y CONTRATO');

    const startY = cursorY;
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    const employeeLines = [
      `Nombre: ${employee.name}`,
      `Documento: ${employee.user.documentType} ${employee.user.cedula}`,
      `Cargo: ${employee.position}`,
      `Área / Departamento: ${employee.area} / ${employee.department}`,
    ];
    for (const line of employeeLines) {
      doc.text(line, leftX, cursorY, { width: columnWidth });
      cursorY = doc.y + 3;
    }

    let rightY = startY;
    const contractLines = [
      `Tipo de contrato: ${settlement.snapshotContractType}`,
      `Inicio de contrato: ${formatDate(settlement.snapshotContractStartDate)}`,
      `Fin pactado: ${formatDate(settlement.snapshotAgreedEndDate)}`,
      `Fecha de terminación: ${formatDate(settlement.effectiveTerminationDate)}`,
      `Causal: ${TERMINATION_REASON_LABELS[settlement.terminationReason]}`,
    ];
    for (const line of contractLines) {
      doc.text(line, rightX, rightY, { width: columnWidth });
      rightY = doc.y + 3;
    }

    return Math.max(cursorY, rightY) + 6;
  }

  private drawStatusBlock(doc: PDFKit.PDFDocument, y: number, context: ReceiptContext): number {
    const { settlement } = context;
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#000000')
      .text(
        `Estado: ${STATUS_LABELS[settlement.status]}   ·   Modalidad: ${MODE_LABELS[settlement.mode]}`,
        MARGIN,
        y,
        { width: CONTENT_WIDTH },
      );
    return doc.y + 10;
  }

  private drawLinesTable(doc: PDFKit.PDFDocument, y: number, context: ReceiptContext): number {
    const { settlement } = context;
    let cursorY = this.drawSectionTitle(doc, y, 'DESGLOSE DE DEVENGADOS Y DEDUCCIONES');

    const columns = [
      { header: 'Código', width: 80, align: 'left' as const },
      { header: 'Concepto', width: 150, align: 'left' as const },
      { header: 'Base', width: 75, align: 'right' as const },
      { header: 'Cant./Días', width: 60, align: 'right' as const },
      { header: 'Tasa', width: 55, align: 'right' as const },
      { header: 'Monto', width: 95, align: 'right' as const },
    ];
    const tableWidth = columns.reduce((sum, col): number => sum + col.width, 0);

    const drawHeaderRow = (rowY: number): number => {
      doc.rect(MARGIN, rowY, tableWidth, 16).fill(HEADER_BG);
      let x = MARGIN;
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
      for (const col of columns) {
        doc.text(col.header, x + 3, rowY + 4, { width: col.width - 6, align: col.align });
        x += col.width;
      }
      doc.fillColor('#000000');
      return rowY + 16;
    };

    const drawRow = (rowY: number, values: string[], isEven: boolean, isBold = false): number => {
      doc.rect(MARGIN, rowY, tableWidth, 14).fill(isEven ? ALT_ROW : '#ffffff');
      let x = MARGIN;
      doc
        .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(7.5)
        .fillColor('#000000');
      values.forEach((value, index): void => {
        const col = columns[index];
        doc.text(value, x + 3, rowY + 3, {
          width: col.width - 6,
          align: col.align,
          lineBreak: false,
        });
        x += col.width;
      });
      return rowY + 14;
    };

    for (const lineType of [SettlementLineType.DEVENGO, SettlementLineType.DEDUCCION]) {
      const lines = settlement.lines.filter((line): boolean => line.type === lineType);

      cursorY = this.ensureSpace(doc, cursorY, 30);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor('#000000')
        .text(LINE_TYPE_LABELS[lineType], MARGIN, cursorY, { width: CONTENT_WIDTH });
      cursorY = doc.y + 4;

      if (lines.length === 0) {
        doc
          .font('Helvetica-Oblique')
          .fontSize(8)
          .fillColor('#666666')
          .text(`Sin ${LINE_TYPE_LABELS[lineType].toLowerCase()}`, MARGIN, cursorY, {
            width: CONTENT_WIDTH,
          })
          .fillColor('#000000');
        cursorY = doc.y + 8;
        continue;
      }

      cursorY = this.ensureSpace(doc, cursorY, 16 + lines.length * 14);
      cursorY = drawHeaderRow(cursorY);

      lines.forEach((line, index): void => {
        cursorY = this.ensureSpace(doc, cursorY, 14);
        if (cursorY === MARGIN) {
          cursorY = drawHeaderRow(cursorY);
        }
        cursorY = drawRow(
          cursorY,
          [
            line.code,
            line.name + (line.manualJustification ? ` (${line.manualJustification})` : ''),
            formatCOP(line.baseAmount),
            line.quantity ? line.quantity.toString() : '—',
            line.rate ? line.rate.toString() : '—',
            formatCOP(line.amount),
          ],
          index % 2 === 0,
        );
      });

      cursorY += 8;
    }

    return cursorY;
  }

  private drawTotals(doc: PDFKit.PDFDocument, y: number, context: ReceiptContext): number {
    const { settlement } = context;
    const rowWidth = CONTENT_WIDTH;
    let cursorY = this.ensureSpace(doc, y, 60);

    const rows: Array<{ label: string; value: string; bold?: boolean; color?: string }> = [
      { label: 'Total devengos', value: formatCOP(settlement.grossDevengados) },
      { label: 'Total deducciones', value: formatCOP(settlement.totalDeducciones) },
      { label: 'Neto a pagar', value: formatCOP(settlement.netAmount), bold: true },
    ];

    if (
      settlement.snapshotNetNegativeAmount &&
      !settlement.snapshotNetNegativeAmount.equals(new Prisma.Decimal(0))
    ) {
      rows.push({
        label: 'Saldo a cargo del empleado',
        value: formatCOP(settlement.snapshotNetNegativeAmount),
        bold: true,
        color: NEGATIVE_COLOR,
      });
    }

    for (const row of rows) {
      doc.rect(MARGIN, cursorY, rowWidth, 16).fill(row.bold ? TOTALS_ROW : '#ffffff');
      doc
        .font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor(row.color ?? '#000000');
      doc.text(row.label, MARGIN + 6, cursorY + 4, { width: rowWidth - 140 });
      doc.text(row.value, MARGIN + rowWidth - 130, cursorY + 4, { width: 124, align: 'right' });
      cursorY += 16;
    }
    doc.fillColor('#000000');

    return cursorY + 10;
  }

  private drawManualSupportBlock(
    doc: PDFKit.PDFDocument,
    y: number,
    context: ReceiptContext,
  ): number {
    const { settlement } = context;
    let cursorY = this.ensureSpace(doc, y, 50);
    cursorY = this.drawSectionTitle(doc, cursorY, 'SOPORTE DE LIQUIDACIÓN MANUAL');

    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    const lines = [
      `Justificación: ${settlement.manualJustification ?? '—'}`,
      `Referencia: ${settlement.manualReference ?? '—'}`,
      `Responsable: ${settlement.manualResponsible ?? '—'}`,
    ];
    for (const line of lines) {
      doc.text(line, MARGIN, cursorY, { width: CONTENT_WIDTH });
      cursorY = doc.y + 3;
    }
    return cursorY + 8;
  }

  private drawReconciliationBlock(
    doc: PDFKit.PDFDocument,
    y: number,
    context: ReceiptContext,
  ): number {
    const { reconciliation } = context;
    let cursorY = this.ensureSpace(doc, y, 50);
    cursorY = this.drawSectionTitle(doc, cursorY, 'CONCILIACIÓN DE SALARIO PENDIENTE');

    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    if (!reconciliation) {
      doc
        .font('Helvetica-Oblique')
        .fillColor('#666666')
        .text(
          'Sin reconciliación registrada al momento de generar este comprobante.',
          MARGIN,
          cursorY,
          {
            width: CONTENT_WIDTH,
          },
        )
        .fillColor('#000000');
      return doc.y + 8;
    }

    const lines = [
      `Monto previamente pagado: ${formatCOP(reconciliation.previouslyPaidAmount)}`,
      `Saldo reconocido: ${formatCOP(reconciliation.recognizedBalance)}`,
      reconciliation.paymentReference
        ? `Referencia de pago: ${reconciliation.paymentReference}`
        : null,
      reconciliation.paymentDate
        ? `Fecha de pago: ${formatDate(reconciliation.paymentDate)}`
        : null,
      `Responsable: ${reconciliation.responsible}`,
      `Observación: ${reconciliation.observation}`,
    ].filter((line): line is string => line !== null);

    for (const line of lines) {
      doc.text(line, MARGIN, cursorY, { width: CONTENT_WIDTH });
      cursorY = doc.y + 3;
    }
    return cursorY + 8;
  }

  private drawLegalValidationBlock(
    doc: PDFKit.PDFDocument,
    y: number,
    context: ReceiptContext,
  ): number {
    const { settlement, legalValidation } = context;
    let cursorY = this.ensureSpace(doc, y, 40);
    cursorY = this.drawSectionTitle(
      doc,
      cursorY,
      'VALIDACIÓN LEGAL DE LA FÓRMULA DE INDEMNIZACIÓN',
    );

    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    doc.text(`Versión de fórmula aplicada: ${settlement.snapshotFormulaVersion}`, MARGIN, cursorY, {
      width: CONTENT_WIDTH,
    });
    cursorY = doc.y + 3;

    if (legalValidation) {
      doc.text(`Referencia legal: ${legalValidation.legalReference}`, MARGIN, cursorY, {
        width: CONTENT_WIDTH,
      });
      cursorY = doc.y + 3;
      doc.text(
        `Validada por ${legalValidation.validatedBy} el ${formatDate(legalValidation.validatedAt)}`,
        MARGIN,
        cursorY,
        { width: CONTENT_WIDTH },
      );
      cursorY = doc.y + 3;
    } else {
      doc
        .font('Helvetica-Oblique')
        .fillColor('#666666')
        .text(
          'Sin validación legal activa registrada al momento de generar este comprobante.',
          MARGIN,
          cursorY,
          {
            width: CONTENT_WIDTH,
          },
        )
        .fillColor('#000000');
      cursorY = doc.y + 3;
    }

    return cursorY + 8;
  }

  private drawApprovalBlock(doc: PDFKit.PDFDocument, y: number, context: ReceiptContext): number {
    const { settlement } = context;
    let cursorY = this.ensureSpace(doc, y, 30);
    cursorY = this.drawSectionTitle(doc, cursorY, 'APROBACIÓN');

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#000000')
      .text(
        `Aprobada por ${settlement.approvedBy ?? '—'} el ${formatDate(settlement.approvedAt)}`,
        MARGIN,
        cursorY,
        { width: CONTENT_WIDTH },
      );
    return doc.y + 8;
  }

  private drawPaymentBlock(doc: PDFKit.PDFDocument, y: number, context: ReceiptContext): number {
    const { settlement } = context;
    let cursorY = this.ensureSpace(doc, y, 40);
    cursorY = this.drawSectionTitle(doc, cursorY, 'PAGO');

    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    const lines = [
      settlement.paymentReference ? `Referencia de pago: ${settlement.paymentReference}` : null,
      settlement.paymentDate ? `Fecha de pago: ${formatDate(settlement.paymentDate)}` : null,
      settlement.paidBy
        ? `Registrado por: ${settlement.paidBy} el ${formatDate(settlement.paidAt)}`
        : null,
    ].filter((line): line is string => line !== null);

    for (const line of lines) {
      doc.text(line, MARGIN, cursorY, { width: CONTENT_WIDTH });
      cursorY = doc.y + 3;
    }
    return cursorY + 8;
  }

  private drawFooter(doc: PDFKit.PDFDocument, y: number, context: ReceiptContext): void {
    const cursorY = this.ensureSpace(doc, y, 30);
    doc
      .font('Helvetica-Oblique')
      .fontSize(7.5)
      .fillColor('#666666')
      .text(
        `Documento generado automáticamente el ${formatDate(context.generatedAt)} a partir de los ` +
          'registros del sistema. Comprobante informativo — no constituye acta de paz y salvo ni ' +
          'declaración de liberación de responsabilidad.',
        MARGIN,
        cursorY,
        { width: CONTENT_WIDTH, align: 'center' },
      )
      .fillColor('#000000');
  }
}
