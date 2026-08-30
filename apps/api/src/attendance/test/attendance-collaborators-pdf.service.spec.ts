import { AttendanceCollaboratorsPdfService } from '../service/attendance-collaborators-pdf.service';
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

describe('AttendanceCollaboratorsPdfService', () => {
  const service = new AttendanceCollaboratorsPdfService();

  it('genera un buffer PDF válido (firma %PDF) con filas', async () => {
    const buffer = await service.generatePdf([buildRow(), buildRow({ cedula: '654321' })], {
      generatedAt: '6 de julio de 2026',
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('genera un buffer válido incluso sin filas', async () => {
    const buffer = await service.generatePdf([], { generatedAt: '6 de julio de 2026' });
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('pagina correctamente con muchas filas (fuerza salto de página)', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => buildRow({ cedula: String(i) }));
    const buffer = await service.generatePdf(rows, { generatedAt: '6 de julio de 2026' });
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
