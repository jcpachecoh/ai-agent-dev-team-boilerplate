import type PDFKit from 'pdfkit';

import type { VacationLetterContext } from '../interfaces/vacation-letter.interfaces';
import { formatLetterDateLong } from './vacation-letter-format.utils';

export const LETTER_MARGIN = 40;
export const LETTER_PAGE_WIDTH = 595.28;
export const LETTER_CONTENT_WIDTH = LETTER_PAGE_WIDTH - LETTER_MARGIN * 2;
export const LETTER_BORDER = '#000000';

export function getContentLeft(doc: PDFKit.PDFDocument): number {
  return doc.page.margins.left;
}

export function getContentWidth(doc: PDFKit.PDFDocument): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

export function drawRecipientBlock(
  doc: PDFKit.PDFDocument,
  y: number,
  context: VacationLetterContext,
): number {
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  let cursorY = y;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
  doc.text('Señor(a)', left, cursorY, { width });
  cursorY = doc.y + 4;

  doc.font('Helvetica-Bold').fontSize(10);
  const lines = [
    context.employee.fullName.toUpperCase(),
    context.employee.cedula,
    context.employee.position.toUpperCase(),
    context.employee.email,
    context.employee.city,
  ];

  for (const line of lines) {
    doc.text(line, left, cursorY, { width });
    cursorY = doc.y + 2;
  }

  return cursorY + 8;
}

export function drawHrSignatureBlock(
  doc: PDFKit.PDFDocument,
  y: number,
  context: VacationLetterContext,
  options?: { includeEmployeeSignature?: boolean },
): number {
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  const columnGap = 24;
  const columnWidth = options?.includeEmployeeSignature ? (width - columnGap) / 2 : width;

  doc.font('Helvetica').fontSize(10).fillColor('#000000');
  doc.text('Cordialmente,', left, y, { width });

  const lineY = doc.y + 28;
  const rightColumnX = options?.includeEmployeeSignature ? left + columnWidth + columnGap : left;

  doc
    .moveTo(left, lineY)
    .lineTo(left + columnWidth, lineY)
    .strokeColor(LETTER_BORDER)
    .lineWidth(1)
    .stroke();

  let textY = lineY + 8;
  doc.font('Helvetica-Bold').fontSize(10).text(context.hrSignatory.name, left, textY, {
    width: columnWidth,
  });
  textY = doc.y + 2;
  doc.font('Helvetica').fontSize(10).text(context.hrSignatory.title, left, textY, {
    width: columnWidth,
  });
  textY = doc.y + 2;
  doc.fillColor('#1155cc').text(context.hrSignatory.email, left, textY, {
    width: columnWidth,
    link: `mailto:${context.hrSignatory.email}`,
    underline: true,
  });
  doc.fillColor('#000000');

  if (options?.includeEmployeeSignature) {
    doc
      .moveTo(rightColumnX, lineY)
      .lineTo(rightColumnX + columnWidth, lineY)
      .strokeColor(LETTER_BORDER)
      .lineWidth(1)
      .stroke();
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#000000')
      .text('Firma del empleado', rightColumnX, lineY + 8, {
        width: columnWidth,
        align: 'center',
      });
  }

  return doc.y + 12;
}

export function drawTenantLogo(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  context: VacationLetterContext,
): void {
  if (context.logoBuffer) {
    doc.image(context.logoBuffer, x, y, {
      fit: [maxWidth, maxHeight],
    });
    return;
  }

  const radius = 16;
  const centerX = x + radius;
  const centerY = y + radius;
  doc.circle(centerX, centerY, radius).strokeColor(LETTER_BORDER).lineWidth(1).stroke();
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#000000')
    .text('PL', centerX - 10, centerY - 6, { width: 20, align: 'center' });
}

export function drawLetterDateLine(
  doc: PDFKit.PDFDocument,
  y: number,
  context: VacationLetterContext,
): number {
  const city = context.tenant.city ?? context.employee.city ?? 'Bogotá D.C.';
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#000000')
    .text(formatLetterDateLong(context.letterDate, city), left, y, { width });
  return doc.y + 10;
}

export function drawCenteredSectionTitle(
  doc: PDFKit.PDFDocument,
  y: number,
  title: string,
): number {
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  doc.font('Helvetica-Bold').fontSize(10).text(title, left, y, { width, align: 'center' });
  return doc.y + 8;
}
