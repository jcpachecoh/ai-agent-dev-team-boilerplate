import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { CollaboratorExportRow } from '../interfaces/attendance-collaborators.interfaces';

const DARK_BLUE = { argb: 'FF1A3A5C' };
const WHITE = { argb: 'FFFFFFFF' };
const ALT_ROW = { argb: 'FFF5F6F8' };

const SOLID = (fgColor: { argb: string }): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: fgColor as ExcelJS.Color,
});

// [label, width, row key]
const COLUMNS: [string, number, keyof CollaboratorExportRow][] = [
  ['Documento de identidad', 18, 'cedula'],
  ['Primer apellido', 18, 'primerApellido'],
  ['Segundo apellido', 18, 'segundoApellido'],
  ['Nombre', 26, 'name'],
  ['Especialidad', 20, 'positionName'],
  ['Área', 16, 'area'],
  ['Supervisor', 24, 'supervisorsLabel'],
  ['Contrato', 16, 'contractType'],
  ['Turno', 18, 'turnoLabel'],
  ['Portal trabajador', 16, 'portalLabel'],
];

@Injectable()
export class AttendanceCollaboratorsExcelService {
  async generateXlsx(rows: CollaboratorExportRow[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RestOpsIQ';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Colaboradores', {
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    sheet.columns = COLUMNS.map(([, width]) => ({ width }));

    const titleRow = sheet.addRow(['LISTADO DE COLABORADORES']);
    titleRow.font = { bold: true, size: 13 };
    sheet.mergeCells(1, 1, 1, COLUMNS.length);

    const genDate = new Date().toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    sheet.addRow([`Generado: ${genDate}`]);
    sheet.addRow([`Registros: ${rows.length}`]);
    sheet.addRow([]);

    const headerRow = sheet.addRow(COLUMNS.map(([label]) => label));
    headerRow.font = { bold: true, color: WHITE };
    headerRow.fill = SOLID(DARK_BLUE);
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    rows.forEach((row, index) => {
      const dataRow = sheet.addRow(COLUMNS.map(([, , key]) => row[key]));
      if (index % 2 === 0) {
        dataRow.fill = SOLID(ALT_ROW);
      }
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }
}
