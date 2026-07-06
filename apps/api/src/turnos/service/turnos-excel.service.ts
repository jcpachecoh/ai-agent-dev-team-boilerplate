import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

import type { TurnoRecord } from '../interfaces/turnos.interfaces';
import { TURNO_EXPORT_COLUMNS } from '../turnos.constants';

/** Colores compartidos con otros generadores de Excel del módulo Turnos (ver turno-assignments-template.service.ts). */
export const TURNOS_EXCEL_DARK_BLUE = { argb: 'FF1A3A5C' };
export const TURNOS_EXCEL_WHITE = { argb: 'FFFFFFFF' };

export const solidFill = (fgColor: { argb: string }): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: fgColor as ExcelJS.Color,
});

const DARK_BLUE = TURNOS_EXCEL_DARK_BLUE;
const WHITE = TURNOS_EXCEL_WHITE;
const SOLID = solidFill;

@Injectable()
export class TurnosExcelService {
  async generateTurnosXlsx(turnos: TurnoRecord[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestOpsIQ';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Turnos', {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    sheet.columns = TURNO_EXPORT_COLUMNS.map((label): { header: string; width: number } => ({
      header: label,
      width: label === 'Nombre' ? 32 : 18,
    }));

    const headerRow = sheet.getRow(1);
    headerRow.values = [...TURNO_EXPORT_COLUMNS];
    headerRow.font = { bold: true, color: WHITE };
    headerRow.fill = SOLID(DARK_BLUE);
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    for (const turno of turnos) {
      sheet.addRow([
        turno.nombre,
        turno.sigla,
        turno.tipo,
        turno.jornada,
        turno.horaInicio,
        turno.horaFin,
        turno.estado ? 'Activo' : 'Inactivo',
      ]);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
