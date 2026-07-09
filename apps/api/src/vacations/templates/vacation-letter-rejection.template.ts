import type PDFKit from 'pdfkit';

import type { VacationLetterContext } from '../interfaces/vacation-letter.interfaces';
import { formatDateShort } from './vacation-letter-format.utils';
import {
  drawHrSignatureBlock,
  drawRecipientBlock,
  drawTenantLogo,
  getContentLeft,
  getContentWidth,
} from './vacation-letter-pdf.shared';

export function renderVacationRejectionLetter(
  doc: PDFKit.PDFDocument,
  context: VacationLetterContext,
): void {
  const left = getContentLeft(doc);
  const width = getContentWidth(doc);
  const city = context.tenant.city ?? context.employee.city ?? 'Bogotá D.C.';
  const { day, month, weekday } = (() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
    const parts = formatter.formatToParts(context.letterDate);
    const weekdayMap: Record<string, string> = {
      Sun: 'Sunday',
      Mon: 'Monday',
      Tue: 'Tuesday',
      Wed: 'Wednesday',
      Thu: 'Thursday',
      Fri: 'Friday',
      Sat: 'Saturday',
    };
    return {
      day: parts.find((part) => part.type === 'day')?.value ?? '01',
      month: parts.find((part) => part.type === 'month')?.value ?? '01',
      weekday:
        weekdayMap[parts.find((part) => part.type === 'weekday')?.value ?? 'Mon'] ?? 'Monday',
    };
  })();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthName = monthNames[Number(month) - 1] ?? 'July';

  let y = doc.page.margins.top;
  const logoWidth = 56;
  const dateWidth = width - logoWidth - 12;

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#000000')
    .text(
      `${city}, ${weekday}, ${monthName} ${day}, ${context.letterDate.getFullYear()}`,
      left,
      y,
      {
        width: dateWidth,
        align: 'left',
      },
    );

  drawTenantLogo(doc, left + width - logoWidth, y - 2, logoWidth, 40, context);
  y = Math.max(doc.y, y + 42) + 12;

  y = drawRecipientBlock(doc, y, context);

  doc.font('Helvetica-Bold').fontSize(10).text('ASUNTO: Negación de aprobación', left, y, {
    width,
    align: 'right',
  });
  doc
    .moveTo(left, y + 12)
    .lineTo(left + width, y + 12)
    .strokeColor('#000000')
    .lineWidth(0.75)
    .stroke();
  y = y + 20;

  const requestDate = formatDateShort(context.request.createdAt);
  const startDate = formatDateShort(context.request.startDate);
  const endDate = formatDateShort(context.request.endDate);
  const rejectionReason = context.rejectionReason?.trim() || 'las condiciones establecidas';

  doc.font('Helvetica').fontSize(10);
  doc.text('En relación con su solicitud de vacaciones presentada el día ', left, y, {
    width,
    align: 'justify',
    continued: true,
  });
  doc.font('Helvetica-Bold').text(`${requestDate}`, { continued: true });
  doc
    .font('Helvetica')
    .text(
      `, referente al periodo comprendido entre el ${startDate} y el ${endDate}, se informa que no es posible aprobar el disfrute de las mismas, dado que el periodo solicitado no cumple con las condiciones establecidas en la política de vacaciones de la empresa, específicamente en lo relativo a `,
      { continued: true, width },
    );
  doc.font('Helvetica-Bold').text(`${rejectionReason}.`, { width, continued: false });
  y = doc.y + 10;

  doc.text(
    'En cumplimiento de nuestras políticas internas y con el fin de garantizar la correcta planificación de las actividades del área, le solicitamos reprogramar su solicitud de vacaciones de acuerdo con las disposiciones establecidas en la política y protocolo de Vacaciones.',
    left,
    y,
    { width, align: 'justify' },
  );
  y = doc.y + 10;

  doc.text(
    'Para cualquier consulta o ajuste de fechas, puede comunicarse con el área de Talento Humano al correo electrónico institucional ',
    left,
    y,
    { width, align: 'justify', continued: true },
  );
  doc
    .font('Helvetica-Bold')
    .text(context.hrSignatory.email, { width, continued: false, link: undefined });
  doc.font('Helvetica');
  y = doc.y + 12;

  doc.text('Apreciamos su compromiso con la compañía.', left, y, { width, align: 'justify' });
  y = doc.y + 12;

  drawHrSignatureBlock(doc, y, context);
}
