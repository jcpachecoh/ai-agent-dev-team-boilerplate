import * as ExcelJS from 'exceljs';
import { AttendanceCollaboratorsExcelService } from '../service/attendance-collaborators-excel.service';
import type { CollaboratorExportRow } from '../interfaces/attendance-collaborators.interfaces';

function buildRow(overrides: Partial<CollaboratorExportRow> = {}): CollaboratorExportRow {
  return {
    cedula: '123456',
    primerApellido: 'Pérez',
    segundoApellido: 'Gómez',
    name: 'Ana Pérez',
    positionName: 'Cocinero',
    area: 'Cocina',
    supervisorsLabel: 'Carlos Ruiz',
    contractType: 'INDEFINIDO',
    turnoLabel: 'TM 06:00-14:00',
    portalLabel: 'No',
    ...overrides,
  };
}

describe('AttendanceCollaboratorsExcelService', () => {
  const service = new AttendanceCollaboratorsExcelService();

  it('genera un buffer .xlsx válido con encabezados y una fila por colaborador', async () => {
    const buffer = await service.generateXlsx([buildRow(), buildRow({ cedula: '654321' })]);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet('Colaboradores');
    expect(sheet).toBeDefined();

    const headerRow = sheet!.getRow(5).values as unknown[];
    expect(headerRow).toContain('Documento de identidad');
    expect(headerRow).toContain('Portal trabajador');

    // fila 1: título, 2: generado, 3: registros, 4: vacía, 5: header, 6-7: datos
    expect(sheet!.getRow(6).getCell(1).value).toBe('123456');
    expect(sheet!.getRow(7).getCell(1).value).toBe('654321');
  });

  it('produce un buffer vacío-de-datos (solo encabezado) cuando no hay filas', async () => {
    const buffer = await service.generateXlsx([]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.getWorksheet('Colaboradores');
    expect(sheet!.rowCount).toBe(5);
  });
});
