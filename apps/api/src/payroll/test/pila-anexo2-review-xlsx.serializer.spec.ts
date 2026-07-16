import ExcelJS from 'exceljs';

import { buildCleanPilaDraft } from '../pila/serializer/fixtures/pila-clean-draft.fixture';
import { PilaAnexo2ReviewXlsxSerializer } from '../pila/serializer/pila-anexo2-review-xlsx.serializer';
import { PilaFixedWidthSerializer } from '../pila/serializer/pila-fixed-width.serializer';

describe('PilaAnexo2ReviewXlsxSerializer', () => {
  const serializer = new PilaAnexo2ReviewXlsxSerializer();

  it('abre en Cotizantes y trae todas las hojas del anexo', async () => {
    const draft = buildCleanPilaDraft();
    const out = await serializer.serializeAsync(draft, { version: 1 });

    expect(out.suggestedFileName).toMatch(/anexo2-revision\.xlsx$/);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(out.bytes as unknown as ExcelJS.Buffer);

    expect(wb.worksheets.map((s) => s.name)).toEqual([
      'Cotizantes (tipo 2)',
      'Encabezado (tipo 1)',
      'Archivo plano (líneas)',
      'Totales',
    ]);

    const cotizantes = wb.getWorksheet('Cotizantes (tipo 2)')!;
    expect(cotizantes.getCell('D2').value).toBe(draft.cotizantes[0]!.documentNumber);
    expect(cotizantes.rowCount).toBe(1 + draft.cotizantes.length);

    const plano = wb.getWorksheet('Archivo plano (líneas)')!;
    const flat = new PilaFixedWidthSerializer().serialize(draft, { version: 1 });
    const expectedLines = flat.bytes
      .toString('latin1')
      .split(/\r?\n/)
      .filter((line) => line.length > 0);
    expect(plano.rowCount).toBe(1 + expectedLines.length);
    expect(plano.getCell('D2').value).toBe(expectedLines[0]);
  });
});
