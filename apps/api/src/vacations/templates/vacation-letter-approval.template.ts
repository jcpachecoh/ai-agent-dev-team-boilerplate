import type PDFKit from 'pdfkit';

import type { VacationLetterContext } from '../interfaces/vacation-letter.interfaces';
import {
  VACATION_LETTER_FORM_CODE,
  VACATION_LETTER_FORM_VERSION,
} from '../interfaces/vacation-letter.interfaces';
import {
  formatDateShort,
  formatDateUsShort,
  formatDaysCount,
  formatReturnToWorkDate,
} from './vacation-letter-format.utils';
import {
  drawCenteredSectionTitle,
  drawHrSignatureBlock,
  drawLetterDateLine,
  drawRecipientBlock,
  drawTenantLogo,
  getContentLeft,
  getContentWidth,
  LETTER_BORDER,
  LETTER_MARGIN,
} from './vacation-letter-pdf.shared';

const HEADER_HEIGHT = 72;

function drawApprovalHeaderTable(
  doc: PDFKit.PDFDocument,
  y: number,
  context: VacationLetterContext,
): number {
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  const col1 = Math.round(width * 0.28);
  const col2 = Math.round(width * 0.4);
  const col3 = width - col1 - col2;

  doc.rect(left, y, width, HEADER_HEIGHT).strokeColor(LETTER_BORDER).lineWidth(1).stroke();
  doc
    .moveTo(left + col1, y)
    .lineTo(left + col1, y + HEADER_HEIGHT)
    .stroke();
  doc
    .moveTo(left + col1 + col2, y)
    .lineTo(left + col1 + col2, y + HEADER_HEIGHT)
    .stroke();

  drawTenantLogo(doc, left + 10, y + 10, 42, 42, context);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#000000')
    .text('Palos de Leña', left + 8, y + 48, { width: col1 - 16, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(8)
    .text('RESTAURANTES', left + 8, doc.y, {
      width: col1 - 16,
      align: 'center',
    });

  const legalName = context.tenant.legalName || context.tenant.tradeName || 'INVERSIONES LLANES';
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('FORMATO APROBACION DE VACACIONES', left + col1 + 8, y + 14, {
      width: col2 - 16,
      align: 'center',
    });
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(legalName.toUpperCase(), left + col1 + 8, y + 44, {
      width: col2 - 16,
      align: 'center',
    });

  const metaX = left + col1 + col2 + 6;
  const metaWidth = col3 - 10;
  const issueDate = formatDateShort(context.letterDate);
  doc
    .font('Helvetica')
    .fontSize(8)
    .text(`Código: ${VACATION_LETTER_FORM_CODE}`, metaX, y + 12, {
      width: metaWidth,
      align: 'left',
    });
  doc.text(`Versión: ${VACATION_LETTER_FORM_VERSION}`, metaX, doc.y + 2, {
    width: metaWidth,
    align: 'left',
  });
  doc.text(`Fecha: ${issueDate}`, metaX, doc.y + 2, { width: metaWidth, align: 'left' });

  return y + HEADER_HEIGHT + 14;
}

function drawLabelValueLine(
  doc: PDFKit.PDFDocument,
  y: number,
  label: string,
  value: string,
): number {
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
  doc.text(`${label}: `, left, y, { continued: true, width });
  doc.font('Helvetica').text(value, { width, continued: false });
  return doc.y + 4;
}

function drawSubjectLine(doc: PDFKit.PDFDocument, y: number): number {
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  const label = 'ASUNTO:';
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
  doc.text(label, left, y, { width, align: 'right' });
  doc
    .moveTo(left, y + 12)
    .lineTo(left + width, y + 12)
    .strokeColor(LETTER_BORDER)
    .lineWidth(0.75)
    .stroke();
  return y + 22;
}

export function renderVacationApprovalLetter(
  doc: PDFKit.PDFDocument,
  context: VacationLetterContext,
): void {
  doc.font('Helvetica').fontSize(10).fillColor('#000000');

  let y = LETTER_MARGIN;
  y = drawApprovalHeaderTable(doc, y, context);
  y = drawLetterDateLine(doc, y, context);
  y = drawRecipientBlock(doc, y, context);

  y = drawSubjectLine(doc, y);

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      'La presente es para notificar la aprobación de las vacaciones solicitadas que corresponden al periodo',
      getContentLeft(doc),
      y,
      { width: getContentWidth(doc), align: 'justify' },
    );
  y = doc.y + 8;

  y = drawLabelValueLine(doc, y, 'PERIODO INICIO', formatDateUsShort(context.accrualPeriod.start));
  y = drawLabelValueLine(doc, y, 'PERIODO FINAL', formatDateUsShort(context.accrualPeriod.end));

  y = drawCenteredSectionTitle(doc, y + 6, '1. PERIODO DE DISFRUTE DE VACACIONES');
  y = drawLabelValueLine(
    doc,
    y,
    'FECHA DE INICIO DE VACACIONES',
    formatDateUsShort(context.request.startDate),
  );
  y = drawLabelValueLine(
    doc,
    y,
    'FECHA FINAL DE VACACIONES',
    formatDateUsShort(context.request.endDate),
  );
  y = drawLabelValueLine(
    doc,
    y,
    'REINTEGRO LABORAL',
    formatReturnToWorkDate(context.returnToWorkDate),
  );
  y = drawLabelValueLine(
    doc,
    y,
    'NUMERO TOTAL DE DIAS',
    formatDaysCount(context.request.daysRequested),
  );

  y = drawCenteredSectionTitle(doc, y + 6, '2. PERIODO DE PAGO EN DINERO DE VACACIONES');
  y = drawLabelValueLine(doc, y, 'NUMERO DE DIAS', String(context.cashCompensationDays));

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      'Estos serán cancelados proporcionalmente a su cuenta de nómina dentro de 5 días hábiles de iniciar con su periodo.',
      getContentLeft(doc),
      y,
      { width: getContentWidth(doc), align: 'justify' },
    );
  y = doc.y + 10;

  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      'En nombre de empresa Palos de Leña, le deseamos que disfrute un provechoso y merecido descanso.',
      getContentLeft(doc),
      y,
      { width: getContentWidth(doc), align: 'justify', underline: true },
    );
  y = doc.y + 10;

  doc.text('Apreciamos su compromiso con la compañía.', getContentLeft(doc), y, {
    width: getContentWidth(doc),
    align: 'justify',
  });
  y = doc.y + 12;

  drawHrSignatureBlock(doc, y, context, { includeEmployeeSignature: true });
}
